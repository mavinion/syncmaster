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

export const setupSyncWorker = () => {
    const worker = new Worker('sync-queue', async (job) => {
        console.log(`Processing sync job ${job.id} for user ${job.data.userId}`);
        const { userId } = job.data;

        try {
            // 1. Fetch User Accounts
            const accounts = await prisma.account.findMany({
                where: { userId },
            });

            const googleAccount = accounts.find((a: { provider: string }) => a.provider === 'google');
            const appleAccount = accounts.find((a: { provider: string }) => a.provider === 'apple');

            if (!googleAccount || !appleAccount) {
                console.log('Missing accounts for sync');
                return;
            }

            // 2. Initialize Services
            // Note: In real app, handle token refresh for Google
            const googleService = new GoogleCalendarService(
                googleAccount.accessToken!,
                googleAccount.refreshToken!
            );

            const appleService = new AppleCalendarService(
                appleAccount.providerId!,
                decrypt(appleAccount.password!)
            );

            // 3. Fetch Events (Example: Next 30 days)
            const now = new Date();
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(now.getDate() + 30);

            const googleEvents = await googleService.listEvents('primary', now);
            console.log(`Fetched ${googleEvents.length} Google events`);

            // Placeholder for Apple Calendar URL - In real app, we need to discover this
            // For now, we'll assume a standard iCloud structure or require user input
            // This is a critical TODO: Implement CalDAV Discovery
            const appleCalendarUrl = await appleService.discoverCalendarUrl();
            console.log(`Discovered Apple Calendar URL: ${appleCalendarUrl}`);

            // 4. Sync Logic: Google -> Apple (One-way MVP)
            for (const gEvent of googleEvents) {
                if (!gEvent.id) continue;

                // Check if already mapped
                const mapping = await prisma.eventMapping.findUnique({
                    where: {
                        userId_googleEventId: {
                            userId,
                            googleEventId: gEvent.id,
                        },
                    },
                });

                if (!mapping) {
                    console.log(`Syncing new Google event ${gEvent.summary} to Apple`);
                    try {
                        // Create in Apple
                        const appleEventId = await appleService.createEvent(appleCalendarUrl, gEvent);

                        // Save mapping
                        await prisma.eventMapping.create({
                            data: {
                                userId,
                                googleEventId: gEvent.id,
                                appleEventId,
                                lastSyncedAt: new Date(),
                            },
                        });
                        console.log(`Synced Google Event ${gEvent.id} -> Apple Event ${appleEventId}`);
                    } catch (err) {
                        console.error(`Failed to sync event ${gEvent.summary}:`, err);
                    }
                } else {
                    // Update logic would go here
                    console.log(`Event ${gEvent.summary} already synced`);
                }
            }

        } catch (error) {
            console.error(`Sync job failed for user ${userId}:`, error);
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
