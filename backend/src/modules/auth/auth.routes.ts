import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../../utils/encryption';

const router = Router();
const prisma = new PrismaClient();

// Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    accessType: 'offline',
    prompt: 'consent'
}));

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user as any;
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d',
        });

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
);

// Apple Credentials (for CalDAV)
router.post('/apple-credentials', async (req, res) => {
    const { userId, appleId, appSpecificPassword } = req.body;

    if (!userId || !appleId || !appSpecificPassword) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        const encryptedPassword = encrypt(appSpecificPassword);

        // Check if account exists
        const existingAccount = await prisma.account.findFirst({
            where: { userId, provider: 'apple' },
        });

        if (existingAccount) {
            await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                    providerId: appleId,
                    password: encryptedPassword,
                },
            });
        } else {
            await prisma.account.create({
                data: {
                    userId,
                    provider: 'apple',
                    providerId: appleId,
                    password: encryptedPassword,
                },
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: (error as Error).message || 'Internal server error' });
    }
});

// Get Account Status
router.get('/status', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        const accounts = await prisma.account.findMany({
            where: { userId: String(userId) },
        });

        const status = {
            google: accounts.some(a => a.provider === 'google'),
            apple: accounts.some(a => a.provider === 'apple'),
        };

        res.json(status);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
