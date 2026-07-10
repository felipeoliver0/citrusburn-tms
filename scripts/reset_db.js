const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  console.log('Deleting Load Requests...');
  await prisma.loadRequest.deleteMany();
  
  console.log('Deleting Messages...');
  await prisma.message.deleteMany();
  
  console.log('Deleting Location History...');
  await prisma.locationHistory.deleteMany();
  
  console.log('Deleting Reviews...');
  await prisma.review.deleteMany();
  
  console.log('Deleting Loads...');
  await prisma.load.deleteMany();
  
  console.log('Deleting non-ADMIN Users...');
  const result = await prisma.user.deleteMany({
    where: {
      role: { not: 'ADMIN' }
    }
  });
  
  console.log(`Deleted ${result.count} users. Database is clean!`);
}

reset().catch(console.error).finally(() => prisma.$disconnect());
