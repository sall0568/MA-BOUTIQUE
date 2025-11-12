import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Définition des permissions disponibles
export const PERMISSIONS = {
  // Produits
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_RESTOCK: 'products:restock',
  
  // Ventes
  SALES_READ: 'sales:read',
  SALES_CREATE: 'sales:create',
  SALES_DELETE: 'sales:delete',
  
  // Clients
  CLIENTS_READ: 'clients:read',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  
  // Crédits
  CREDITS_READ: 'credits:read',
  CREDITS_PAY: 'credits:pay',
  
  // Dépenses
  EXPENSES_READ: 'expenses:read',
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_DELETE: 'expenses:delete',
  
  // Statistiques
  STATS_READ: 'stats:read',
  
  // Utilisateurs
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_PERMISSIONS: 'users:manage_permissions',
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Définition des rôles et leurs permissions
export const ROLES = {
  ADMIN: {
    name: 'admin',
    permissions: Object.values(PERMISSIONS) // Toutes les permissions
  },
  MANAGER: {
    name: 'manager',
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
    ]
  },
  CASHIER: {
    name: 'cashier',
    permissions: [
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.SALES_READ,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.CLIENTS_READ,
      PERMISSIONS.CLIENTS_CREATE,
    ]
  },
  USER: {
    name: 'user',
    permissions: [
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.SALES_READ,
      PERMISSIONS.CLIENTS_READ,
      PERMISSIONS.STATS_READ,
    ]
  }
} as const;

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export const hasPermission = async (
  userId: number, 
  permission: PermissionType
): Promise<boolean> => {
  // Récupérer l'utilisateur et ses permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  if (!user) {
    return false;
  }
  
  // Les admins ont toutes les permissions
  if (user.role === 'admin') {
    return true;
  }
  
  // Vérifier si la permission est accordée
  const hasDirectPermission = user.permissions.some(
    up => up.permission.name === permission
  );
  
  if (hasDirectPermission) {
    return true;
  }
  
  // Vérifier les permissions du rôle
  const rolePermissions = getRolePermissions(user.role);
  return rolePermissions.includes(permission);
};

/**
 * Vérifie si un utilisateur a plusieurs permissions
 */
export const hasAllPermissions = async (
  userId: number,
  permissions: PermissionType[]
): Promise<boolean> => {
  const results = await Promise.all(
    permissions.map(p => hasPermission(userId, p))
  );
  
  return results.every(r => r === true);
};

/**
 * Vérifie si un utilisateur a au moins une des permissions
 */
export const hasAnyPermission = async (
  userId: number,
  permissions: PermissionType[]
): Promise<boolean> => {
  const results = await Promise.all(
    permissions.map(p => hasPermission(userId, p))
  );
  
  return results.some(r => r === true);
};

/**
 * Récupère toutes les permissions d'un utilisateur
 */
export const getUserPermissions = async (userId: number): Promise<PermissionType[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  if (!user) {
    return [];
  }
  
  // Permissions du rôle
  const rolePermissions = getRolePermissions(user.role);
  
  // Permissions directes
  const directPermissions = user.permissions.map(
    up => up.permission.name as PermissionType
  );
  
  // Combiner et dédupliquer
  return [...new Set([...rolePermissions, ...directPermissions])];
};

/**
 * Accorde une permission à un utilisateur
 */
export const grantPermission = async (
  userId: number,
  permissionName: PermissionType,
  grantedBy: number
): Promise<void> => {
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
  
  // Accorder la permission
  await prisma.userPermission.upsert({
    where: {
      userId_permissionId: {
        userId,
        permissionId: permission.id
      }
    },
    create: {
      userId,
      permissionId: permission.id,
      grantedBy
    },
    update: {
      grantedBy
    }
  });
};

/**
 * Révoque une permission d'un utilisateur
 */
export const revokePermission = async (
  userId: number,
  permissionName: PermissionType
): Promise<void> => {
  const permission = await prisma.permission.findUnique({
    where: { name: permissionName }
  });
  
  if (!permission) {
    return;
  }
  
  await prisma.userPermission.deleteMany({
    where: {
      userId,
      permissionId: permission.id
    }
  });
};

/**
 * Obtient les permissions d'un rôle
 */
function getRolePermissions(role: string): PermissionType[] {
  switch (role) {
    case 'admin':
      return ROLES.ADMIN.permissions;
    case 'manager':
      return ROLES.MANAGER.permissions;
    case 'cashier':
      return ROLES.CASHIER.permissions;
    case 'user':
      return ROLES.USER.permissions;
    default:
      return [];
  }
}

/**
 * Initialise toutes les permissions dans la base de données
 */
export const initializePermissions = async (): Promise<void> => {
  const allPermissions = Object.entries(PERMISSIONS).map(([key, value]) => {
    const [category] = value.split(':');
    return {
      name: value,
      category,
      description: `Permission pour ${value}`
    };
  });
  
  for (const perm of allPermissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      create: perm,
      update: perm
    });
  }
  
  console.log('✅ Permissions initialisées');
};