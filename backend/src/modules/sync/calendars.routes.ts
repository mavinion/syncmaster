import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleCalendarService } from './google.service';
import { AppleCalendarService } from './apple.service';
import { decrypt, encrypt } from '../../utils/encryption';

const router = Router();
const prisma = new PrismaClient();

// List all calendars from both providers
router.get('/list', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    try {
        const accounts = await prisma.account.findMany({
            where: { userId: String(userId) },
        });

        const googleAccount = accounts.find(a => a.provider === 'google');
        const appleAccount = accounts.find(a => a.provider === 'apple');

        let googleCalendars: any[] = [];
        let appleCalendars: any[] = [];

        if (googleAccount) {
            console.log('Google Auth Check:', {
                userId,
                hasAccessToken: !!googleAccount.accessToken,
                hasRefreshToken: !!googleAccount.refreshToken
            });
            const googleService = new GoogleCalendarService(
                decrypt(googleAccount.accessToken!),
                googleAccount.refreshToken ? decrypt(googleAccount.refreshToken) : '',
                async (tokens) => {
                    console.log('Refreshing Google tokens for user', userId);
                    await prisma.account.update({
                        where: { id: googleAccount.id },
                        data: {
                            accessToken: encrypt(tokens.access_token!),
                            refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined // Keep old refresh token if not provided
                        }
                    });
                }
            );
            try {
                googleCalendars = await googleService.listCalendars();
            } catch (e) {
                console.error('Failed to list Google calendars', e);
            }
        }

        if (appleAccount) {
            const appleService = new AppleCalendarService(
                appleAccount.providerId!,
                decrypt(appleAccount.password!)
            );
            try {
                appleCalendars = await appleService.listCalendars();
            } catch (e) {
                console.error('Failed to list Apple calendars', e);
            }
        }

        // Fetch existing mappings to see what is enabled
        const mappings = await prisma.calendarMapping.findMany({
            where: { userId: String(userId) },
        });

        const response = {
            google: googleCalendars.map(c => ({
                id: c.id,
                summary: c.summary,
                syncEnabled: mappings.some(m => m.googleCalendarId === c.id && m.syncEnabled),
                syncDirection: mappings.find(m => m.googleCalendarId === c.id)?.syncDirection || 'BIDIRECTIONAL'
            })),
            apple: appleCalendars.map(c => ({
                id: c.id,
                summary: c.summary,
                syncEnabled: mappings.some(m => m.appleCalendarUrl === c.id && m.syncEnabled),
                syncDirection: mappings.find(m => m.appleCalendarUrl === c.id)?.syncDirection || 'BIDIRECTIONAL'
            })),
            autoSyncEnabled: (await prisma.user.findUnique({ where: { id: String(userId) } }))?.autoSyncEnabled || false
        };

        console.log(`Returning calendar list for user ${userId}:`, {
            googleCount: response.google.length,
            appleCount: response.apple.length,
            autoSync: response.autoSyncEnabled
        });

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save sync preferences
// Save sync preferences
router.post('/preferences', async (req, res) => {
    const { userId, googleCalendarId, appleCalendarUrl, displayName, enabled, syncDirection } = req.body;

    if (!userId || (!googleCalendarId && !appleCalendarUrl)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // We need to find the mapping based on EITHER googleId OR appleUrl
        // AND the user.

        // Fix P2002: Use strict lookup. OR query with undefined matches anything/unintended records.
        let mapping = null;
        if (appleCalendarUrl) {
            mapping = await prisma.calendarMapping.findFirst({
                where: { userId, appleCalendarUrl }
            });
        } else if (googleCalendarId) {
            mapping = await prisma.calendarMapping.findFirst({
                where: { userId, googleCalendarId }
            });
        }

        if (mapping) {
            // Update existing
            await prisma.calendarMapping.update({
                where: { id: mapping.id },
                data: {
                    syncEnabled: enabled,
                    syncDirection: syncDirection || mapping.syncDirection,
                    // Update IDs if provided and missing
                    googleCalendarId: googleCalendarId || mapping.googleCalendarId,
                    appleCalendarUrl: appleCalendarUrl || mapping.appleCalendarUrl,
                    displayName: displayName || mapping.displayName
                }
            });
        } else {
            // Create new partial mapping
            // The worker will handle the "missing side" creation later
            await prisma.calendarMapping.create({
                data: {
                    userId,
                    googleCalendarId: googleCalendarId || undefined,
                    appleCalendarUrl: appleCalendarUrl || undefined,
                    displayName: displayName || 'Calendar',
                    syncEnabled: enabled,
                    syncDirection: syncDirection || 'BIDIRECTIONAL'
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update auto-sync preference
router.post('/preferences/auto-sync', async (req, res) => {
    const { userId, enabled } = req.body;

    if (!userId || typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { autoSyncEnabled: enabled }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
