import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CITIES = ['Miami', 'Orlando', 'Tampa', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Dallas', 'Austin'];

function getRandomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createUsers() {
  console.log('Criando usuários para o teste de stress...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const usersToCreate = [];
  // 10 Brokers
  for (let i = 0; i < 10; i++) {
    usersToCreate.push({
      email: `broker_stress_${i}@test.com`,
      passwordHash,
      role: 'BROKER',
      fullName: `Stress Broker ${i}`,
      companyName: `Brokerage ${i}`,
      emailVerified: true,
      subscriptionStatus: 'ACTIVE'
    });
  }
  // 20 Carriers
  for (let i = 0; i < 20; i++) {
    usersToCreate.push({
      email: `carrier_stress_${i}@test.com`,
      passwordHash,
      role: 'CARRIER',
      fullName: `Stress Carrier ${i}`,
      companyName: `Transport ${i}`,
      emailVerified: true,
      subscriptionStatus: 'ACTIVE'
    });
  }

  await prisma.user.createMany({ data: usersToCreate as any, skipDuplicates: true });
}

async function simulateBroker(brokerId: string, iter: number) {
  try {
    const origin = getRandomItem(CITIES);
    let dest = getRandomItem(CITIES);
    while (origin === dest) dest = getRandomItem(CITIES);

    await prisma.load.create({
      data: {
        originAddress: `${iter} Main St`,
        originCity: origin,
        originZip: '33101',
        destAddress: `${iter} Oak St`,
        destCity: dest,
        destZip: '32801',
        price: 500 + iter,
        distance: 200 + iter,
        status: 'AVAILABLE',
        brokerId,
        trailerType: 'OPEN',
        paymentType: 'COD',
        pickupDate: new Date(),
        deliveryDate: new Date(),
      }
    });
    return 'success';
  } catch (error: any) {
    if (error.message.includes('pool') || error.message.includes('timeout')) return 'pool_error';
    return 'error';
  }
}

async function simulateCarrier(carrierId: string) {
  try {
    // Busca cargas disponíveis simulando o loadboard
    const loads = await prisma.load.findMany({
      where: { status: 'AVAILABLE' },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    if (loads.length > 0) {
      const load = getRandomItem(loads);
      // Carrier faz um bid simulado (apenas atualiza o updateAt para causar lock no banco)
      await prisma.load.update({
        where: { id: load.id },
        data: { updatedAt: new Date() }
      });
    }
    return 'success';
  } catch (error: any) {
    if (error.message.includes('pool') || error.message.includes('timeout')) return 'pool_error';
    return 'error';
  }
}

async function runStressTest() {
  await createUsers();

  const brokers = await prisma.user.findMany({ where: { role: 'BROKER', email: { startsWith: 'broker_stress_' } } });
  const carriers = await prisma.user.findMany({ where: { role: 'CARRIER', email: { startsWith: 'carrier_stress_' } } });

  if (brokers.length === 0 || carriers.length === 0) {
    console.error('Falha ao carregar usuários de teste.');
    return;
  }

  console.log('\n=======================================');
  console.log('🚀 INICIANDO TESTE DE CARGA (SUPABASE) 🚀');
  console.log('=======================================\n');
  
  let successCount = 0;
  let poolErrorCount = 0;
  let otherErrorCount = 0;
  
  const DURATION_SECONDS = 30; // Teste rápido e brutal de 30 segundos
  const CONCURRENCY = 30; // 30 usuários clicando exatamente no mesmo milissegundo

  const endTime = Date.now() + DURATION_SECONDS * 1000;
  let iteration = 0;

  while (Date.now() < endTime) {
    iteration++;
    const promises = [];
    
    // Dispara requisições simultâneas
    for (let i = 0; i < CONCURRENCY; i++) {
      if (i % 3 === 0) {
        // A cada 3 cliques, 1 é o Broker criando carga
        promises.push(simulateBroker(getRandomItem(brokers).id, iteration));
      } else {
        // Os outros 2 são Carriers caçando e atualizando cargas no Loadboard
        promises.push(simulateCarrier(getRandomItem(carriers).id));
      }
    }

    const results = await Promise.all(promises);
    
    for (const res of results) {
      if (res === 'success') successCount++;
      else if (res === 'pool_error') poolErrorCount++;
      else otherErrorCount++;
    }

    process.stdout.write(`\rTempo restante: ${Math.round((endTime - Date.now()) / 1000)}s | Sucesso: ${successCount} | Erros (Conexão Supabase): ${poolErrorCount}`);
    
    // Espera 100ms para disparar a próxima rajada (Ataque brutal)
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n\n=======================================');
  console.log('📊 RESULTADO DO STRESS TEST 📊');
  console.log('=======================================');
  console.log(`Transações Totais Concluídas: ${successCount}`);
  console.log(`Gargalo do Supabase (Conexões Rejeitadas): ${poolErrorCount}`);
  console.log(`Outros Erros: ${otherErrorCount}`);
  
  if (poolErrorCount > (successCount * 0.1)) {
    console.log('\n⚠️ AVISO: O Supabase (Plano Grátis) rejeitou muitas conexões por estar no limite da Pool de Conexão. Para aguentar esse tráfego no lançamento, precisaremos do plano Pro (US$ 25/mês) ou instalar o PgBouncer no projeto.');
  } else {
    console.log('\n✅ SUCESSO: Seu servidor aguentou uma enxurrada simultânea de requisições com maestria!');
  }
}

runStressTest()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect());
