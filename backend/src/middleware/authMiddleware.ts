import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { hasPermission, PermissionType } from '../utils/permissions';
import { hasRoleOrHigher, canManageRole } from '../utils/roles';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Middleware d'authentification JWT
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant. Authentification requise.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Token invalide ou expiré.'
    });
  }
};

/**
 * Middleware pour vérifier le rôle admin
 */
export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }
  next();
};

/**
 * Middleware pour vérifier une permission spécifique
 */
export const requirePermission = (permission: PermissionType) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise'
        });
      }

      const hasAccess = await hasPermission(req.user.id, permission);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `Permission refusée: ${permission}`
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour vérifier plusieurs permissions (toutes requises)
 */
export const requireAllPermissions = (permissions: PermissionType[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise'
        });
      }

      const checks = await Promise.all(
        permissions.map(p => hasPermission(req.user!.id, p))
      );

      if (!checks.every(check => check)) {
        return res.status(403).json({
          success: false,
          error: 'Permissions insuffisantes'
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour vérifier au moins une permission
 */
export const requireAnyPermission = (permissions: PermissionType[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise'
        });
      }

      const checks = await Promise.all(
        permissions.map(p => hasPermission(req.user!.id, p))
      );

      if (!checks.some(check => check)) {
        return res.status(403).json({
          success: false,
          error: 'Aucune permission requise trouvée'
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware optionnel: extrait le user s'il est authentifié, sinon continue
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Ignore les erreurs et continue sans user
    next();
  }
};

/**
 * Middleware pour vérifier qu'un utilisateur a un rôle spécifique ou supérieur
 */
export const requireRole = (roleName: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise'
        });
      }

      const hasAccess = await hasRoleOrHigher(req.user.id, roleName);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `Rôle requis: ${roleName} ou supérieur`
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du rôle'
      });
    }
  };
};

/**
 * Middleware pour vérifier qu'un utilisateur peut gérer un rôle spécifique
 */
export const requireCanManageRole = (roleIdParam: string = 'id') => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise'
        });
      }

      const targetRoleId = parseInt(req.params[roleIdParam]);

      if (isNaN(targetRoleId)) {
        return res.status(400).json({
          success: false,
          error: 'ID de rôle invalide'
        });
      }

      // Récupérer le rôle de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        // @ts-ignore - roleData sera disponible après la génération du client Prisma
        include: { roleData: true }
      });

      if (!user) {
        return res.status(403).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      // @ts-ignore - roleData sera disponible après la génération du client Prisma
      if (!user.roleData || !user.roleData.id) {
        return res.status(403).json({
          success: false,
          error: 'Rôle utilisateur non trouvé. Veuillez assigner un rôle à cet utilisateur.'
        });
      }

      // @ts-ignore
      const canManage = await canManageRole(user.roleData.id, targetRoleId);

      if (!canManage) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'avez pas la permission de gérer ce rôle'
        });
      }

      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};