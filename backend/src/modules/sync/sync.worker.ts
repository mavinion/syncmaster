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

            // Apple fetch would go here (requires valid calendar URL discovery first)
            // const appleEvents = await appleService.listEvents(appleCalendarUrl, now, thirtyDaysLater);

            // 4. Sync Logic (Placeholder)
            // Compare events, check mapping table, create/update/delete
            console.log('Sync logic execution placeholder');

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
