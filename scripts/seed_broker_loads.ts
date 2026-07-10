import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding broker loads...');

  // Find a broker
  const broker = await prisma.user.findFirst({
    where: { role: 'BROKER' }
  });

  if (!broker) {
    console.log('No broker found! Please register a BROKER user first.');
    process.exit(1);
  }

  const cities = ['Miami, FL', 'Los Angeles, CA', 'New York, NY', 'Austin, TX', 'Chicago, IL', 'Seattle, WA', 'Denver, CO', 'Las Vegas, NV'];
  const zips = ['33101', '90001', '10001', '73301', '60601', '98101', '80201', '89101'];

  for (let i = 0; i < 15; i++) {
    const originIdx = Math.floor(Math.random() * cities.length);
    let destIdx = Math.floor(Math.random() * cities.length);
    while (destIdx === originIdx) {
      destIdx = Math.floor(Math.random() * cities.length);
    }

    const price = Math.floor(Math.random() * 1500) + 500;
    const distance = Math.floor(Math.random() * 2000) + 300;

    const vTypes = ['Honda Civic 2023', 'Ford F-150 2022', 'Tesla Model 3', 'Toyota Camry 2024', 'Chevy Silverado', 'BMW M3'];
    const vehiclesData = [{ 
      make: vTypes[Math.floor(Math.random() * vTypes.length)],
      type: 'Sedan',
      year: 2023,
      running: true
    }];

    await prisma.load.create({
      data: {
        originCity: cities[originIdx],
        originZip: zips[originIdx],
        destCity: cities[destIdx],
        destZip: zips[destIdx],
        price,
        distance,
        status: 'AVAILABLE',
        vehiclesData: vehiclesData,
        trailerType: Math.random() > 0.5 ? 'OPEN' : 'ENCLOSED',
        paymentType: 'COD',
        brokerId: broker.id,
        pickupDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + (Math.random() * 7 + 7) * 24 * 60 * 60 * 1000),
      }
    });
  }

  console.log(`Successfully created 15 loads for Broker: ${broker.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
