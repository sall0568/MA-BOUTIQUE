import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { hasPermission, PermissionType } from '../utils/permissions';

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