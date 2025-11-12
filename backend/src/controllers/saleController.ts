import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer toutes les ventes
export const getAllSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dateDebut, dateFin, clientId, productId, typeVente } = req.query;

    const where: any = {};

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

// ✅ POST - Créer une nouvelle vente (CORRIGÉ avec création automatique du crédit)
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
        error: `Stock insuffisant. Stock disponible: ${product.stock}`
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

    // ✅ Utiliser une transaction Prisma pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer la vente
      const sale = await tx.sale.create({
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

      // 2. Mettre à jour le stock
      await tx.product.update({
        where: { id: parseInt(productId) },
        data: {
          stock: product.stock - parseInt(quantite)
        }
      });

      // 3. Si vente à crédit, créer le crédit et mettre à jour le client
      if (typeVente === 'credit' && clientId) {
        const echeance = new Date();
        echeance.setDate(echeance.getDate() + 30); // 30 jours par défaut

        // Créer le crédit
        await tx.credit.create({
          data: {
            clientId: parseInt(clientId),
            montant: total,
            montantRestant: total,
            echeance,
            statut: 'En cours'
          }
        });

        // Mettre à jour le client
        await tx.client.update({
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
        // Vente au comptant mais avec un client identifié
        await tx.client.update({
          where: { id: parseInt(clientId) },
          data: {
            achatsTotal: {
              increment: total
            }
          }
        });
      }

      return sale;
    });

    res.status(201).json({
      success: true,
      message: 'Vente créée avec succès',
      data: result
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
      include: { product: true, client: true }
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Vente non trouvée'
      });
    }

    // Utiliser une transaction pour l'annulation
    await prisma.$transaction(async (tx) => {
      // Restaurer le stock
      await tx.product.update({
        where: { id: sale.productId },
        data: {
          stock: sale.product.stock + sale.quantite
        }
      });

      // Si c'était une vente à crédit, gérer le crédit
      if (sale.typeVente === 'credit' && sale.clientId) {
        // Trouver le crédit correspondant
        const credit = await tx.credit.findFirst({
          where: {
            clientId: sale.clientId,
            montant: sale.total,
            statut: 'En cours'
          },
          orderBy: { createdAt: 'desc' }
        });

        if (credit) {
          await tx.credit.delete({
            where: { id: credit.id }
          });
        }

        // Mettre à jour le client
        await tx.client.update({
          where: { id: sale.clientId },
          data: {
            credit: {
              decrement: sale.total
            },
            achatsTotal: {
              decrement: sale.total
            }
          }
        });
      } else if (sale.clientId) {
        // Restaurer les achats totaux
        await tx.client.update({
          where: { id: sale.clientId },
          data: {
            achatsTotal: {
              decrement: sale.total
            }
          }
        });
      }

      // Supprimer la vente
      await tx.sale.delete({
        where: { id: parseInt(id) }
      });
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