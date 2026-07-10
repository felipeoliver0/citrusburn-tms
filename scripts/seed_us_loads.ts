import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ORIGINS = [
  { city: 'New York, NY', zip: '10001' },
  { city: 'Los Angeles, CA', zip: '90001' },
  { city: 'Chicago, IL', zip: '60601' },
  { city: 'Houston, TX', zip: '77001' },
  { city: 'Phoenix, AZ', zip: '85001' },
  { city: 'Seattle, WA', zip: '98101' },
  { city: 'Denver, CO', zip: '80201' },
  { city: 'Miami, FL', zip: '33101' },
  { city: 'Atlanta, GA', zip: '30301' },
  { city: 'Boston, MA', zip: '02101' },
];

const DESTINATIONS = [
  { city: 'San Francisco, CA', zip: '94101' },
  { city: 'Dallas, TX', zip: '75201' },
  { city: 'Las Vegas, NV', zip: '89101' },
  { city: 'Portland, OR', zip: '97201' },
  { city: 'Detroit, MI', zip: '48201' },
  { city: 'Minneapolis, MN', zip: '55401' },
  { city: 'Salt Lake City, UT', zip: '84101' },
  { city: 'Charlotte, NC', zip: '28201' },
  { city: 'New Orleans, LA', zip: '70112' },
  { city: 'Nashville, TN', zip: '37201' },
];

async function main() {
  const broker = await prisma.user.findFirst({ where: { role: 'BROKER' } });
  if (!broker) {
    console.error('No broker found. Cannot seed loads.');
    return;
  }

  console.log(`Seeding loads for broker: ${broker.email}`);

  let loadsCreated = 0;

  for (let i = 0; i < 30; i++) {
    const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
    const dest = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
    
    const distance = Math.floor(Math.random() * 2200) + 300;
    const pricePerMile = 1.8 + Math.random();
    const price = Math.round(distance * pricePerMile);

    const trailerTypes = ['OPEN', 'ENCLOSED'];
    const trailerType = trailerTypes[Math.floor(Math.random() * trailerTypes.length)];

    const vehiclesData = [
      {
        year: '202' + Math.floor(Math.random() * 5),
        make: ['Toyota', 'Ford', 'Chevrolet', 'Honda', 'Tesla'][Math.floor(Math.random() * 5)],
        model: ['Camry', 'F-150', 'Silverado', 'Civic', 'Model 3'][Math.floor(Math.random() * 5)],
        condition: ['RUNS', 'INOP'][Math.floor(Math.random() * 2)]
      }
    ];

    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 5) + 1);
    
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(distance / 500) + 1);

    await prisma.load.create({
      data: {
        originCity: origin.city,
        originZip: origin.zip,
        destCity: dest.city,
        destZip: dest.zip,
        distance,
        price,
        status: 'AVAILABLE',
        brokerId: broker.id,
        trailerType,
        paymentType: 'COD',
        vehiclesData: JSON.stringify(vehiclesData),
        pickupDate,
        deliveryDate
      }
    });

    loadsCreated++;
  }

  console.log(`Successfully seeded ${loadsCreated} loads across the US.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
