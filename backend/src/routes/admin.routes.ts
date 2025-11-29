import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { basicAuth } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

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
        // In a real app, check against a whitelist of allowed tables
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
            return res.status(400).json({ error: 'Invalid table name' });
        }

        // Use unsafe query because table name cannot be parameterized in Prisma
        // We validated the table name above
        const data = await prisma.$queryRawUnsafe(`
            SELECT * FROM "${tableName}" 
            LIMIT ${Number(limit)} 
            OFFSET ${Number(offset)}
        `);

        res.json(data);
    } catch (error) {
        console.error(`Error fetching table ${req.params.tableName}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
