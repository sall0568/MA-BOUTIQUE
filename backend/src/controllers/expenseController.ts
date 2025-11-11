import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dateDebut, dateFin, categorie } = req.query;
    const where: any = {};

    if (dateDebut && dateFin) {
      where.date = {
        gte: new Date(dateDebut as string),
        lte: new Date(dateFin as string)
      };
    }

    if (categorie) where.categorie = categorie;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) }
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Dépense non trouvée' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, montant, categorie } = req.body;

    if (!description || !montant || !categorie) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        montant: parseFloat(montant),
        categorie
      }
    });

    res.status(201).json({
      success: true,
      message: 'Dépense créée avec succès',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id: parseInt(id) }
    });

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Dépense non trouvée' });
    }

    await prisma.expense.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Dépense supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};