import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/hash';

const prisma = new PrismaClient();

async function main() {
  const email = 'broker.teste@axlegrid.com';
  const password = 'Password123!';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { email } });
  }

  const hashedPassword = await hashPassword(password);

  // 1. Criar o Broker
  const broker = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      role: 'BROKER',
      fullName: 'Broker Teste Silva',
      companyName: 'Logística Alfa (Test)',
      companyAddress: '123 Main St',
      companyCity: 'Chicago',
      companyState: 'IL',
      companyZip: '60601',
      phone: '555-0199',
      emailVerified: true,
      subscriptionStatus: 'ACTIVE', // Para evitar paywalls
    }
  });

  // 2. Criar uma Carga para ele
  const load = await prisma.load.create({
    data: {
      brokerId: broker.id,
      originZip: '33101',
      originCity: 'Miami, FL',
      originAddress: '100 Biscayne Blvd',
      destZip: '30301',
      destCity: 'Atlanta, GA',
      destAddress: '200 Peachtree St',
      price: 1850.00,
      distance: 660,
      trailerType: 'OPEN',
      paymentType: 'QUICKPAY',
      status: 'AVAILABLE',
      pickupDate: new Date(),
      deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Daqui a 2 dias
    }
  });

  console.log(`\n✅ CONTA DE BROKER CRIADA COM SUCESSO!\n`);
  console.log(`Email: ${email}`);
  console.log(`Senha: ${password}`);
  console.log(`\nCarga Disponível Criada:`);
  console.log(`Origem: ${load.originCity}`);
  console.log(`Destino: ${load.destCity}`);
  console.log(`Preço: $${load.price}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
