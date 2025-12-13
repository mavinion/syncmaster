import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { basicAuth } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Helper to log admin actions
const logAdminAction = async (action: string, details: any, req: any) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        // Use unchecked types or raw query if model update isn't propagated yet
        // But assuming prisma generate works:
        // @ts-ignore - adminAuditLog might not be in types if schema push failed
        if (prisma.adminAuditLog) {
            await prisma.adminAuditLog.create({
                data: {
                    action,
                    details: JSON.stringify(details),
                    ipAddress: String(ip),
                    userAgent: String(userAgent),
                }
            });
        }
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};

router.use(basicAuth);

// Get Logs
router.get('/logs', async (req, res) => {
    try {
        const { level, limit = 100 } = req.query;
        const where: any = {};

        if (level) {
            where.level = String(level);
        }

        const logs = await prisma.syncLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            include: {
                user: {
                    select: {
                        email: true,
                        name: true
                    }
                }
            }
        });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all table names
router.get('/tables', async (req, res) => {
    try {
        // Query to get all table names in the public schema
        const result = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;

        // @ts-ignore
        const tables = result.map((row: any) => row.table_name);
        res.json(tables);
    } catch (error) {
        console.error('Error fetching tables:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get table content
router.get('/tables/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        const { limit = 100, offset = 0 } = req.query;

        // Validate table name to prevent SQL injection (basic check)
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        // Use unsafe query because table name cannot be parameterized in Prisma
        const data = await prisma.$queryRawUnsafe(`
            SELECT * FROM "${tableName}" 
            LIMIT ${Number(limit)} 
            OFFSET ${Number(offset)}
        `);

        // Handle BigInt serialization
        const serialized = JSON.parse(JSON.stringify(data, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(serialized);
    } catch (error) {
        console.error(`Error fetching table ${req.params.tableName}: `, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get System Stats
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalLogs, errorLogs] = await Promise.all([
            prisma.user.count(),
            prisma.syncLog.count(),
            prisma.syncLog.count({ where: { level: 'ERROR' } })
        ]);

        res.json({
            totalUsers,
            totalLogs,
            errorCount: errorLogs
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Activity Stats (Last 7 days)
router.get('/activity', async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
        startDate.setHours(0, 0, 0, 0);

        // Group by day using raw query for date trunc
        const result: any[] = await prisma.$queryRaw`
            SELECT
                DATE(created_at) as date,
                COUNT(*)::int as count
            FROM "SyncLog"
            WHERE created_at >= ${startDate}
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `;

        // Fill in missing days
        const activity = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayData = result.find((r: any) => {
                const rDate = new Date(r.date).toISOString().split('T')[0];
                return rDate === dateStr;
            });
            activity.push({
                date: dateStr,
                count: dayData ? dayData.count : 0
            });
        }

        res.json(activity);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Users (Paginated & Search)
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: String(search), mode: 'insensitive' } },
                { name: { contains: String(search), mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            syncLogs: true,
                            accounts: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete User
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Transaction to delete user and all related data
        await prisma.$transaction(async (tx) => {
            // Delete related data first
            await tx.syncLog.deleteMany({ where: { userId: id } });
            await tx.account.deleteMany({ where: { userId: id } });
            await tx.calendarMapping.deleteMany({ where: { userId: id } });
            await tx.eventMapping.deleteMany({ where: { userId: id } });
            await tx.syncJob.deleteMany({ where: { userId: id } });

            // Finally delete the user
            await tx.user.delete({ where: { id } });
        });

        // Audit Log
        await logAdminAction('DELETE_USER', { userId: id }, req);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Execute Raw SQL Query
router.post('/query', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // DANGEROUS: Execute raw SQL
        const result = await prisma.$queryRawUnsafe(query);

        // Audit Log
        await logAdminAction('SQL_QUERY', { query }, req);

        // Handle BigInt serialization
        const serialized = JSON.parse(JSON.stringify(result, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(serialized);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Query execution failed' });
    }
});

// Export Table to CSV
router.get('/tables/:tableName/export', async (req, res) => {
    try {
        const { tableName } = req.params;

        // Validate table name (basic whitelist check)
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        const data: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Table is empty or does not exist' });
        }

        // Generate CSV
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header];
                if (val === null || val === undefined) return '';
                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${tableName}_export.csv`);
        res.send(csvString);

        // Audit Log (after successful send start)
        logAdminAction('TABLE_EXPORT', { tableName }, req);
    } catch (error) {
        console.error('Error exporting table:', error);
        res.status(500).json({ error: 'Failed to export table' });
    }
});

// Get System Health Stats
router.get('/system', async (req, res) => {
    try {
        const os = require('os');

        // Check DB Connection
        let dbStatus = 'disconnected';
        try {
            await prisma.$queryRaw`SELECT 1`;
            dbStatus = 'connected';
        } catch (e) {
            console.error('DB Health Check Failed:', e);
        }

        const stats = {
            uptime: os.uptime(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
            },
            cpu: {
                load: os.loadavg(), // [1, 5, 15] min averages
                cores: os.cpus().length,
            },
            os: {
                platform: os.platform(),
                release: os.release(),
                type: os.type(),
                arch: os.arch(),
            },
            nodeVersion: process.version,
            dbStatus,
            timestamp: new Date().toISOString()
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Audit Logs
router.get('/audit-logs', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        // @ts-ignore - adminAuditLog might not be in types if schema push failed
        if (!prisma.adminAuditLog) {
            return res.json({ logs: [], pagination: { total: 0, page, limit, pages: 0 } });
        }

        // @ts-ignore
        const [logs, total] = await Promise.all([
            prisma.adminAuditLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.adminAuditLog.count()
        ]);

        // Serialize BigInt
        const serializedLogs = JSON.parse(JSON.stringify(logs, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        res.json({
            logs: serializedLogs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

export default router;
