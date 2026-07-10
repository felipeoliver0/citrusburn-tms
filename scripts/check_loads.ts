import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const loads = await prisma.load.findMany({
    select: { originCity: true, originZip: true, destCity: true, destZip: true }
  });
  console.log(JSON.stringify(loads, null, 2));
}

main().finally(() => prisma.$disconnect());
