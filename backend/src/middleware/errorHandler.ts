import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Erreur:', err);

  // Erreur Prisma - Violation de contrainte unique
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Cette valeur existe déjà dans la base de données',
        field: err.meta?.target
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Enregistrement non trouvé'
      });
    }
  }

  // Erreur Prisma - Validation
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: err.message
    });
  }

  // Erreur par défaut
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Une erreur serveur est survenue',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};