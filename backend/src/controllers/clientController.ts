import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer tous les clients
export const getAllClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sales: true, credits: true }
        }
      }
    });

    res.json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

// GET - Récupérer un client par ID
export const getClientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: {
        sales: {
          orderBy: { date: 'desc' },
          take: 10
        },
        credits: {
          where: { statut: 'En cours' }
        }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// POST - Créer un nouveau client
export const createClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nom, telephone } = req.body;

    // Validation
    if (!nom || !telephone) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et le téléphone sont requis'
      });
    }

    // Vérifier si le téléphone existe déjà
    const existingClient = await prisma.client.findUnique({
      where: { telephone }
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        error: 'Un client avec ce numéro de téléphone existe déjà'
      });
    }

    const client = await prisma.client.create({
      data: {
        nom,
        telephone
      }
    });

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: client
    });
  } catch (error) {
    next(error);
  }
};

// PUT - Mettre à jour un client
export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nom, telephone } = req.body;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé'
      });
    }

    // Si le téléphone change, vérifier qu'il n'existe pas déjà
    if (telephone && telephone !== client.telephone) {
      const existingClient = await prisma.client.findUnique({
        where: { telephone }
      });

      if (existingClient) {
        return res.status(409).json({
          success: false,
          error: 'Ce numéro de téléphone est déjà utilisé'
        });
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id: parseInt(id) },
      data: {
        nom,
        telephone
      }
    });

    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: updatedClient
    });
  } catch (error) {
    next(error);
  }
};

// DELETE - Supprimer un client
export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: {
        credits: { where: { statut: 'En cours' } }
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé'
      });
    }

    // Vérifier s'il a des crédits en cours
    if (client.credits.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un client avec des crédits en cours'
      });
    }

    await prisma.client.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// GET - Statistiques d'un client
export const getClientStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé'
      });
    }

    const nombreAchats = await prisma.sale.count({
      where: { clientId: parseInt(id) }
    });

    const creditsActifs = await prisma.credit.count({
      where: {
        clientId: parseInt(id),
        statut: 'En cours'
      }
    });

    res.json({
      success: true,
      data: {
        ...client,
        nombreAchats,
        creditsActifs
      }
    });
  } catch (error) {
    next(error);
  }
};