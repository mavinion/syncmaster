import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../../utils/encryption';
import { AppleCalendarService } from '../sync/apple.service';

const router = Router();
const prisma = new PrismaClient();

// Google OAuth
router.get('/google', (req, res, next) => {
    const { platform } = req.query;
    const state = platform ? JSON.stringify({ platform }) : undefined;

    passport.authenticate('google', {
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
        accessType: 'offline',
        prompt: 'consent',
        state
    })(req, res, next);
});

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        const user = req.user as any;
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d',
        });

        // Check state for mobile platform
        let platform = null;
        if (req.query.state) {
            try {
                const state = JSON.parse(req.query.state as string);
                platform = state.platform;
            } catch (e) {
                // Ignore parse errors
            }
        }

        if (platform === 'mobile') {
            return res.redirect(`app.calmesh://login-callback?token=${token}&userId=${user.id}`);
        }

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
        // Validate credentials first
        const appleService = new AppleCalendarService(appleId, appSpecificPassword);
        try {
            await appleService.discoverCalendarUrl();

            // Log success
            await prisma.syncLog.create({
                data: {
                    userId,
                    level: 'INFO',
                    message: 'Apple Calendar Setup Success',
                    details: JSON.stringify(appleService.logs),
                    source: 'MANUAL'
                }
            });

        } catch (e: any) {
            console.error('Apple validation failed:', e);
            console.error('--- Apple Service Logs (Start) ---');
            appleService.logs.forEach(log => console.error(log));
            console.error('--- Apple Service Logs (End) ---');

            // Log failure to DB, but don't let it crash the request
            try {
                await prisma.syncLog.create({
                    data: {
                        userId,
                        level: 'ERROR',
                        message: 'Apple Calendar Setup Failed',
                        details: JSON.stringify(appleService.logs),
                        source: 'MANUAL'
                    }
                });
            } catch (dbError) {
                console.error('Failed to write error log to database:', dbError);
            }

            return res.status(401).json({
                error: 'Invalid Apple ID or App-Specific Password',
                logs: appleService.logs
            });
        }

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

// Disconnect Account
router.delete('/:provider', async (req, res) => {
    const { provider } = req.params;
    const { userId } = req.body; // Or from query if you prefer

    if (!userId || !['google', 'apple'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    try {
        await prisma.account.deleteMany({
            where: {
                userId,
                provider
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting account:', error);
        res.status(500).json({ error: 'Failed to disconnect account' });
    }
});

export default router;
