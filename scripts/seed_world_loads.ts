import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const WORLD_CITIES = [
  { city: 'London, UK', zip: 'EC1A' },
  { city: 'Paris, France', zip: '75001' },
  { city: 'Tokyo, Japan', zip: '100-0001' },
  { city: 'Sydney, Australia', zip: '2000' },
  { city: 'Sao Paulo, Brazil', zip: '01000-000' },
  { city: 'Cape Town, South Africa', zip: '8001' },
  { city: 'Toronto, Canada', zip: 'M5G' },
  { city: 'Dubai, UAE', zip: '00000' },
  { city: 'Singapore, SG', zip: '048582' },
  { city: 'Mumbai, India', zip: '400001' },
  { city: 'Berlin, Germany', zip: '10115' },
  { city: 'Moscow, Russia', zip: '101000' },
  { city: 'Mexico City, Mexico', zip: '06000' },
  { city: 'Buenos Aires, Argentina', zip: 'C1002' },
  { city: 'Cairo, Egypt', zip: '11511' },
  { city: 'Beijing, China', zip: '100000' },
  { city: 'New York, NY', zip: '10001' },
  { city: 'Los Angeles, CA', zip: '90001' },
  { city: 'Chicago, IL', zip: '60601' },
  { city: 'Miami, FL', zip: '33101' }
];

async function main() {
  const broker = await prisma.user.findFirst({ where: { role: 'BROKER' } });
  if (!broker) {
    console.error('No broker found.');
    return;
  }

  console.log(`Seeding 1000 global loads for broker: ${broker.email}`);

  const loadsToCreate = [];

  for (let i = 0; i < 1000; i++) {
    const origin = WORLD_CITIES[Math.floor(Math.random() * WORLD_CITIES.length)];
    let dest = WORLD_CITIES[Math.floor(Math.random() * WORLD_CITIES.length)];
    while (dest.city === origin.city) {
      dest = WORLD_CITIES[Math.floor(Math.random() * WORLD_CITIES.length)];
    }
    
    // Fake long distance
    const distance = Math.floor(Math.random() * 8000) + 1000;
    const pricePerMile = 1.5 + Math.random();
    const price = Math.round(distance * pricePerMile);

    const trailerTypes = ['OPEN', 'ENCLOSED'];
    const trailerType = trailerTypes[Math.floor(Math.random() * trailerTypes.length)];

    const vehiclesData = [
      {
        year: '202' + Math.floor(Math.random() * 5),
        make: ['Toyota', 'Ford', 'Chevrolet', 'Honda', 'Tesla', 'BMW', 'Audi', 'Mercedes'][Math.floor(Math.random() * 8)],
        model: ['Sedan', 'SUV', 'Truck', 'Coupe', 'Electric'][Math.floor(Math.random() * 5)],
        condition: ['RUNS', 'INOP'][Math.floor(Math.random() * 2)]
      }
    ];

    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 10) + 1);
    
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(deliveryDate.getDate() + Math.floor(distance / 500) + 2);

    loadsToCreate.push({
      originCity: origin.city,
      originZip: origin.zip,
      destCity: dest.city,
      destZip: dest.zip,
      distance,
      price,
      status: 'AVAILABLE' as any,
      brokerId: broker.id,
      trailerType,
      paymentType: 'COD',
      vehiclesData: JSON.stringify(vehiclesData),
      pickupDate,
      deliveryDate
    });
  }

  // Insert in chunks of 200
  const chunkSize = 200;
  for (let i = 0; i < loadsToCreate.length; i += chunkSize) {
    const chunk = loadsToCreate.slice(i, i + chunkSize);
    await prisma.load.createMany({ data: chunk });
    console.log(`Inserted chunk ${i / chunkSize + 1} of ${Math.ceil(loadsToCreate.length / chunkSize)}`);
  }

  console.log(`Successfully seeded 1000 loads worldwide.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
