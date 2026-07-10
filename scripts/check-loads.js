const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const loads = await prisma.load.findMany({
    where: { status: 'DELIVERED' },
    select: {
      id: true,
      status: true,
      deliveryDate: true,
      createdAt: true,
      price: true,
      carrierId: true,
      brokerId: true
    }
  });
  console.log(JSON.stringify(loads, null, 2));
}

main().finally(() => prisma.$disconnect());
