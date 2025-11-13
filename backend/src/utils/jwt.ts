import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { jwtConfig } from '../config/jwt.config';

const prisma = new PrismaClient();

// Configuration JWT (chargée depuis le module de configuration centralisé)
const JWT_ACCESS_SECRET = jwtConfig.accessSecret;
const JWT_REFRESH_SECRET = jwtConfig.refreshSecret;
const JWT_ACCESS_EXPIRES_IN = jwtConfig.accessExpiresIn;
const JWT_REFRESH_EXPIRES_IN = jwtConfig.refreshExpiresIn;

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

/**
 * Génère un access token (courte durée)
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256'
  } as jwt.SignOptions);
};

/**
 * Génère un refresh token (longue durée)
 */
export const generateRefreshToken = async (userId: number): Promise<string> => {
  // Générer un token aléatoire sécurisé
  const token = crypto.randomBytes(64).toString('hex');
  
  // Calculer la date d'expiration
  const expiresAt = new Date();
  const expirationMs = parseExpiration(JWT_REFRESH_EXPIRES_IN);
  expiresAt.setTime(expiresAt.getTime() + expirationMs);
  
  // Stocker en base de données
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      isRevoked: false
    }
  });
  
  return token;
};

/**
 * Vérifie un access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};

/**
 * Vérifie un refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<JWTPayload> => {
  // Chercher le token en base
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!refreshToken) {
    throw new Error('Refresh token invalide');
  }
  
  if (refreshToken.isRevoked) {
    throw new Error('Refresh token révoqué');
  }
  
  if (new Date() > refreshToken.expiresAt) {
    throw new Error('Refresh token expiré');
  }
  
  if (!refreshToken.user.isActive) {
    throw new Error('Utilisateur désactivé');
  }
  
  return {
    id: refreshToken.user.id,
    email: refreshToken.user.email,
    role: refreshToken.user.role
  };
};

/**
 * Révoque un refresh token
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { isRevoked: true }
  });
};

/**
 * Révoque tous les refresh tokens d'un utilisateur
 */
export const revokeAllUserTokens = async (userId: number): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { 
      userId,
      isRevoked: false
    },
    data: { isRevoked: true }
  });
};

/**
 * Nettoie les tokens expirés (à exécuter périodiquement)
 */
export const cleanExpiredTokens = async (): Promise<number> => {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { isRevoked: true }
      ]
    }
  });
  
  return result.count;
};

/**
 * Parse une durée d'expiration en millisecondes
 */
function parseExpiration(expiration: string): number {
  const units: { [key: string]: number } = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000
  };
  
  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Format d\'expiration invalide');
  }
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

/**
 * Génère une paire de tokens (access + refresh)
 */
export const generateTokenPair = async (payload: JWTPayload): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(payload.id);
  
  return {
    accessToken,
    refreshToken
  };
};