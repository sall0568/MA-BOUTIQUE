import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'votre-secret-jwt-changez-moi-en-production';

// Initialiser le premier utilisateur admin
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
        role: 'admin'
      },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Compte administrateur créé avec succès',
      data: { user, token }
    });
  } catch (error) {
    next(error);
  }
};

// Connexion
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

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Créer un nouvel utilisateur (admin uniquement)
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
        role: role || 'user'
      },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
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

// Obtenir le profil de l'utilisateur connecté
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Vérifier si un admin existe
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