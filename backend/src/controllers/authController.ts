import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  generateTokenPair,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
} from '../utils/jwt';
import { getUserPermissions } from '../utils/permissions';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

// ===== INITIALISATION =====

export const initAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur existe déjà'
      });
    }

    const { email, password, nom } = req.body;

    if (!email || !password || !nom) {
      return res.status(400).json({
        success: false,
        error: 'Email, mot de passe et nom requis'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        role: 'admin',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    const tokens = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'Compte administrateur créé avec succès',
      data: {
        user,
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===== CONNEXION =====

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Compte désactivé. Contactez un administrateur.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    const tokens = await generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const permissions = await getUserPermissions(user.id);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          role: user.role,
          permissions
        },
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===== REFRESH TOKEN =====

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token requis'
      });
    }

    const payload = await verifyRefreshToken(refreshToken);
    
    const tokens = await generateTokenPair(payload);

    // Optionnel: révoquer l'ancien refresh token
    await revokeRefreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: tokens
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Refresh token invalide'
    });
  }
};

// ===== DÉCONNEXION =====

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    await revokeAllUserTokens(req.user.id);

    res.json({
      success: true,
      message: 'Déconnexion de tous les appareils réussie'
    });
  } catch (error) {
    next(error);
  }
};

// ===== GESTION DES UTILISATEURS =====

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, password, nom, role } = req.body;

    if (!email || !password || !nom) {
      return res.status(400).json({
        success: false,
        error: 'Email, mot de passe et nom requis'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        role: role || 'user',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const permissions = await getUserPermissions(req.user!.id);

    res.json({
      success: true,
      data: {
        ...user,
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const checkAdminExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminExists = await prisma.user.count() > 0;

    res.json({
      success: true,
      data: { adminExists }
    });
  } catch (error) {
    next(error);
  }
};