
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetSync() {
    const userId = '643c66bd-de1f-4a51-8d7d-724e1f5ef509'; // Hardcoded for this session
    console.log(`Resetting lastSyncedAt for user ${userId}...`);

    const result = await prisma.eventMapping.updateMany({
        where: { userId },
        data: { lastSyncedAt: new Date(0) } // Set to epoch
    });

    console.log(`Reset ${result.count} event mappings.`);
}

resetSync()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
