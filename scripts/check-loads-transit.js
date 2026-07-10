const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const loads = await prisma.load.findMany({
    where: { status: 'IN_TRANSIT' }
  });
  console.log(JSON.stringify(loads, null, 2));
}

main().finally(() => prisma.$disconnect());
