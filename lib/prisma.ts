import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          // Filtrar os apagados nos selects de User, Load
          if (
            ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(operation)
          ) {
            if (['User', 'Load'].includes(model)) {
              (args as any).where = { ...(args as any).where, deletedAt: null };
            }
          }
          // Converter delete físico para soft delete
          if (operation === 'delete') {
            if (['User', 'Load'].includes(model)) {
              return (globalForPrisma as any).prismaUnextended[model].update({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }
          }
          if (operation === 'deleteMany') {
            if (['User', 'Load'].includes(model)) {
              return (globalForPrisma as any).prismaUnextended[model].updateMany({
                where: args.where,
                data: { deletedAt: new Date() },
              });
            }
          }
          return query(args);
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = global as unknown as {
  prisma: PrismaClientSingleton;
  prismaUnextended: PrismaClient;
};

// Precisamos do unextended para poder fazer os updates originais dentro do extension
if (!globalForPrisma.prismaUnextended) {
  globalForPrisma.prismaUnextended = new PrismaClient();
}

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
