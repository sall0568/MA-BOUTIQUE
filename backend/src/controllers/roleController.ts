import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  initializeRoles,
  getRolePermissions,
  canManageRole,
  getManageableRoles,
  getRoleHierarchy,
  hasRoleOrHigher
} from '../utils/roles';
import { PERMISSIONS } from '../utils/permissions';

const prisma = new PrismaClient();

/**
 * Récupère tous les rôles
 */
export const getAllRoles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore - role sera disponible après la génération du client Prisma
    const roles = await prisma.role.findMany({
      where: {
        isActive: true
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        parentRole: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        level: 'desc'
      }
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère un rôle par son ID
 */
export const getRoleById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // @ts-ignore - role sera disponible après la génération du client Prisma
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        parentRole: {
          select: {
            id: true,
            name: true,
            displayName: true,
            level: true
          }
        },
        childRoles: {
          select: {
            id: true,
            name: true,
            displayName: true,
            level: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }

    // Récupérer toutes les permissions (y compris héritées)
    const allPermissions = await getRolePermissions(role.id);

    res.json({
      success: true,
      data: {
        ...role,
        allPermissions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crée un nouveau rôle
 */
export const createRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    const { name, displayName, description, level, parentRoleId, permissions } = req.body;

    if (!name || !displayName || level === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Nom, nom d\'affichage et niveau sont requis'
      });
    }

    // Vérifier si l'utilisateur peut créer des rôles
    const userRole = await prisma.user.findUnique({
      where: { id: req.user.id },
      // @ts-ignore - roleData sera disponible après la génération du client Prisma
      include: { roleData: true }
    });

    // @ts-ignore
    if (!userRole?.roleData) {
      return res.status(403).json({
        success: false,
        error: 'Rôle utilisateur non trouvé'
      });
    }

    // Vérifier si le rôle parent peut être géré
    if (parentRoleId) {
      // @ts-ignore
      const canManage = await canManageRole(userRole.roleData.id, parentRoleId);
      if (!canManage) {
        return res.status(403).json({
          success: false,
          error: 'Vous ne pouvez pas créer un rôle avec ce rôle parent'
        });
      }
    }

    // Vérifier si le niveau est valide
    if (parentRoleId) {
      // @ts-ignore - role sera disponible après la génération du client Prisma
      const parentRole = await prisma.role.findUnique({
        where: { id: parentRoleId }
      });
      if (parentRole && level >= parentRole.level) {
        return res.status(400).json({
          success: false,
          error: 'Le niveau du rôle doit être inférieur au rôle parent'
        });
      }
    }

    // Créer le rôle
    // @ts-ignore - role sera disponible après la génération du client Prisma
    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description,
        level,
        parentRoleId: parentRoleId || null,
        isSystem: false,
        isActive: true
      }
    });

    // Assigner les permissions si fournies
    if (permissions && Array.isArray(permissions)) {
      for (const permissionName of permissions) {
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

        // @ts-ignore - rolePermission sera disponible après la génération du client Prisma
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
            grantedBy: req.user.id
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Rôle créé avec succès',
      data: role
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Un rôle avec ce nom existe déjà'
      });
    }
    next(error);
  }
};

/**
 * Met à jour un rôle
 */
