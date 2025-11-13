# Système de Rôles Avancé

Ce document décrit le système de rôles avancé avec hiérarchie et héritage de permissions.

## 📋 Vue d'ensemble

Le système de rôles permet de :
- Définir des rôles avec des niveaux de hiérarchie
- Hériter des permissions des rôles parents
- Gérer les permissions de manière granulaire
- Contrôler qui peut gérer quels rôles

## 🏗️ Architecture

### Modèles de données

#### Role
- `id` : Identifiant unique
- `name` : Nom unique du rôle (ex: "admin", "manager")
- `displayName` : Nom d'affichage (ex: "Administrateur")
- `description` : Description du rôle
- `level` : Niveau de hiérarchie (plus élevé = plus de pouvoir)
- `parentRoleId` : Rôle parent pour l'héritage
- `isSystem` : Rôle système (non supprimable)
- `isActive` : Statut actif/inactif

#### RolePermission
- Lien entre un rôle et une permission
- Permet d'assigner des permissions spécifiques à un rôle

### Hiérarchie des rôles

```
Admin (level: 100)
  └── Manager (level: 75)
      └── Cashier (level: 50)
          └── User (level: 25)
```

Un rôle hérite automatiquement de toutes les permissions de son rôle parent.

## 🔧 Fonctionnalités

### 1. Gestion des rôles

#### Créer un rôle
```http
POST /api/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "supervisor",
  "displayName": "Superviseur",
  "description": "Supervise les opérations",
  "level": 60,
  "parentRoleId": 2,
  "permissions": ["products:read", "sales:read"]
}
```

#### Récupérer tous les rôles
```http
GET /api/roles
Authorization: Bearer <token>
```

#### Récupérer un rôle par ID
```http
GET /api/roles/:id
Authorization: Bearer <token>
```

#### Mettre à jour un rôle
```http
PUT /api/roles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Nouveau nom",
  "isActive": true
}
```

#### Supprimer un rôle
```http
DELETE /api/roles/:id
Authorization: Bearer <token>
```

### 2. Gestion des permissions

#### Assigner des permissions à un rôle
```http
POST /api/roles/:id/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": [
    "products:read",
    "products:create",
    "sales:read"
  ]
}
```

### 3. Vérification des permissions

Le système vérifie les permissions dans cet ordre :
1. Permissions directes de l'utilisateur
2. Permissions du rôle (y compris héritées)
3. Permissions par nom de rôle (fallback)

### 4. Contrôle d'accès

Un utilisateur peut gérer un rôle si :
- Son niveau de rôle est supérieur au niveau du rôle cible
- Il a la permission `users:manage_permissions`

## 🛡️ Middlewares

### requireRole(roleName)
Vérifie qu'un utilisateur a un rôle spécifique ou supérieur.

```typescript
router.get('/admin-only', requireRole('admin'), handler);
```

### requireCanManageRole(roleIdParam)
Vérifie qu'un utilisateur peut gérer un rôle spécifique.

```typescript
router.put('/roles/:id', requireCanManageRole('id'), handler);
```

### requirePermission(permission)
Vérifie qu'un utilisateur a une permission spécifique.

```typescript
router.post('/products', requirePermission(PERMISSIONS.PRODUCTS_CREATE), handler);
```

## 📝 Rôles par défaut

### Admin (level: 100)
- Toutes les permissions
- Peut gérer tous les autres rôles
- Rôle système (non supprimable)

### Manager (level: 75)
- Gestion complète des opérations commerciales
- Peut gérer les rôles Cashier et User
- Rôle système

### Cashier (level: 50)
- Gestion des ventes et clients
- Peut gérer le rôle User
- Rôle système

### User (level: 25)
- Accès en lecture seule
- Rôle système

## 🚀 Initialisation

### Script d'initialisation

```bash
npm run init-roles
```

Ce script :
1. Initialise toutes les permissions dans la base de données
2. Crée les rôles par défaut avec leurs hiérarchies
3. Assigne les permissions aux rôles

### Via API

```http
POST /api/roles/init/default
Authorization: Bearer <token>
```

## 🔄 Migration depuis l'ancien système

L'ancien système utilisait uniquement le champ `role` (string) dans le modèle User. Le nouveau système ajoute :
- Un champ `roleId` qui référence le modèle Role
- Le champ `role` reste pour compatibilité

Pour migrer :
1. Exécuter la migration Prisma
2. Exécuter le script d'initialisation des rôles
3. Assigner les `roleId` aux utilisateurs existants

## 📚 Exemples d'utilisation

### Vérifier si un utilisateur peut gérer un rôle

```typescript
import { canManageRole } from './utils/roles';

const canManage = await canManageRole(managerRoleId, targetRoleId);
```

### Récupérer toutes les permissions d'un rôle (y compris héritées)

```typescript
import { getRolePermissions } from './utils/roles';

const permissions = await getRolePermissions(roleId);
```

### Récupérer les rôles qu'un utilisateur peut gérer

```typescript
import { getManageableRoles } from './utils/roles';

const manageableRoleIds = await getManageableRoles(managerRoleId);
```

## 🔒 Sécurité

- Les rôles système ne peuvent pas être supprimés
- Un rôle ne peut pas être modifié pour avoir un niveau supérieur à celui de l'utilisateur qui le modifie
- Un rôle ne peut pas être supprimé s'il est utilisé par des utilisateurs
- Les permissions sont vérifiées à chaque requête

## 📖 Références

- `backend/src/utils/roles.ts` : Utilitaires de gestion des rôles
- `backend/src/utils/permissions.ts` : Utilitaires de gestion des permissions
- `backend/src/controllers/roleController.ts` : Contrôleurs des rôles
- `backend/src/routes/roles.ts` : Routes API des rôles

