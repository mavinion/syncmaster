import { PrismaClient } from '@prisma/client';
import { decrypt } from '../src/utils/encryption';
import { GoogleCalendarService } from '../src/modules/sync/google.service';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
    console.log('Verifying Google token encryption...');

    const account = await prisma.account.findFirst({
        where: { provider: 'google' },
    });

    if (!account) {
        console.log('No Google account found to test.');
        return;
    }

    if (!account.accessToken) {
        console.log('No access token found.');
        return;
    }

    console.log('Encrypted Access Token (prefix):', account.accessToken.substring(0, 20) + '...');

    let decryptedAccessToken;
    try {
        decryptedAccessToken = decrypt(account.accessToken);
        console.log('Decryption successful.');
    } catch (error) {
        console.error('Decryption failed:', error);
        return;
    }

    let decryptedRefreshToken = '';
    if (account.refreshToken) {
        try {
            decryptedRefreshToken = decrypt(account.refreshToken);
            console.log('Refresh token decryption successful.');
        } catch (error) {
            console.error('Refresh token decryption failed:', error);
        }
    }

    // Test API call
    console.log('Testing Google API call with decrypted token...');
    const googleService = new GoogleCalendarService(
        decryptedAccessToken,
        decryptedRefreshToken
    );

    try {
        const calendars = await googleService.listCalendars();
        console.log(`Successfully fetched ${calendars.length} calendars.`);
        console.log('VERIFICATION SUCCESSFUL: Tokens are correctly encrypted and usable.');
    } catch (error) {
        console.error('API call failed:', error);
        console.log('VERIFICATION FAILED: Could not use decrypted tokens.');
    }
};

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