export const updateRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    const { id } = req.params;
    const { displayName, description, level, parentRoleId, isActive } = req.body;

    // @ts-ignore - role sera disponible après la génération du client Prisma
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }

    // Vérifier si c'est un rôle système
    if (role.isSystem && (level !== undefined || parentRoleId !== undefined)) {
      return res.status(403).json({
        success: false,
        error: 'Les rôles système ne peuvent pas être modifiés'
      });
    }

    // Vérifier les permissions
    const userRole = await prisma.user.findUnique({
      where: { id: req.user.id },
      // @ts-ignore - roleData sera disponible après la génération du client Prisma
      include: { roleData: true }
    });

    // @ts-ignore
    if (!userRole?.roleData) {
      return res.status(403).json({
        success: false,
        error: 'Rôle utilisateur non trouvé'
      });
    }

    // @ts-ignore
    const canManage = await canManageRole(userRole.roleData.id, role.id);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas la permission de modifier ce rôle'
      });
    }

    // Mettre à jour le rôle
    // @ts-ignore - role sera disponible après la génération du client Prisma
    const updatedRole = await prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        ...(displayName && { displayName }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level }),
        ...(parentRoleId !== undefined && { parentRoleId: parentRoleId || null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      data: updatedRole
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprime un rôle
 */
export const deleteRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    const { id } = req.params;

    // @ts-ignore - role sera disponible après la génération du client Prisma
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }

    // Vérifier si c'est un rôle système
    if (role.isSystem) {
      return res.status(403).json({
        success: false,
        error: 'Les rôles système ne peuvent pas être supprimés'
      });
    }

    // Vérifier si le rôle est utilisé
    if (role._count.users > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ce rôle est utilisé par des utilisateurs et ne peut pas être supprimé'
      });
    }

    // Vérifier les permissions
    const userRole = await prisma.user.findUnique({
      where: { id: req.user.id },
      // @ts-ignore - roleData sera disponible après la génération du client Prisma
      include: { roleData: true }
    });

    // @ts-ignore
    if (!userRole?.roleData) {
      return res.status(403).json({
        success: false,
        error: 'Rôle utilisateur non trouvé'
      });
    }

    // @ts-ignore
    const canManage = await canManageRole(userRole.roleData.id, role.id);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas la permission de supprimer ce rôle'
      });
    }

    // Supprimer le rôle
    // @ts-ignore - role sera disponible après la génération du client Prisma
    await prisma.role.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Rôle supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assigner des permissions à un rôle
 */
export const assignPermissionsToRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        error: 'Les permissions doivent être un tableau'
      });
    }

    // @ts-ignore - role sera disponible après la génération du client Prisma
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }

    // Vérifier les permissions
    const userRole = await prisma.user.findUnique({
      where: { id: req.user.id },
      // @ts-ignore - roleData sera disponible après la génération du client Prisma
      include: { roleData: true }
    });

    // @ts-ignore
    if (!userRole?.roleData) {
      return res.status(403).json({
        success: false,
        error: 'Rôle utilisateur non trouvé'
      });
    }

    // @ts-ignore
    const canManage = await canManageRole(userRole.roleData.id, role.id);
    if (!canManage) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas la permission de modifier ce rôle'
      });
    }

    // Supprimer toutes les permissions existantes
    // @ts-ignore - rolePermission sera disponible après la génération du client Prisma
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    // Ajouter les nouvelles permissions
    for (const permissionName of permissions) {
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

      // @ts-ignore - rolePermission sera disponible après la génération du client Prisma
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
          grantedBy: req.user.id
        }
      });
    }

    res.json({
      success: true,
      message: 'Permissions assignées avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialise les rôles par défaut
 */
export const initRoles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await initializeRoles();
    res.json({
      success: true,
      message: 'Rôles initialisés avec succès'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les rôles qu'un utilisateur peut gérer
 */
export const getManageableRolesList = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    const userRole = await prisma.user.findUnique({
      where: { id: req.user.id },
      // @ts-ignore - roleData sera disponible après la génération du client Prisma
      include: { roleData: true }
    });

    // @ts-ignore
    if (!userRole?.roleData) {
      return res.status(403).json({
        success: false,
        error: 'Rôle utilisateur non trouvé'
      });
    }

    // @ts-ignore
    const manageableRoleIds = await getManageableRoles(userRole.roleData.id);

    // @ts-ignore - role sera disponible après la génération du client Prisma
    const roles = await prisma.role.findMany({
      where: {
        id: {
          in: manageableRoleIds
        },
        isActive: true
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        level: 'desc'
      }
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

