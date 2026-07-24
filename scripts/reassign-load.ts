import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const felipeCarrierId = 'fba442a7-3999-42b4-9925-500f301c30d0';
  const dummyCarrierId = '9d9304f4-f05a-45b6-80d7-2a32231efea5';
  const brokerEmail = 'broker.teste@axlegrid.com';

  const broker = await prisma.user.findUnique({ where: { email: brokerEmail } });
  
  if (broker) {
    const loads = await prisma.load.findMany({ where: { brokerId: broker.id, carrierId: dummyCarrierId } });
    for (const load of loads) {
      await prisma.load.update({
        where: { id: load.id },
        data: { carrierId: felipeCarrierId }
      });
      console.log(`Reassigned load ${load.id} to Felipe Pelo Mundo`);
    }
  }

  // Delete dummy carrier
  await prisma.user.delete({ where: { id: dummyCarrierId } });
  console.log('Deleted dummy carrier');
}

main().finally(() => prisma.$disconnect());
