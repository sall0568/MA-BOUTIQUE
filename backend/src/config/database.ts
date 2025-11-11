import { PrismaClient } from '@prisma/client';

// Création d'une instance unique du client Prisma
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // utile pour le debug
});

// Gestion propre de la fermeture du client Prisma quand le serveur s’arrête
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
