import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES = [
  { city: 'Miami', zip: '33101', state: 'FL' },
  { city: 'Orlando', zip: '32801', state: 'FL' },
  { city: 'Tampa', zip: '33602', state: 'FL' },
  { city: 'New York', zip: '10001', state: 'NY' },
  { city: 'Los Angeles', zip: '90001', state: 'CA' },
  { city: 'Chicago', zip: '60601', state: 'IL' },
  { city: 'Houston', zip: '77001', state: 'TX' },
  { city: 'Phoenix', zip: '85001', state: 'AZ' },
  { city: 'Philadelphia', zip: '19019', state: 'PA' },
  { city: 'San Antonio', zip: '78201', state: 'TX' },
  { city: 'San Diego', zip: '92101', state: 'CA' },
  { city: 'Dallas', zip: '75201', state: 'TX' },
  { city: 'San Jose', zip: '95101', state: 'CA' },
  { city: 'Austin', zip: '73301', state: 'TX' },
  { city: 'Jacksonville', zip: '32099', state: 'FL' },
  { city: 'Fort Worth', zip: '76101', state: 'TX' },
  { city: 'Columbus', zip: '43201', state: 'OH' },
  { city: 'San Francisco', zip: '94101', state: 'CA' },
  { city: 'Charlotte', zip: '28201', state: 'NC' },
  { city: 'Indianapolis', zip: '46201', state: 'IN' },
  { city: 'Seattle', zip: '98101', state: 'WA' },
  { city: 'Denver', zip: '80201', state: 'CO' },
  { city: 'Washington', zip: '20001', state: 'DC' },
  { city: 'Boston', zip: '02101', state: 'MA' },
  { city: 'El Paso', zip: '79901', state: 'TX' },
  { city: 'Nashville', zip: '37201', state: 'TN' },
  { city: 'Detroit', zip: '48201', state: 'MI' },
  { city: 'Oklahoma City', zip: '73101', state: 'OK' },
  { city: 'Portland', zip: '97201', state: 'OR' },
  { city: 'Las Vegas', zip: '89101', state: 'NV' }
];

const VEHICLES = [
  [{ id: 1, model: '2024 Tesla Model Y', type: 'SUV', operable: true }],
  [{ id: 1, model: '2023 Ford F-150', type: 'Pickup', operable: true }],
  [{ id: 1, model: '2021 Toyota Camry', type: 'Sedan', operable: false }],
  [{ id: 1, model: '2022 Honda Civic', type: 'Sedan', operable: true }, { id: 2, model: '2020 Honda Accord', type: 'Sedan', operable: true }],
  [{ id: 1, model: '2025 Porsche 911', type: 'Coupe', operable: true }],
  [{ id: 1, model: '2019 Chevrolet Silverado', type: 'Pickup', operable: false }],
];

function getRandomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Starting stress test database seed...');
  
  const startTime = Date.now();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create 1000 Users
  console.log('Generating 1000 users...');
  const users = [];
  const roles = ['BROKER', 'CARRIER', 'DRIVER', 'DEALER'];
  
  for (let i = 0; i < 1000; i++) {
    const role = getRandomItem(roles);
    users.push({
      email: `stress_user_${Date.now()}_${i}@test.com`,
      passwordHash,
      role,
      fullName: `Stress User ${i}`,
      companyName: `Stress Co ${i}`,
      emailVerified: true,
      subscriptionStatus: 'ACTIVE'
    });
  }

  // Insert users in chunks of 500
  let userCount = 0;
  for (let i = 0; i < users.length; i += 500) {
    const chunk = users.slice(i, i + 500);
    const res = await prisma.user.createMany({ data: chunk as any, skipDuplicates: true });
    userCount += res.count;
    console.log(`Inserted ${userCount}/1000 users`);
  }

  // Get Broker IDs
  const brokers = await prisma.user.findMany({
    where: { role: 'BROKER' },
    select: { id: true }
  });

  if (brokers.length === 0) {
    throw new Error('No brokers found to assign loads');
  }

  // 2. Create 50,000 Loads
  console.log('Generating 50,000 loads...');
  const loads = [];
  const totalLoads = 50000;

  for (let i = 0; i < totalLoads; i++) {
    const origin = getRandomItem(CITIES);
    let dest = getRandomItem(CITIES);
    while (origin.city === dest.city) {
      dest = getRandomItem(CITIES);
    }

    const price = getRandomNumber(300, 3500);
    const distance = getRandomNumber(50, 2500);
    const trailerType = Math.random() > 0.8 ? 'ENCLOSED' : 'OPEN';
    const paymentType = Math.random() > 0.5 ? 'COD' : 'QUICKPAY';
    const brokerId = getRandomItem(brokers).id;
    
    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + getRandomNumber(1, 10));
    
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(deliveryDate.getDate() + getRandomNumber(1, 5));

    loads.push({
      originAddress: `${getRandomNumber(100, 9999)} Stress Test St`,
      originCity: origin.city,
      originZip: origin.zip,
      destAddress: `${getRandomNumber(100, 9999)} Finish Line Ave`,
      destCity: dest.city,
      destZip: dest.zip,
      price,
      distance,
      status: 'AVAILABLE',
      brokerId,
      trailerType,
      paymentType,
      vehiclesData: getRandomItem(VEHICLES),
      pickupDate,
      deliveryDate
    });
  }

  // Insert loads in chunks of 5000
  let loadCount = 0;
  for (let i = 0; i < loads.length; i += 5000) {
    const chunk = loads.slice(i, i + 5000);
    const res = await prisma.load.createMany({ data: chunk as any });
    loadCount += res.count;
    console.log(`Inserted ${loadCount}/${totalLoads} loads`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nStress test seed completed successfully in ${duration} seconds!`);
  console.log(`Created ${userCount} users and ${loadCount} loads.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
