/**
 * Système de gestion des rôles avancé avec hiérarchie et héritage
 */

import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, PermissionType } from './permissions';

const prisma = new PrismaClient();

export interface RoleDefinition {
  name: string;
  displayName: string;
  description?: string;
  level: number;
  parentRole?: string;
  permissions: PermissionType[];
  isSystem?: boolean;
}

/**
 * Définition des rôles par défaut avec hiérarchie
 */
export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'admin',
    displayName: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    level: 100,
    permissions: Object.values(PERMISSIONS),
    isSystem: true
  },
  {
    name: 'manager',
    displayName: 'Gestionnaire',
    description: 'Gestion complète des opérations commerciales',
    level: 75,
    parentRole: 'admin',
    permissions: [
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_UPDATE,
      PERMISSIONS.PRODUCTS_RESTOCK,
      PERMISSIONS.SALES_READ,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.CLIENTS_READ,
      PERMISSIONS.CLIENTS_CREATE,
      PERMISSIONS.CLIENTS_UPDATE,
      PERMISSIONS.CREDITS_READ,
      PERMISSIONS.CREDITS_PAY,
      PERMISSIONS.EXPENSES_READ,
      PERMISSIONS.EXPENSES_CREATE,
      PERMISSIONS.STATS_READ,
    ],
    isSystem: true
  },
  {
    name: 'cashier',
    displayName: 'Caissier',
    description: 'Gestion des ventes et clients',
    level: 50,
    parentRole: 'manager',
    permissions: [
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.SALES_READ,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.CLIENTS_READ,
      PERMISSIONS.CLIENTS_CREATE,
    ],
    isSystem: true
  },
  {
    name: 'user',
    displayName: 'Utilisateur',
    description: 'Accès en lecture seule',
    level: 25,
    parentRole: 'cashier',
    permissions: [
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.SALES_READ,
      PERMISSIONS.CLIENTS_READ,
      PERMISSIONS.STATS_READ,
    ],
    isSystem: true
  }
];

/**
 * Initialise tous les rôles par défaut dans la base de données
 */
export const initializeRoles = async (): Promise<void> => {
  console.log('🔄 Initialisation des rôles...');

  // Créer les rôles dans l'ordre de hiérarchie (du plus haut au plus bas)
  const sortedRoles = [...DEFAULT_ROLES].sort((a, b) => b.level - a.level);
  
  for (const roleDef of sortedRoles) {
    let parentRoleId: number | null = null;
    
    // Trouver le rôle parent si spécifié
    if (roleDef.parentRole) {
      const parentRole = await prisma.role.findUnique({
        where: { name: roleDef.parentRole }
      });
      if (parentRole) {
        parentRoleId = parentRole.id;
      }
    }

    // Créer ou mettre à jour le rôle
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      create: {
        name: roleDef.name,
        displayName: roleDef.displayName,
        description: roleDef.description,
        level: roleDef.level,
        parentRoleId,
        isSystem: roleDef.isSystem ?? false,
        isActive: true
      },
      update: {
        displayName: roleDef.displayName,
        description: roleDef.description,
        level: roleDef.level,
        parentRoleId,
        isSystem: roleDef.isSystem ?? false
      }
    });

    // Assigner les permissions au rôle
    for (const permissionName of roleDef.permissions) {
      // Trouver ou créer la permission
      let permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });

      if (!permission) {
        const [category] = permissionName.split(':');
        permission = await prisma.permission.create({
          data: {
            name: permissionName,
            category,
            description: `Permission pour ${permissionName}`
          }
        });
      }

      // Assigner la permission au rôle
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        create: {
          roleId: role.id,
          permissionId: permission.id
        },
        update: {}
      });
    }
  }

  console.log('✅ Rôles initialisés avec succès');
};

/**
 * Récupère toutes les permissions d'un rôle (y compris celles héritées)
 */
export const getRolePermissions = async (roleId: number): Promise<PermissionType[]> => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      parentRole: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  if (!role) {
    return [];
  }

  // Permissions directes du rôle
  const directPermissions = role.permissions.map(
    rp => rp.permission.name as PermissionType
  );

  // Permissions héritées du rôle parent (récursif)
  let inheritedPermissions: PermissionType[] = [];
  if (role.parentRole) {
    inheritedPermissions = await getRolePermissions(role.parentRole.id);
  }

  // Combiner et dédupliquer
  return [...new Set([...directPermissions, ...inheritedPermissions])];
};

/**
 * Récupère toutes les permissions d'un rôle par son nom
 */
export const getRolePermissionsByName = async (roleName: string): Promise<PermissionType[]> => {
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  });

  if (!role) {
    return [];
  }

  return getRolePermissions(role.id);
};

/**
 * Vérifie si un rôle peut gérer un autre rôle (basé sur la hiérarchie)
 */
export const canManageRole = async (
  managerRoleId: number,
  targetRoleId: number
): Promise<boolean> => {
  const managerRole = await prisma.role.findUnique({
    where: { id: managerRoleId }
  });

  const targetRole = await prisma.role.findUnique({
    where: { id: targetRoleId }
  });

  if (!managerRole || !targetRole) {
    return false;
  }

  // Un rôle peut gérer un autre rôle si son niveau est supérieur
  return managerRole.level > targetRole.level;
};

/**
 * Récupère tous les rôles qu'un utilisateur peut gérer
 */
export const getManageableRoles = async (managerRoleId: number): Promise<number[]> => {
  const managerRole = await prisma.role.findUnique({
    where: { id: managerRoleId }
  });

  if (!managerRole) {
    return [];
  }

  // Récupérer tous les rôles avec un niveau inférieur
  const roles = await prisma.role.findMany({
    where: {
      level: {
        lt: managerRole.level
      },
      isActive: true
    },
    select: {
      id: true
    }
  });

  return roles.map(r => r.id);
};

/**
 * Récupère la hiérarchie complète d'un rôle
 */
export const getRoleHierarchy = async (roleId: number): Promise<number[]> => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      childRoles: true
    }
  });

  if (!role) {
    return [];
  }

  const hierarchy: number[] = [roleId];

  // Récursivement récupérer les rôles enfants
  for (const childRole of role.childRoles) {
    const childHierarchy = await getRoleHierarchy(childRole.id);
    hierarchy.push(...childHierarchy);
  }

  return hierarchy;
};

/**
 * Vérifie si un utilisateur a un rôle spécifique ou un rôle supérieur
 */
export const hasRoleOrHigher = async (
  userId: number,
  requiredRoleName: string
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roleData: true
    }
  });

  if (!user || !user.roleData) {
    return false;
  }

  const requiredRole = await prisma.role.findUnique({
    where: { name: requiredRoleName }
  });

  if (!requiredRole) {
    return false;
  }

  // Vérifier si le niveau du rôle de l'utilisateur est >= au niveau requis
  return user.roleData.level >= requiredRole.level;
};

