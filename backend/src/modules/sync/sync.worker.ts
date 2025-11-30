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

        const convertAppleAlarmToGoogle = (trigger: string) => {
            if (!trigger) return undefined;
            // Trigger format: -PT15M
            const match = trigger.match(/-PT(\d+)M/);
            if (match && match[1]) {
                return {
                    useDefault: false,
                    overrides: [{ method: 'popup', minutes: parseInt(match[1]) }]
                };
            }
            return undefined;
        };

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
            const syncActions: string[] = [];

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
                    // Fetch Google events including deleted ones
                    googleEvents = await googleService.listEvents(googleId, now, true);
                } catch (e: any) {
                    // Check for 404 Not Found or 410 Gone
                    if (e.code === 404 || e.code === 410 || (e.response && (e.response.status === 404 || e.response.status === 410))) {
                        await logSync('WARN', `Google calendar ${mapping.displayName} not found (deleted). Removing mapping.`);
                        await prisma.calendarMapping.delete({ where: { id: mapping.id } });
                        continue;
                    }
                    await logSync('ERROR', `Failed to fetch Google events for ${mapping.displayName}`, e);
                }

                try {
                    appleEvents = await appleService.listEvents(appleUrl, now, thirtyDaysLater);
                } catch (e: any) {
                    // Check for 404 Not Found or 410 Gone
                    if (e.response && (e.response.status === 404 || e.response.status === 410)) {
                        await logSync('WARN', `Apple calendar ${mapping.displayName} not found (deleted). Removing mapping.`);
                        await prisma.calendarMapping.delete({ where: { id: mapping.id } });
                        continue;
                    }
                    await logSync('ERROR', `Failed to fetch Apple events for ${mapping.displayName}`, e);
                }

                await logSync('INFO', `Fetched ${googleEvents.length} Google events and ${appleEvents.length} Apple events for ${mapping.displayName}`);


                // 6. Sync Google -> Apple
                if (mapping.syncDirection === 'BIDIRECTIONAL' || mapping.syncDirection === 'GOOGLE_TO_APPLE') {
                    for (const gEvent of googleEvents) {
                        if (!gEvent.id) continue;

                        const existingMapping = await prisma.eventMapping.findUnique({
                            where: { userId_googleEventId: { userId, googleEventId: gEvent.id } },
                        });

                        // Heal missing ETags (Migration step)
                        if (existingMapping && (!existingMapping.googleEtag || !existingMapping.appleEtag)) {
                            // Find corresponding Apple event if not already found (we need it for ETag)
                            const appleEventForHealing = appleEvents.find(e => e.id === existingMapping.appleEventId);

                            if (gEvent.etag || (appleEventForHealing && appleEventForHealing.etag)) {
                                console.log(`[MIGRATION] Populating missing ETags for mapping ${existingMapping.id}`);
                                await prisma.eventMapping.update({
                                    where: { id: existingMapping.id },
                                    data: {
                                        googleEtag: gEvent.etag || undefined,
                                        appleEtag: appleEventForHealing?.etag || undefined
                                    }
                                });
                                // Update in-memory object so subsequent checks use the new values
                                if (gEvent.etag) existingMapping.googleEtag = gEvent.etag;
                                if (appleEventForHealing?.etag) existingMapping.appleEtag = appleEventForHealing.etag;
                            }
                        }

                        // Handle Deletion (Google -> Apple)
                        if (gEvent.status === 'cancelled') {
                            if (existingMapping && existingMapping.appleEventId) {
                                try {
                                    // We need the Apple href to delete it. 
                                    // We can try to find it in the fetched appleEvents list.
                                    const appleEvent = appleEvents.find(a => a.id === existingMapping.appleEventId);

                                    if (appleEvent && appleEvent.href) {
                                        await appleService.deleteEvent(appleUrl, appleEvent.href);
                                        await logSync('INFO', `Deleted Apple event ${existingMapping.appleEventId} because Google event ${gEvent.id} was cancelled`);
                                    } else {
                                        // If not found in current list, it might be outside the window or already deleted.
                                        // We can't delete it from Apple without href, but we should clean up the mapping.
                                        await logSync('WARN', `Could not find Apple event ${existingMapping.appleEventId} to delete (might be outside sync window). Cleaning up mapping.`);
                                    }

                                    await prisma.eventMapping.delete({ where: { id: existingMapping.id } });
                                    syncActions.push(`[Google -> Apple] Deleted event: "${gEvent.summary}"`);
                                } catch (err) {
                                    await logSync('ERROR', `Failed to delete Apple event for cancelled Google event ${gEvent.id}`, err);
                                    syncActions.push(`[Error] Failed to delete Apple event: "${gEvent.summary}"`);
                                }
                            }
                            continue; // Skip further processing for cancelled events
                        }

                        if (!existingMapping) {
                            const duplicate = appleEvents.find(aEvent =>
                                aEvent.summary === gEvent.summary &&
                                aEvent.start && gEvent.start &&
                                new Date(aEvent.start).getTime() === new Date(gEvent.start.dateTime || gEvent.start.date).getTime()
                            );

                            if (duplicate && duplicate.id) {
                                await prisma.eventMapping.create({
                                    data: {
                                        userId,
                                        googleEventId: gEvent.id,
                                        appleEventId: duplicate.id,
                                        lastSyncedAt: new Date(),
                                        googleEtag: gEvent.etag,
                                        appleEtag: duplicate.etag
                                    },
                                });
                                syncActions.push(`[Link] Linked existing events: "${gEvent.summary}"`);
                            } else {
                                try {
                                    const newAppleId = await appleService.createEvent(appleUrl, {
                                        summary: gEvent.summary || 'Untitled Event',
                                        description: gEvent.description,
                                        start: gEvent.start,
                                        end: gEvent.end,
                                        location: gEvent.location,
                                        recurrence: gEvent.recurrence, // Pass recurrence array
                                        reminders: gEvent.reminders
                                    });

                                    // We need to fetch the new Apple event to get its ETag
                                    // But createEvent returns ID. We might need to fetch it. 
                                    // For now, let's leave ETag null and let next sync fix it, or fetch it.
                                    // Better: Fetch it immediately if possible, or just accept one echo.
                                    // Actually, let's try to fetch it if we can, but we need the href/url.
                                    // listEvents returns everything.

                                    // Let's just store what we have. If appleEtag is null, next sync will see it as changed (null != newEtag).
                                    // To avoid echo, we should try to get it. 
                                    // Optimization: For now, store null. Next sync will check Apple -> Google.
                                    // If Apple -> Google sees different ETag, it updates Google. 
                                    // If content is same, Google update might be no-op or just new ETag.

                                    await prisma.eventMapping.create({
                                        data: {
                                            userId,
                                            googleEventId: gEvent.id,
                                            appleEventId: newAppleId,
                                            lastSyncedAt: new Date(),
                                            googleEtag: gEvent.etag
                                            // appleEtag: null 
                                        },
                                    });
                                    totalSyncedToApple++;
                                    syncActions.push(`[Google -> Apple] Created event: "${gEvent.summary}"`);
                                } catch (err) {
                                    console.error(`Failed to sync Google event ${gEvent.id} to Apple:`, err);
                                    syncActions.push(`[Error] Failed to sync Google event to Apple: "${gEvent.summary}"`);
                                }
                            }
                        } else {
                            // Check for updates (Google -> Apple)
                            if (existingMapping) {
                                const appleEvent = appleEvents.find(e => e.id === existingMapping.appleEventId);
                                if (appleEvent) {
                                    // Check for updates (Google -> Apple)
                                    // Use ETag if available, otherwise fallback to timestamp
                                    const googleChanged = gEvent.etag && gEvent.etag !== existingMapping.googleEtag;
                                    const googleTimestampChanged = new Date(gEvent.updated) > new Date(existingMapping.lastSyncedAt);

                                    // If ETag is null (migration), use timestamp. If ETag present, use ETag.
                                    const shouldUpdateApple = existingMapping.googleEtag ? googleChanged : googleTimestampChanged;

                                    if (shouldUpdateApple) {
                                        console.log(`[DEBUG] Google update detected for ${gEvent.summary}. ETag: ${gEvent.etag} vs ${existingMapping.googleEtag}`);

                                        // Conflict Check
                                        const appleChanged = appleEvent.etag && appleEvent.etag !== existingMapping.appleEtag;
                                        if (appleChanged) {
                                            console.log(`Conflict: Apple event ${appleEvent.id} also changed. Skipping Google -> Apple sync (or handle conflict).`);
                                            // For now, let's skip to avoid overwriting user data on Apple side
                                            continue;
                                        }

                                        console.log(`Updating Apple event ${appleEvent.id} from Google event ${gEvent.id}`);
                                        try {
                                            await appleService.updateEvent(appleUrl, appleEvent.id, {
                                                summary: gEvent.summary || 'Untitled Event',
                                                description: gEvent.description,
                                                start: gEvent.start,
                                                end: gEvent.end,
                                                location: gEvent.location,
                                                recurrence: gEvent.recurrence,
                                                reminders: gEvent.reminders
                                            }, appleEvent.href);

                                            // Re-fetch Apple event to get new ETag to prevent echo
                                            // This is expensive but safe. 
                                            // Alternatively, we can just assume it's synced and update appleEtag to 'PENDING' or similar? No.
                                            // Let's try to fetch just this event? listEvents doesn't support single event by UID easily without filter.
                                            // We'll leave appleEtag as is (stale). Next sync:
                                            // Apple -> Google will see appleEtag changed. 
                                            // It will try to update Google. Google will see content same? 
                                            // If we update Google with same content, it's fine.

                                            await prisma.eventMapping.update({
                                                where: { id: existingMapping.id },
                                                data: {
                                                    lastSyncedAt: new Date(),
                                                    googleEtag: gEvent.etag
                                                    // appleEtag: stale
                                                }
                                            });
                                            totalSyncedToApple++;
                                            syncActions.push(`[Google -> Apple] Updated event: "${gEvent.summary}"`);
                                        } catch (err) {
                                            console.error(`Failed to update Apple event ${appleEvent.id}:`, err);
                                            syncActions.push(`[Error] Failed to update Apple event: "${gEvent.summary}"`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 7. Sync Apple -> Google
                if (mapping.syncDirection === 'BIDIRECTIONAL' || mapping.syncDirection === 'APPLE_TO_GOOGLE') {
                    // Deduplicate Apple events to prevent processing the same event twice
                    const uniqueAppleEvents = Array.from(new Map(appleEvents.map(e => [e.id, e])).values());

                    // Check for Apple -> Google Deletions
                    // We iterate over existing mappings for this calendar and check if the Apple event is missing
                    // BUT only if the mapping's lastSyncedAt is older than the current fetch? 
                    // Better approach: Iterate over all mappings for this user/calendar. 
                    // If the mapping points to a Google event that is active (not cancelled), 
                    // AND the Apple event is NOT in the fetched list (and we assume the list covers the window),
                    // THEN delete from Google.

                    // Optimization: We can just check the mappings we encountered in the Google loop? 
                    // No, we need to find mappings that exist but have no corresponding Apple event in the current fetch.

                    // Let's iterate over uniqueAppleEvents for creation/update first.
                    const appleEventIds = new Set(uniqueAppleEvents.map(e => e.id));

                    for (const aEvent of uniqueAppleEvents) {
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
                                        data: {
                                            userId,
                                            googleEventId: duplicate.id,
                                            appleEventId: aEvent.id,
                                            lastSyncedAt: new Date(),
                                            appleEtag: aEvent.etag,
                                            googleEtag: duplicate.etag
                                        },
                                    });
                                    syncActions.push(`[Link] Linked existing events: "${aEvent.summary}"`);
                                }
                            } else {
                                try {
                                    const googlePayload = {
                                        summary: aEvent.summary || 'Untitled Event',
                                        description: aEvent.description,
                                        location: aEvent.location,
                                        recurrence: aEvent.rrule ? [aEvent.rrule] : undefined,
                                        reminders: convertAppleAlarmToGoogle(aEvent.alarmTrigger),
                                        start: aEvent.start ? { dateTime: aEvent.start.toISOString(), timeZone: 'UTC' } : undefined,
                                        end: aEvent.end ? { dateTime: aEvent.end.toISOString(), timeZone: 'UTC' } : undefined,
                                    };
                                    const newGoogleEvent = await googleService.createEvent(googleId, googlePayload);

                                    if (newGoogleEvent.id) {
                                        await prisma.eventMapping.create({
                                            data: {
                                                userId,
                                                googleEventId: newGoogleEvent.id,
                                                appleEventId: aEvent.id,
                                                lastSyncedAt: new Date(),
                                                appleEtag: aEvent.etag,
                                                googleEtag: newGoogleEvent.etag
                                            },
                                        });
                                        totalSyncedToGoogle++;
                                        syncActions.push(`[Apple -> Google] Created event: "${aEvent.summary}"`);
                                    }
                                } catch (err) {
                                    console.error(`Failed to sync Apple event ${aEvent.id} to Google:`, err);
                                    syncActions.push(`[Error] Failed to sync Apple event to Google: "${aEvent.summary}"`);
                                }
                            }
                        } else {
                            // Check for updates (Apple -> Google)
                            if (existingMapping) {
                                const googleEvent = googleEvents.find(e => e.id === existingMapping.googleEventId);
                                if (googleEvent) {
                                    // Check for updates (Apple -> Google)
                                    const appleChanged = aEvent.etag && aEvent.etag !== existingMapping.appleEtag;
                                    // Fallback if ETag missing (e.g. migration or not supported)
                                    const appleTimestampChanged = aEvent.lastModified && new Date(aEvent.lastModified) > new Date(existingMapping.lastSyncedAt);

                                    const shouldUpdateGoogle = existingMapping.appleEtag ? appleChanged : appleTimestampChanged;

                                    if (shouldUpdateGoogle) {
                                        console.log(`Updating Google event ${googleEvent.id} from Apple event ${aEvent.id}`);
                                        try {
                                            const googlePayload = {
                                                summary: aEvent.summary || 'Untitled Event',
                                                description: aEvent.description,
                                                location: aEvent.location,
                                                recurrence: aEvent.rrule ? [aEvent.rrule] : undefined,
                                                reminders: convertAppleAlarmToGoogle(aEvent.alarmTrigger),
                                                start: aEvent.start ? { dateTime: aEvent.start.toISOString(), timeZone: 'UTC' } : undefined,
                                                end: aEvent.end ? { dateTime: aEvent.end.toISOString(), timeZone: 'UTC' } : undefined,
                                            };
                                            const updatedGoogleEvent = await googleService.updateEvent(googleId, googleEvent.id, googlePayload);
                                            await prisma.eventMapping.update({
                                                where: { id: existingMapping.id },
                                                data: {
                                                    lastSyncedAt: new Date(),
                                                    appleEtag: aEvent.etag,
                                                    googleEtag: updatedGoogleEvent.etag
                                                }
                                            });
                                            totalSyncedToGoogle++;
                                            syncActions.push(`[Apple -> Google] Updated event: "${aEvent.summary}"`);
                                        } catch (err) {
                                            console.error(`Failed to update Google event ${googleEvent.id}:`, err);
                                            syncActions.push(`[Error] Failed to update Google event: "${aEvent.summary}"`);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Handle Deletion (Apple -> Google)
                    for (const gEvent of googleEvents) {
                        if (gEvent.status === 'cancelled') continue;

                        // Check if this Google event is mapped
                        const mapping = await prisma.eventMapping.findUnique({
                            where: { userId_googleEventId: { userId, googleEventId: gEvent.id } }
                        });

                        if (mapping && mapping.appleEventId) {
                            // If mapped, check if the Apple event exists in our fetched list
                            if (!appleEventIds.has(mapping.appleEventId)) {
                                // Apple event is missing! It must have been deleted on Apple.
                                // Verify it's within our sync window to be safe (though googleEvents list implies it is)
                                const gStart = gEvent.start.dateTime || gEvent.start.date;
                                if (new Date(gStart) >= now && new Date(gStart) <= thirtyDaysLater) {
                                    try {
                                        await googleService.updateEvent(googleId, gEvent.id, { status: 'cancelled' }); // Delete on Google
                                        await prisma.eventMapping.delete({ where: { id: mapping.id } });
                                        await logSync('INFO', `Deleted Google event ${gEvent.id} because Apple event ${mapping.appleEventId} is missing`);
                                        syncActions.push(`[Apple -> Google] Deleted event: "${gEvent.summary}"`);
                                    } catch (err) {
                                        await logSync('ERROR', `Failed to delete Google event ${gEvent.id}`, err);
                                        syncActions.push(`[Error] Failed to delete Google event: "${gEvent.summary}"`);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            await logSync('SUCCESS', `Sync completed. Synced ${totalSyncedToApple} to Apple, ${totalSyncedToGoogle} to Google.`, syncActions);

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
