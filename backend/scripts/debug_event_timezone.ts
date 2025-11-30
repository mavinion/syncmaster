import { PrismaClient } from '@prisma/client';
import { GoogleCalendarService } from '../src/modules/sync/google.service';
import { AppleCalendarService } from '../src/modules/sync/apple.service';
import { decrypt } from '../src/utils/encryption';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
    console.log('Starting timezone debug script...');

    const user = await prisma.user.findFirst();
    if (!user) {
        console.log('No user found');
        return;
    }
    console.log(`Debugging for user: ${user.email} (${user.id})`);

    const accounts = await prisma.account.findMany({
        where: { userId: user.id },
    });

    const googleAccount = accounts.find(a => a.provider === 'google');
    const appleAccount = accounts.find(a => a.provider === 'apple');

    if (!googleAccount || !appleAccount) {
        console.log('Missing Google or Apple account');
        return;
    }

    if (!googleAccount.accessToken || !appleAccount.password || !appleAccount.providerId) {
        console.log('Missing tokens or credentials');
        return;
    }

    // @ts-ignore
    const googleService = new GoogleCalendarService(
        decrypt(googleAccount.accessToken),
        googleAccount.refreshToken ? decrypt(googleAccount.refreshToken) : '',
        async (tokens: any) => {
            console.log('Refreshing Google tokens');
        }
    );

    // @ts-ignore
    const appleService = new AppleCalendarService(
        appleAccount.providerId,
        decrypt(appleAccount.password)
    );

    // 1. Find the Apple Event "kkk"
    console.log('Fetching Apple calendars...');
    const appleCalendars = await appleService.listCalendars();
    let appleEvent: any = null;
    let appleCalendarUrl = '';

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30);

    for (const cal of appleCalendars) {
        console.log(`Checking Apple calendar: ${cal.summary}`);
        try {
            const events = await appleService.listEvents(cal.id, now, future);
            const found = events.find((e: any) => e.summary === 'kkk');
            if (found) {
                appleEvent = found;
                appleCalendarUrl = cal.id;
                console.log('Found Apple event:', JSON.stringify(appleEvent, null, 2));
                break;
            }
        } catch (e) {
            console.error(`Error fetching events for ${cal.summary}:`, e);
        }
    }

    if (!appleEvent) {
        console.log('Event "kkk" not found in Apple Calendar');
        return;
    }

    // 2. Find the corresponding Google Event
    console.log('Fetching Google calendars...');
    const googleCalendars = await googleService.listCalendars();
    let googleEvent: any = null;

    for (const cal of googleCalendars) {
        console.log(`Checking Google calendar: ${cal.summary}`);
        if (!cal.id) continue;
        try {
            const events = await googleService.listEvents(cal.id, now);
            const found = events.find((e: any) => e.summary === 'kkk');
            if (found) {
                googleEvent = found;
                console.log('Found Google event:', JSON.stringify(googleEvent, null, 2));
                break;
            }
        } catch (e) {
            console.error(`Error fetching events for ${cal.summary}:`, e);
        }
    }

    if (!googleEvent) {
        console.log('Event "kkk" not found in Google Calendar');
    } else {
        console.log('--- COMPARISON ---');
        console.log('Apple Start:', appleEvent.start);
        console.log('Google Start:', googleEvent.start);
        console.log('Apple Timezone:', appleEvent.timezone); // Check if this property exists or is inferred
        console.log('Google Timezone:', googleEvent.start.timeZone);
        console.log('Apple RRULE:', appleEvent.rrule);
        console.log('Google Recurrence:', googleEvent.recurrence);
    }
};

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
