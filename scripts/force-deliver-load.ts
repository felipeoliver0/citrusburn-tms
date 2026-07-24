import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'broker.teste@axlegrid.com';
  
  const broker = await prisma.user.findUnique({ where: { email } });
  if (!broker) {
    console.error('Broker not found');
    return;
  }

  // Create a dummy carrier
  const carrier = await prisma.user.create({
    data: {
      email: 'dummy.carrier' + Date.now() + '@example.com',
      passwordHash: 'dummy',
      role: 'CARRIER',
      fullName: 'Dummy Carrier Ltd',
      companyName: 'Dummy Carrier Ltd',
    }
  });

  // Find the broker's available load and deliver it
  const load = await prisma.load.findFirst({
    where: { brokerId: broker.id }
  });

  if (load) {
    await prisma.load.update({
      where: { id: load.id },
      data: {
        status: 'DELIVERED',
        carrierId: carrier.id
      }
    });
    console.log('Load marked as DELIVERED and assigned to dummy carrier.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
