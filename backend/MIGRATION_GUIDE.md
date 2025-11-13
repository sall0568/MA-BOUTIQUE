# Guide de Migration - Système de Rôles

Ce guide explique comment migrer vers le nouveau système de rôles avancé.

## ✅ Étape 1: Migration Prisma

La migration Prisma a déjà été créée. Si vous devez la recréer :

```bash
cd backend
npx prisma migrate dev --name add_roles_system
```

## ✅ Étape 2: Générer le client Prisma

```bash
npx prisma generate
```

**Note**: Si vous obtenez une erreur de permission, arrêtez d'abord le serveur backend s'il est en cours d'exécution.

## ✅ Étape 3: Initialiser les rôles et permissions

```bash
npm run init-roles
```

Ou via l'API (après connexion en tant qu'admin) :

```http
POST /api/roles/init/default
Authorization: Bearer <token>
```

## ✅ Étape 4: Assigner les rôles aux utilisateurs existants

Après l'initialisation, vous devez assigner un `roleId` à chaque utilisateur existant. Vous pouvez le faire via un script ou via l'API.

### Option A: Script SQL direct

```sql
-- Assigner le rôle admin au premier utilisateur (si c'est un admin)
UPDATE User 
SET roleId = (SELECT id FROM Role WHERE name = 'admin' LIMIT 1)
WHERE role = 'admin' AND roleId IS NULL;

-- Assigner le rôle manager
UPDATE User 
SET roleId = (SELECT id FROM Role WHERE name = 'manager' LIMIT 1)
WHERE role = 'manager' AND roleId IS NULL;

-- Assigner le rôle cashier
UPDATE User 
SET roleId = (SELECT id FROM Role WHERE name = 'cashier' LIMIT 1)
WHERE role = 'cashier' AND roleId IS NULL;

-- Assigner le rôle user par défaut
UPDATE User 
SET roleId = (SELECT id FROM Role WHERE name = 'user' LIMIT 1)
WHERE roleId IS NULL;
```

### Option B: Script Node.js

Créez un fichier `backend/scripts/assign-roles.ts` :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignRoles() {
  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map(r => [r.name, r.id]));

  const users = await prisma.user.findMany({
    where: { roleId: null }
  });

  for (const user of users) {
    const roleId = roleMap.get(user.role);
    if (roleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId }
      });
      console.log(`✅ Rôle assigné à ${user.email}`);
    }
  }
}

assignRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Puis exécutez :

```bash
npx ts-node scripts/assign-roles.ts
```

## ✅ Étape 5: Vérifier la migration

1. Vérifiez que tous les utilisateurs ont un `roleId` :
```sql
SELECT id, email, role, roleId FROM User;
```

2. Vérifiez que les rôles sont créés :
```sql
SELECT * FROM Role;
```

3. Vérifiez que les permissions sont assignées :
```sql
SELECT r.name, COUNT(rp.permissionId) as permission_count
FROM Role r
LEFT JOIN RolePermission rp ON r.id = rp.roleId
GROUP BY r.id, r.name;
```

## 🔄 Compatibilité

Le système est rétrocompatible :
- Le champ `role` (string) reste pour compatibilité
- Le système vérifie d'abord `roleData` (via `roleId`), puis fait un fallback sur `role` (string)
- Les utilisateurs existants continueront de fonctionner même sans `roleId`

## ⚠️ Notes importantes

1. **Arrêtez le serveur** avant de générer le client Prisma si vous obtenez des erreurs de permission
2. **Sauvegardez votre base de données** avant d'exécuter les migrations
3. Les rôles système (admin, manager, cashier, user) ne peuvent pas être supprimés
4. Un utilisateur peut avoir un `roleId` NULL, mais le système utilisera le champ `role` (string) comme fallback

## 🐛 Dépannage

### Erreur: "EPERM: operation not permitted"
- Arrêtez le serveur backend
- Fermez tous les processus qui utilisent la base de données
- Réessayez `npx prisma generate`

### Erreur: "Migration already exists"
- La migration existe déjà, c'est normal
- Passez directement à l'étape 3 (initialisation des rôles)

### Les permissions ne fonctionnent pas
- Vérifiez que les rôles sont initialisés : `npm run init-roles`
- Vérifiez que les utilisateurs ont un `roleId` assigné
- Vérifiez les logs du serveur pour les erreurs

