import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Orlando loads...');

  // Find a broker
  const broker = await prisma.user.findFirst({
    where: { role: 'BROKER' }
  });

  if (!broker) {
    console.log('No broker found! Please register a BROKER user first.');
    process.exit(1);
  }

  const destCities = ['Miami, FL', 'Los Angeles, CA', 'New York, NY', 'Austin, TX', 'Chicago, IL', 'Seattle, WA', 'Denver, CO', 'Las Vegas, NV', 'Atlanta, GA', 'Dallas, TX'];
  const destZips = ['33101', '90001', '10001', '73301', '60601', '98101', '80201', '89101', '30301', '75201'];

  for (let i = 0; i < 20; i++) {
    let destIdx = Math.floor(Math.random() * destCities.length);

    const price = Math.floor(Math.random() * 2000) + 600;
    const distance = Math.floor(Math.random() * 2500) + 200;

    const vTypes = ['Honda Civic', 'Ford F-150', 'Tesla Model 3', 'Toyota Camry', 'Chevy Silverado', 'BMW M3', 'Jeep Wrangler', 'Porsche 911'];
    
    // Randomize 1 to 3 cars per load, all operating (running: true)
    const numCars = Math.floor(Math.random() * 3) + 1;
    const vehiclesData = [];
    
    for (let c = 0; c < numCars; c++) {
      vehiclesData.push({ 
        make: vTypes[Math.floor(Math.random() * vTypes.length)],
        type: 'Car',
        year: Math.floor(Math.random() * 10) + 2015,
        running: true // ONLY RUNNING CARS
      });
    }

    await prisma.load.create({
      data: {
        originCity: 'Orlando, FL',
        originZip: '32801',
        destCity: destCities[destIdx],
        destZip: destZips[destIdx],
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

  console.log(`Successfully created 20 loads departing from Orlando for Broker: ${broker.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
