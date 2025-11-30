import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/utils/encryption';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

const isEncrypted = (text: string) => {
    // Simple check for the format iv:content (hex:hex)
    // IV is 16 bytes = 32 hex chars
    return /^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(text);
};

const main = async () => {
    console.log('Starting encryption migration for Google tokens...');

    const accounts = await prisma.account.findMany({
        where: {
            provider: 'google',
        },
    });

    console.log(`Found ${accounts.length} Google accounts.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const account of accounts) {
        let needsUpdate = false;
        let newAccessToken = account.accessToken;
        let newRefreshToken = account.refreshToken;

        if (account.accessToken && !isEncrypted(account.accessToken)) {
            newAccessToken = encrypt(account.accessToken);
            needsUpdate = true;
        }

        if (account.refreshToken && !isEncrypted(account.refreshToken)) {
            newRefreshToken = encrypt(account.refreshToken);
            needsUpdate = true;
        }

        if (needsUpdate) {
            await prisma.account.update({
                where: { id: account.id },
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
            });
            updatedCount++;
            console.log(`Encrypted tokens for account ${account.id}`);
        } else {
            skippedCount++;
            console.log(`Skipping account ${account.id} (already encrypted or missing tokens)`);
        }
    }

    console.log(`Migration complete. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
};

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
