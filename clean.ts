import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({});
  console.log('Database cleaned');
}

main().catch(console.error).finally(() => prisma.$disconnect());
