import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get Sync Logs
router.get('/', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        const logs = await prisma.syncLog.findMany({
            where: { userId: String(userId) },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching sync logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
