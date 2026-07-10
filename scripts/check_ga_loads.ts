import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const loads = await prisma.load.findMany({
    where: { destCity: { contains: 'GA' } },
    select: { id: true, originCity: true, destCity: true, status: true }
  });
  console.log('Loads in GA:', loads);
}

main().finally(() => prisma.$disconnect());
