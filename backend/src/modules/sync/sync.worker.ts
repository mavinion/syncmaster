import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { GoogleCalendarService } from './google.service';
import { AppleCalendarService } from './apple.service';
import { decrypt } from '../../utils/encryption';

const prisma = new PrismaClient();

// Queue for scheduling syncs
export const syncQueue = new Queue('sync-queue', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
});

export const setupScheduler = async () => {
    // Remove existing repeatable jobs to avoid duplicates on restart (optional but good practice)
    const repeatableJobs = await syncQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        await syncQueue.removeRepeatableByKey(job.key);
    }

    // Add Master Sync Job (every 15 minutes)
    await syncQueue.add('master-sync', {}, {
        repeat: {
            every: 15 * 60 * 1000, // 15 minutes
        },
    });
    console.log('Master sync scheduler initialized (15 min interval)');
};

export const setupSyncWorker = () => {
    const worker = new Worker('sync-queue', async (job) => {
        if (job.name === 'master-sync') {
            console.log('Processing Master Sync...');
            try {
                // Find all users with auto-sync enabled
                const users = await prisma.user.findMany({
                    where: { autoSyncEnabled: true },
                    select: { id: true }
                });

                console.log(`Found ${users.length} users with auto-sync enabled`);

                for (const user of users) {
                    await syncQueue.add('user-sync', { userId: user.id });
                }
            } catch (error) {
                console.error('Master sync failed:', error);
            }
            return;
        }

        // Handle User Sync
        console.log(`Processing sync job ${job.id} for user ${job.data.userId}`);
        const { userId } = job.data;

        if (!userId) {
            console.error('Job missing userId');
            return;
        }

        // Helper for logging
        const logSync = async (level: string, message: string, details?: any) => {
            if (!userId) return;
            try {
                await prisma.syncLog.create({
                    data: {
                        userId,
                        level,
                        message,
                        details: details ? JSON.stringify(details) : undefined,
                        source: job.name === 'master-sync' ? 'AUTO' : 'MANUAL'
                    }
                });
            } catch (e) {
                console.error('Failed to write sync log:', e);
            }
        };

        try {
            await logSync('INFO', 'Starting sync job');

            // 1. Fetch User Accounts
            const accounts = await prisma.account.findMany({
                where: { userId },
            });

            const googleAccount = accounts.find((a: { provider: string }) => a.provider === 'google');
            const appleAccount = accounts.find((a: { provider: string }) => a.provider === 'apple');

            if (!googleAccount || !appleAccount) {
                await logSync('ERROR', 'Missing accounts for sync');
                return;
            }

            // 2. Initialize Services
            const googleService = new GoogleCalendarService(
                googleAccount.accessToken!,
                googleAccount.refreshToken!,
                async (tokens) => {
                    console.log('Refreshing Google tokens for user', userId);
                    await prisma.account.update({
                        where: { id: googleAccount.id },
                        data: {
                            accessToken: tokens.access_token,
                            refreshToken: tokens.refresh_token || googleAccount.refreshToken
                        }
                    });
                }
            );

            const appleService = new AppleCalendarService(
                appleAccount.providerId!,
                decrypt(appleAccount.password!)
            );

            // 3. Fetch Enabled Mappings
            const mappings = await prisma.calendarMapping.findMany({
                where: { userId, syncEnabled: true }
            });

            if (mappings.length === 0) {
                await logSync('WARN', 'No enabled calendar mappings found');
                return;
            }

            const now = new Date();
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(now.getDate() + 30);

            let totalSyncedToApple = 0;
            let totalSyncedToGoogle = 0;

            for (const mapping of mappings) {
                let googleId = mapping.googleCalendarId;
                let appleUrl = mapping.appleCalendarUrl;

                // 4. Ensure Calendars Exist (omitted for brevity, assume existing logic remains but we can log errors here too)
                // ... (Existing calendar creation logic) ...

                // Re-implementing the check logic briefly to keep context valid
                if (!googleId) {
                    try {
                        const calendars = await googleService.listCalendars();
                        const existing = calendars.find((c: any) => c.summary === mapping.displayName);
                        if (existing && existing.id) {
                            googleId = existing.id;
                            await prisma.calendarMapping.update({ where: { id: mapping.id }, data: { googleCalendarId: googleId } });
                        } else {
                            const newCal = await googleService.createCalendar(mapping.displayName);
                            if (newCal.id) {
                                googleId = newCal.id;
                                await prisma.calendarMapping.update({ where: { id: mapping.id }, data: { googleCalendarId: googleId } });
                            }
                        }
                    } catch (e) {
                        await logSync('ERROR', `Failed to handle Google calendar: ${mapping.displayName}`, e);
                        continue;
                    }
                }

                if (!appleUrl) {
                    try {
                        const calendars = await appleService.listCalendars();
                        const existing = calendars.find((c: any) => c.summary === mapping.displayName);
                        if (existing) {
                            appleUrl = existing.id;
                            await prisma.calendarMapping.update({ where: { id: mapping.id }, data: { appleCalendarUrl: appleUrl } });
                        } else {
                            const newCal = await appleService.createCalendar(mapping.displayName);
                            appleUrl = newCal.id;
                            await prisma.calendarMapping.update({ where: { id: mapping.id }, data: { appleCalendarUrl: appleUrl } });
                        }
                    } catch (e) {
                        await logSync('ERROR', `Failed to handle Apple calendar: ${mapping.displayName}`, e);
                        continue;
                    }
                }

                if (!googleId || !appleUrl) continue;

                // 5. Fetch All Events First
                let googleEvents: any[] = [];
                let appleEvents: any[] = [];

                try {
                    googleEvents = await googleService.listEvents(googleId, now);
                } catch (e) {
                    await logSync('ERROR', `Failed to fetch Google events for ${mapping.displayName}`, e);
                }

                try {
                    appleEvents = await appleService.listEvents(appleUrl, now, thirtyDaysLater);
                } catch (e) {
                    await logSync('ERROR', `Failed to fetch Apple events for ${mapping.displayName}`, e);
                }

                // 6. Sync Google -> Apple
                for (const gEvent of googleEvents) {
                    if (!gEvent.id) continue;

                    const existingMapping = await prisma.eventMapping.findUnique({
                        where: { userId_googleEventId: { userId, googleEventId: gEvent.id } },
                    });

                    if (!existingMapping) {
                        const duplicate = appleEvents.find(aEvent =>
                            aEvent.summary === gEvent.summary &&
                            aEvent.start && gEvent.start &&
                            new Date(aEvent.start).getTime() === new Date(gEvent.start.dateTime || gEvent.start.date).getTime()
                        );

                        if (duplicate && duplicate.id) {
                            await prisma.eventMapping.create({
                                data: { userId, googleEventId: gEvent.id, appleEventId: duplicate.id, lastSyncedAt: new Date() },
                            });
                        } else {
                            try {
                                const appleEventId = await appleService.createEvent(appleUrl, {
                                    summary: gEvent.summary || 'Untitled Event',
                                    description: gEvent.description,
                                    start: gEvent.start,
                                    end: gEvent.end
                                });

                                await prisma.eventMapping.create({
                                    data: { userId, googleEventId: gEvent.id, appleEventId, lastSyncedAt: new Date() },
                                });
                                totalSyncedToApple++;
                            } catch (err) {
                                console.error(`Failed to sync Google event ${gEvent.id} to Apple:`, err);
                            }
                        }
                    } else {
                        // Check for updates (Google -> Apple)
                        if (existingMapping) {
                            const appleEvent = appleEvents.find(e => e.id === existingMapping.appleEventId);
                            if (appleEvent) {
                                const googleUpdated = new Date(gEvent.updated);
                                const lastSynced = new Date(existingMapping.lastSyncedAt);

                                // If Google event is newer than last sync
                                if (googleUpdated > lastSynced) {
                                    console.log(`Updating Apple event ${appleEvent.id} from Google event ${gEvent.id}`);
                                    try {
                                        await appleService.updateEvent(appleUrl, appleEvent.id, {
                                            summary: gEvent.summary || 'Untitled Event',
                                            description: gEvent.description,
                                            start: gEvent.start,
                                            end: gEvent.end
                                        }, appleEvent.href);
                                        await prisma.eventMapping.update({
                                            where: { id: existingMapping.id },
                                            data: { lastSyncedAt: new Date() }
                                        });
                                        totalSyncedToApple++;
                                    } catch (err) {
                                        console.error(`Failed to update Apple event ${appleEvent.id}:`, err);
                                    }
                                }
                            }
                        }
                    }
                }

                // 7. Sync Apple -> Google
                for (const aEvent of appleEvents) {
                    if (!aEvent.id) continue;

                    const existingMapping = await prisma.eventMapping.findUnique({
                        where: { userId_appleEventId: { userId, appleEventId: aEvent.id } },
                    });

                    if (!existingMapping) {
                        const duplicate = googleEvents.find(gEvent =>
                            gEvent.summary === aEvent.summary &&
                            gEvent.start && aEvent.start &&
                            new Date(gEvent.start.dateTime || gEvent.start.date).getTime() === new Date(aEvent.start).getTime()
                        );

                        if (duplicate && duplicate.id) {
                            const alreadyLinked = await prisma.eventMapping.findUnique({
                                where: { userId_googleEventId: { userId, googleEventId: duplicate.id } }
                            });
                            if (!alreadyLinked) {
                                await prisma.eventMapping.create({
                                    data: { userId, googleEventId: duplicate.id, appleEventId: aEvent.id, lastSyncedAt: new Date() },
                                });
                            }
                        } else {
                            try {
                                const googleEvent = await googleService.createEvent(googleId, {
                                    summary: aEvent.summary || 'Untitled Event',
                                    description: aEvent.description,
                                    start: aEvent.start ? { dateTime: aEvent.start.toISOString() } : undefined,
                                    end: aEvent.end ? { dateTime: aEvent.end.toISOString() } : undefined,
                                });

                                if (googleEvent.id) {
                                    await prisma.eventMapping.create({
                                        data: { userId, googleEventId: googleEvent.id, appleEventId: aEvent.id, lastSyncedAt: new Date() },
                                    });
                                    totalSyncedToGoogle++;
                                }
                            } catch (err) {
                                console.error(`Failed to sync Apple event ${aEvent.id} to Google:`, err);
                            }
                        }
                    } else {
                        // Check for updates (Apple -> Google)
                        if (existingMapping) {
                            const googleEvent = googleEvents.find(e => e.id === existingMapping.googleEventId);
                            if (googleEvent) {
                                const appleUpdated = aEvent.lastModified ? new Date(aEvent.lastModified) : null;
                                const lastSynced = new Date(existingMapping.lastSyncedAt);

                                // If Apple event is newer than last sync
                                // Note: Apple might not always provide LAST-MODIFIED, so we might need a fallback or just skip
                                if (appleUpdated && appleUpdated > lastSynced) {
                                    console.log(`Updating Google event ${googleEvent.id} from Apple event ${aEvent.id}`);
                                    try {
                                        await googleService.updateEvent(googleId, googleEvent.id, {
                                            summary: aEvent.summary || 'Untitled Event',
                                            description: aEvent.description,
                                            start: aEvent.start ? { dateTime: aEvent.start.toISOString() } : undefined,
                                            end: aEvent.end ? { dateTime: aEvent.end.toISOString() } : undefined,
                                        });
                                        await prisma.eventMapping.update({
                                            where: { id: existingMapping.id },
                                            data: { lastSyncedAt: new Date() }
                                        });
                                        totalSyncedToGoogle++;
                                    } catch (err) {
                                        console.error(`Failed to update Google event ${googleEvent.id}:`, err);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            await logSync('SUCCESS', `Sync completed. Synced ${totalSyncedToApple} to Apple, ${totalSyncedToGoogle} to Google.`);

        } catch (error: any) {
            console.error(`Sync job failed for user ${userId}:`, error);
            await logSync('ERROR', 'Sync job failed', error.message);
            throw error;
        }
    }, {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        },
    });

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed!`);
    });

    worker.on('failed', (job, err) => {
        if (job) {
            console.log(`Job ${job.id} failed with ${err.message}`);
        } else {
            console.log(`Job failed with ${err.message}`);
        }
    });
};
