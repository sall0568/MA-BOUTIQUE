/**
 * Script pour assigner les rôles aux utilisateurs existants
 * 
 * Usage: npx ts-node scripts/assign-roles.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignRoles() {
  console.log('🔄 Assignation des rôles aux utilisateurs existants...\n');

  try {
    // Récupérer tous les rôles
    const roles = await prisma.role.findMany();
    const roleMap = new Map(roles.map(r => [r.name, r.id]));

    if (roles.length === 0) {
      console.log('❌ Aucun rôle trouvé. Exécutez d\'abord: npm run init-roles');
      return;
    }

    console.log('Rôles disponibles:');
    roles.forEach(r => {
      console.log(`  - ${r.name} (ID: ${r.id}, Level: ${r.level})`);
    });
    console.log('');

    // Récupérer tous les utilisateurs sans roleId
    const users = await prisma.user.findMany({
      where: { roleId: null }
    });

    if (users.length === 0) {
      console.log('✅ Tous les utilisateurs ont déjà un rôle assigné.');
      return;
    }

    console.log(`Trouvé ${users.length} utilisateur(s) sans roleId:\n`);

    let assigned = 0;
    let skipped = 0;

    for (const user of users) {
      const roleId = roleMap.get(user.role);
      
      if (roleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId }
        });
        console.log(`✅ ${user.email} -> ${user.role} (ID: ${roleId})`);
        assigned++;
      } else {
        console.log(`⚠️  ${user.email} -> Rôle "${user.role}" non trouvé, assignation du rôle "user" par défaut`);
        const defaultRoleId = roleMap.get('user');
        if (defaultRoleId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { roleId: defaultRoleId }
          });
          assigned++;
        } else {
          skipped++;
        }
      }
    }

    console.log(`\n✅ Assignation terminée: ${assigned} assigné(s), ${skipped} ignoré(s)`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation des rôles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

assignRoles();

