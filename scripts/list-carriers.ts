import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const carriers = await prisma.user.findMany({
    where: { role: 'CARRIER' },
    select: { id: true, companyName: true, email: true }
  });
  console.log(carriers);
}

main().finally(() => prisma.$disconnect());
