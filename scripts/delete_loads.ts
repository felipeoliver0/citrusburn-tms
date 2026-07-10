import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up transactional data...');

  const deletedLocationHistory = await prisma.locationHistory.deleteMany({});
  console.log(`Deleted ${deletedLocationHistory.count} location history records.`);

  const deletedReviews = await prisma.review.deleteMany({});
  console.log(`Deleted ${deletedReviews.count} reviews.`);

  const deletedRequests = await prisma.loadRequest.deleteMany({});
  console.log(`Deleted ${deletedRequests.count} load requests.`);

  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`Deleted ${deletedNotifications.count} notifications.`);

  const deletedLoads = await prisma.load.deleteMany({});
  console.log(`Deleted ${deletedLoads.count} loads.`);

  console.log('Database wiped successfully! Users and Fleet data remain intact.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
