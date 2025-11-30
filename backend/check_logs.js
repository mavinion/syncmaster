
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.syncLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
    });
    console.log(JSON.stringify(logs, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
