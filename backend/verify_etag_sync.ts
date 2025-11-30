
import { PrismaClient } from '@prisma/client';
import { AppleCalendarService } from './src/modules/sync/apple.service';
import { decrypt } from './src/utils/encryption';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
    const userId = '643c66bd-de1f-4a51-8d7d-724e1f5ef509'; // User ID from previous logs

    // 1. Get Apple Account
    const account = await prisma.account.findFirst({
        where: { userId, provider: 'apple' }
    });

    if (!account) {
        console.error('Apple account not found');
        return;
    }

    const appleService = new AppleCalendarService(
        account.providerId!,
        decrypt(account.password!)
    );

    // 2. Get Calendar URL
    const mappings = await prisma.calendarMapping.findMany({
        where: { userId, appleCalendarUrl: { not: null } }
    });

    console.log(`Found ${mappings.length} mappings.`);
    mappings.forEach(m => console.log(`- ${m.displayName}: ${m.appleCalendarUrl}`));

    const mapping = mappings.find(m => m.appleCalendarUrl);
    // Define start and end dates for event search
    const start = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 3. Create a NEW event to avoid conflicts
    const newEventSummary = `Test ETag Sync ${Date.now()}`;
    console.log(`Creating new event: ${newEventSummary}`);

    // Find a valid calendar (e.g. test1 or first available)
    const targetMapping = mappings.find(m => m.displayName === 'test1') || mappings.find(m => m.appleCalendarUrl);
    if (!targetMapping || !targetMapping.appleCalendarUrl) {
        console.error('No valid calendar found');
        return;
    }
    const calendarUrl = targetMapping.appleCalendarUrl;

    const eventId = await appleService.createEvent(calendarUrl, {
        summary: newEventSummary,
        description: 'Test Description',
        location: 'Initial Location',
        start: { dateTime: new Date(Date.now() + 3600000).toISOString() }, // 1 hour from now
        end: { dateTime: new Date(Date.now() + 7200000).toISOString() }
    });
    console.log(`Created event ID: ${eventId}`);

    // 4. Trigger Sync (Create on Google)
    console.log('Triggering sync (Creation)...');
    await axios.post('http://localhost:3000/sync/trigger', { userId });

    // Wait for sync to finish (simple sleep)
    console.log('Waiting 10s for sync...');
    await new Promise(r => setTimeout(r, 10000));

    // 5. Update Location
    console.log('Updating location on Apple...');
    // We need to fetch the event to get its href/etag
    const events = await appleService.listEvents(calendarUrl, new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const event = events.find((e: any) => e.summary === newEventSummary);

    if (!event) {
        console.error('Created event not found!');
        return;
    }

    const newLocation = `Updated Location ETag ${Date.now()}`;
    await appleService.updateEvent(calendarUrl, event.id, {
        summary: event.summary,
        description: event.description,
        location: newLocation,
        start: event.start ? { dateTime: new Date(event.start).toISOString() } : undefined,
        end: event.end ? { dateTime: new Date(event.end).toISOString() } : undefined
    }, event.href);
    console.log(`Updated location to: ${newLocation}`);

    // 6. Trigger Sync (Update on Google)
    console.log('Triggering sync (Update)...');
    await axios.post('http://localhost:3000/sync/trigger', { userId });
    console.log('Sync triggered. Check logs.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
