import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleCalendarService } from './google.service';
import { AppleCalendarService } from './apple.service';
import { decrypt } from '../../utils/encryption';

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
            const googleService = new GoogleCalendarService(
                googleAccount.accessToken!,
                googleAccount.refreshToken!
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

        res.json({
            google: googleCalendars.map(c => ({
                id: c.id,
                summary: c.summary,
                syncEnabled: mappings.some(m => m.googleCalendarId === c.id && m.syncEnabled)
            })),
            apple: appleCalendars.map(c => ({
                id: c.id,
                summary: c.summary,
                syncEnabled: mappings.some(m => m.appleCalendarUrl === c.id && m.syncEnabled)
            }))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save sync preferences
// Save sync preferences
router.post('/preferences', async (req, res) => {
    const { userId, googleCalendarId, appleCalendarUrl, displayName, enabled } = req.body;

    if (!userId || (!googleCalendarId && !appleCalendarUrl)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // We need to find the mapping based on EITHER googleId OR appleUrl
        // AND the user.

        let mapping = await prisma.calendarMapping.findFirst({
            where: {
                userId,
                OR: [
                    { googleCalendarId: googleCalendarId || undefined },
                    { appleCalendarUrl: appleCalendarUrl || undefined }
                ]
            }
        });

        if (mapping) {
            // Update existing
            await prisma.calendarMapping.update({
                where: { id: mapping.id },
                data: {
                    syncEnabled: enabled,
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
                    googleCalendarId: googleCalendarId || '', // Temporary empty string if missing
                    appleCalendarUrl: appleCalendarUrl || '', // Temporary empty string if missing
                    displayName: displayName || 'Calendar',
                    syncEnabled: enabled
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
