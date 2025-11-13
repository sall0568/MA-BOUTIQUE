/**
 * Script d'initialisation des rôles et permissions
 * 
 * Usage: npx ts-node scripts/init-roles.ts
 */

import { PrismaClient } from '@prisma/client';
import { initializeRoles } from '../src/utils/roles';
import { initializePermissions } from '../src/utils/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initialisation des rôles et permissions...\n');

  try {
    // Initialiser les permissions
    await initializePermissions();
    
    // Initialiser les rôles
    await initializeRoles();

    console.log('\n✅ Initialisation terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

