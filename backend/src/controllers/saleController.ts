import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer toutes les ventes
export const getAllSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dateDebut, dateFin, clientId, productId, typeVente } = req.query;

    const where: any = {};

    // Filtres
    if (dateDebut && dateFin) {
      where.date = {
        gte: new Date(dateDebut as string),
        lte: new Date(dateFin as string)
      };
    }

    if (clientId) {
      where.clientId = parseInt(clientId as string);
    }

    if (productId) {
      where.productId = parseInt(productId as string);
    }

    if (typeVente) {
      where.typeVente = typeVente as string;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        product: true,
        client: true
      },
      orderBy: { date: 'desc' }
    });

    res.json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

// GET - Récupérer une vente par ID
export const getSaleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true,
        client: true
      }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Vente non trouvée'
      });
    }

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

// POST - Créer une nouvelle vente
export const createSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, clientId, quantite, typeVente } = req.body;

    // Validation
    if (!productId || !quantite || !typeVente) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Vérifier le produit
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    // Vérifier le stock
    if (product.stock < parseInt(quantite)) {
      return res.status(400).json({
        success: false,
        error: 'Stock insuffisant'
      });
    }

    // Si vente à crédit, vérifier le client
    if (typeVente === 'credit' && !clientId) {
      return res.status(400).json({
        success: false,
        error: 'Un client est requis pour une vente à crédit'
      });
    }

    const total = product.prixVente * parseInt(quantite);

    // Créer la vente
    const sale = await prisma.sale.create({
      data: {
        productId: parseInt(productId),
        clientId: clientId ? parseInt(clientId) : null,
        quantite: parseInt(quantite),
        prixUnitaire: product.prixVente,
        total,
        typeVente
      },
      include: {
        product: true,
        client: true
      }
    });

    // Mettre à jour le stock
    await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        stock: product.stock - parseInt(quantite)
      }
    });

    // Si vente à crédit, créer un crédit
    if (typeVente === 'credit' && clientId) {
      const echeance = new Date();
      echeance.setDate(echeance.getDate() + 30); // 30 jours

      await prisma.credit.create({
        data: {
          clientId: parseInt(clientId),
          montant: total,
          montantRestant: total,
          echeance,
          statut: 'En cours'
        }
      });

      // Mettre à jour le crédit du client
      await prisma.client.update({
        where: { id: parseInt(clientId) },
        data: {
          credit: {
            increment: total
          },
          achatsTotal: {
            increment: total
          }
        }
      });
    } else if (clientId) {
      // Mettre à jour les achats du client
      await prisma.client.update({
        where: { id: parseInt(clientId) },
        data: {
          achatsTotal: {
            increment: total
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vente créée avec succès',
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

// DELETE - Annuler une vente
export const deleteSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: { product: true }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Vente non trouvée'
      });
    }

    // Restaurer le stock
    await prisma.product.update({
      where: { id: sale.productId },
      data: {
        stock: sale.product.stock + sale.quantite
      }
    });

    // Supprimer la vente
    await prisma.sale.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Vente annulée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// GET - Statistiques des ventes
export const getSalesStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ventes du jour
    const ventesAujourdhui = await prisma.sale.aggregate({
      where: {
        date: { gte: today }
      },
      _sum: { total: true },
      _count: true
    });

    // Ventes de la semaine
    const ventesSemaine = await prisma.sale.aggregate({
      where: {
        date: { gte: weekAgo }
      },
      _sum: { total: true },
      _count: true
    });

    // Ventes du mois
    const ventesMois = await prisma.sale.aggregate({
      where: {
        date: { gte: monthStart }
      },
      _sum: { total: true },
      _count: true
    });

    res.json({
      success: true,
      data: {
        aujourdhui: {
          total: ventesAujourdhui._sum.total || 0,
          nombre: ventesAujourdhui._count
        },
        semaine: {
          total: ventesSemaine._sum.total || 0,
          nombre: ventesSemaine._count
        },
        mois: {
          total: ventesMois._sum.total || 0,
          nombre: ventesMois._count
        }
      }
    });
  } catch (error) {
    next(error);
  }
};