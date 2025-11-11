import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer tous les produits
export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// GET - Récupérer un produit par ID
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// GET - Rechercher un produit par code-barre
export const getProductByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const product = await prisma.product.findUnique({
      where: { code }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// POST - Créer un nouveau produit
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nom, code, categorie, fournisseur, prixAchat, prixVente, stock, stockMin } = req.body;

    // Validation
    if (!nom || !code || !prixAchat || !prixVente || stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    if (prixVente <= prixAchat) {
      return res.status(400).json({
        success: false,
        error: 'Le prix de vente doit être supérieur au prix d\'achat'
      });
    }

    // Vérifier si le code existe déjà
    const existingProduct = await prisma.product.findUnique({
      where: { code }
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        error: 'Un produit avec ce code existe déjà'
      });
    }

    const product = await prisma.product.create({
      data: {
        nom,
        code,
        categorie,
        fournisseur,
        prixAchat: parseFloat(prixAchat),
        prixVente: parseFloat(prixVente),
        stock: parseInt(stock),
        stockMin: stockMin ? parseInt(stockMin) : 5
      }
    });

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// PUT - Mettre à jour un produit
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nom, code, categorie, fournisseur, prixAchat, prixVente, stock, stockMin } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    // Si le code change, vérifier qu'il n'existe pas déjà
    if (code && code !== product.code) {
      const existingProduct = await prisma.product.findUnique({
        where: { code }
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          error: 'Un produit avec ce code existe déjà'
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        nom,
        code,
        categorie,
        fournisseur,
        prixAchat: prixAchat ? parseFloat(prixAchat) : undefined,
        prixVente: prixVente ? parseFloat(prixVente) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        stockMin: stockMin !== undefined ? parseInt(stockMin) : undefined
      }
    });

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// PATCH - Réapprovisionner un produit
export const restockProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { quantite } = req.body;

    if (!quantite || quantite <= 0) {
      return res.status(400).json({
        success: false,
        error: 'La quantité doit être supérieure à 0'
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        stock: product.stock + parseInt(quantite)
      }
    });

    // Créer une dépense pour le réapprovisionnement
    await prisma.expense.create({
      data: {
        description: `Réappro: ${product.nom} (${quantite} unités)`,
        montant: product.prixAchat * parseInt(quantite),
        categorie: 'Achat stock'
      }
    });

    res.json({
      success: true,
      message: 'Réapprovisionnement effectué avec succès',
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

// DELETE - Supprimer un produit
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// GET - Produits en alerte stock
export const getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.stockMin
        }
      },
      orderBy: { stock: 'asc' }
    });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};