import { Router } from 'express';
import { syncQueue } from './sync.worker';

const router = Router();

router.post('/trigger', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        await syncQueue.add('manual-sync', { userId });
        res.json({ success: true, message: 'Sync job scheduled' });
    } catch (error) {
        console.error('Failed to schedule sync:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
