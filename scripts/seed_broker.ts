import { PrismaClient, LoadStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const email = 'broker@axlegrid.com';

  console.log(`Seeding database with a Broker...`);
  
  let broker = await prisma.user.findUnique({ where: { email } });
  
  if (!broker) {
    broker = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'BROKER',
        fullName: 'John Broker',
        companyName: 'AxleGrid Logistics LLC',
        phone: '555-0192',
        emailVerified: true,
        onboardingCompleted: true,
      }
    });
    console.log(`Created new broker: ${email}`);
  } else {
    console.log(`Broker already exists: ${email}`);
  }

  // Create 3 loads
  console.log(`Creating test loads for the broker...`);
  
  const loads = [
    {
      originCity: 'Miami, FL',
      originZip: '33101',
      originAddress: '123 Ocean Dr',
      destCity: 'Orlando, FL',
      destZip: '32801',
      destAddress: '456 Disney Way',
      price: 450,
      distance: 235,
      status: 'AVAILABLE' as LoadStatus,
      vehiclesData: [{ make: 'Toyota', model: 'Camry', year: 2022, operable: true }],
      pickupDate: new Date(Date.now() + 86400000), // Tomorrow
      deliveryDate: new Date(Date.now() + 86400000 * 2),
    },
    {
      originCity: 'Dallas, TX',
      originZip: '75201',
      originAddress: '789 Main St',
      destCity: 'Houston, TX',
      destZip: '77001',
      destAddress: '101 Space Blvd',
      price: 320,
      distance: 240,
      status: 'AVAILABLE' as LoadStatus,
      vehiclesData: [{ make: 'Ford', model: 'Mustang', year: 2020, operable: true }],
      pickupDate: new Date(Date.now() + 86400000 * 2), 
      deliveryDate: new Date(Date.now() + 86400000 * 3),
    },
    {
      originCity: 'Los Angeles, CA',
      originZip: '90001',
      originAddress: '555 Hollywood Blvd',
      destCity: 'Las Vegas, NV',
      destZip: '89101',
      destAddress: '777 Casino Strip',
      price: 600,
      distance: 270,
      status: 'AVAILABLE' as LoadStatus,
      vehiclesData: [
        { make: 'Tesla', model: 'Model 3', year: 2023, operable: true },
        { make: 'Honda', model: 'Civic', year: 2021, operable: true }
      ],
      pickupDate: new Date(Date.now() + 86400000 * 5), 
      deliveryDate: new Date(Date.now() + 86400000 * 6),
    }
  ];

  for (const loadData of loads) {
    await prisma.load.create({
      data: {
        ...loadData,
        brokerId: broker.id,
      }
    });
  }

  console.log(`Successfully created ${loads.length} loads!`);
  console.log(`\n--- CREDENTIALS ---`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`-------------------\n`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
