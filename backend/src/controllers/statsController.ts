import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Statistiques complètes du dashboard
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ventes du jour
    const ventesAujourdhui = await prisma.sale.aggregate({
      where: { date: { gte: today } },
      _sum: { total: true },
      _count: true
    });

    // Ventes de la semaine
    const ventesSemaine = await prisma.sale.aggregate({
      where: { date: { gte: weekAgo } },
      _sum: { total: true },
      _count: true
    });

    // Ventes du mois
    const ventesMois = await prisma.sale.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { total: true },
      _count: true
    });

    // Dépenses du mois
    const depensesMois = await prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { montant: true }
    });

    // Total produits
    const totalProduits = await prisma.product.count();

    // Valeur du stock
    const products = await prisma.product.findMany();
    const valeurStock = products.reduce((sum, p) => sum + (p.prixAchat * p.stock), 0);

    // Produits en rupture de stock
    const produitsEnRupture = await prisma.product.count({
      where: {
        stock: { lte: prisma.product.fields.stockMin }
      }
    });

    // Total clients
    const totalClients = await prisma.client.count();

    // Crédits en cours
    const creditsEnCours = await prisma.credit.aggregate({
      where: { statut: 'En cours' },
      _sum: { montantRestant: true }
    });

    // Calcul du bénéfice (ventes - coût des produits vendus - dépenses)
    const ventes = await prisma.sale.findMany({
      where: { date: { gte: monthStart } },
      include: { product: true }
    });

    const beneficeTotal = ventes.reduce((sum, vente) => {
      return sum + (vente.prixUnitaire - vente.product.prixAchat) * vente.quantite;
    }, 0);

    const beneficeNet = beneficeTotal - (depensesMois._sum.montant || 0);

    res.json({
      success: true,
      data: {
        // Ventes
        ventesAujourdhui: ventesAujourdhui._sum.total || 0,
        ventesSemaine: ventesSemaine._sum.total || 0,
        ventesMois: ventesMois._sum.total || 0,
        
        // Bénéfices
        beneficeTotal,
        beneficeNet,
        
        // Stock
        totalProduits,
        valeurStock,
        produitsEnRupture,
        
        // Clients
        totalClients,
        creditEnCours: creditsEnCours._sum.montantRestant || 0,
        
        // Dépenses
        depensesMois: depensesMois._sum.montant || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET - Statistiques de ventes détaillées
export const getSalesStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const ventesAujourdhui = await prisma.sale.aggregate({
      where: { date: { gte: today } },
      _sum: { total: true },
      _count: true
    });

    const ventesSemaine = await prisma.sale.aggregate({
      where: { date: { gte: weekAgo } },
      _sum: { total: true },
      _count: true
    });

    const ventesMois = await prisma.sale.aggregate({
      where: { date: { gte: monthStart } },
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