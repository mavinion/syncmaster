
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const mappings = await prisma.calendarMapping.findMany({
        where: { userId: '643c66bd-de1f-4a51-8d7d-724e1f5ef509' }
    });
    console.log(JSON.stringify(mappings, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
