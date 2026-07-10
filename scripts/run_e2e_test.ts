import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function runE2E() {
  console.log('--- STARTING PLATFORM E2E TEST ---');
  
  // 1. Provision Users
  console.log('\n[1] PROVISIONING TEST USERS...');
  const pass = await bcrypt.hash('Test1234!', 10);
  
  const broker = await prisma.user.create({
    data: { email: 'broker@test.com', passwordHash: pass, role: 'BROKER', fullName: 'Test Broker' }
  });
  const carrier = await prisma.user.create({
    data: { email: 'carrier@test.com', passwordHash: pass, role: 'CARRIER', fullName: 'Test Carrier', mcNumber: 'MC-1234' }
  });
  const driver = await prisma.user.create({
    data: { email: 'driver@test.com', passwordHash: pass, role: 'DRIVER', fullName: 'Test Driver', employerId: carrier.id }
  });
  console.log('✅ Users Created (Broker, Carrier, Driver)');

  // 2. Load Posting
  console.log('\n[2] SHIPPER POSTS A LOAD...');
  const load = await prisma.load.create({
    data: {
      brokerId: broker.id,
      originZip: '90210', originCity: 'Beverly Hills', originAddress: '123 Fake St',
      destZip: '10001', destCity: 'New York', destAddress: '456 Fake Ave',
      price: 1500.0, distance: 2500,
      pickupDate: new Date(), deliveryDate: new Date(),
      trailerType: 'OPEN', paymentType: 'COD',
      vehiclesData: [{ year: '2023', make: 'Toyota', model: 'Camry' }]
    }
  });
  console.log(`✅ Load Created (ID: ${load.id}, Status: ${load.status})`);

  // 3. Load Request
  console.log('\n[3] CARRIER REQUESTS THE LOAD...');
  const request = await prisma.loadRequest.create({
    data: { loadId: load.id, carrierId: carrier.id, bidPrice: 1500.0 }
  });
  console.log(`✅ Request Created (ID: ${request.id}, Status: ${request.status})`);

  // 4. Broker Approves & Dispatches
  console.log('\n[4] BROKER APPROVES & CARRIER ASSIGNS DRIVER...');
  await prisma.loadRequest.update({ where: { id: request.id }, data: { status: 'APPROVED' } });
  
  const bookedLoad = await prisma.load.update({
    where: { id: load.id },
    data: { status: 'BOOKED', carrierId: carrier.id, driverId: driver.id }
  });
  console.log(`✅ Load Assigned (Carrier: ${bookedLoad.carrierId}, Driver: ${bookedLoad.driverId}, Status: ${bookedLoad.status})`);

  // 5. Driver Updates Transit & Delivery
  console.log('\n[5] DRIVER FLOW (IN TRANSIT -> DELIVERED)...');
  await prisma.load.update({ where: { id: load.id }, data: { status: 'IN_TRANSIT' } });
  
  await prisma.locationHistory.create({
    data: { loadId: load.id, lat: 34.0522, lng: -118.2437 }
  });
  console.log('✅ Location recorded in Transit');

  const deliveredLoad = await prisma.load.update({
    where: { id: load.id },
    data: { 
      status: 'DELIVERED', 
      podDocumentUrl: 'https://fake-pod-url.com/doc.pdf',
      deliverySignature: 'Base64SignatureBlob'
    }
  });
  console.log(`✅ Load Delivered (Status: ${deliveredLoad.status})`);

  console.log('\n--- E2E TEST COMPLETED SUCCESSFULLY ---');
}

runE2E()
  .catch(e => {
    console.error('❌ TEST FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
