import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllCredits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { statut, clientId } = req.query;
    const where: any = {};

    if (statut) where.statut = statut;
    if (clientId) where.clientId = parseInt(clientId as string);

    const credits = await prisma.credit.findMany({
      where,
      include: { client: true },
      orderBy: { dateCredit: 'desc' }
    });

    res.json({ success: true, count: credits.length, data: credits });
  } catch (error) {
    next(error);
  }
};

export const getCreditById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const credit = await prisma.credit.findUnique({
      where: { id: parseInt(id) },
      include: { client: true }
    });

    if (!credit) {
      return res.status(404).json({ success: false, error: 'Crédit non trouvé' });
    }

    res.json({ success: true, data: credit });
  } catch (error) {
    next(error);
  }
};

export const payCredit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { montant } = req.body;

    const credit = await prisma.credit.findUnique({
      where: { id: parseInt(id) },
      include: { client: true }
    });

    if (!credit) {
      return res.status(404).json({ success: false, error: 'Crédit non trouvé' });
    }

    if (credit.statut === 'Payé') {
      return res.status(400).json({ success: false, error: 'Ce crédit est déjà payé' });
    }

    const montantAPayer = montant || credit.montantRestant;

    if (montantAPayer > credit.montantRestant) {
      return res.status(400).json({ success: false, error: 'Montant supérieur au reste dû' });
    }

    const nouveauMontantRestant = credit.montantRestant - montantAPayer;
    const nouveauStatut = nouveauMontantRestant === 0 ? 'Payé' : 'En cours';

    const updatedCredit = await prisma.credit.update({
      where: { id: parseInt(id) },
      data: {
        montantRestant: nouveauMontantRestant,
        statut: nouveauStatut
      }
    });

    await prisma.client.update({
      where: { id: credit.clientId },
      data: { credit: { decrement: montantAPayer } }
    });

    res.json({
      success: true,
      message: nouveauStatut === 'Payé' ? 'Crédit entièrement payé' : 'Paiement partiel enregistré',
      data: updatedCredit
    });
  } catch (error) {
    next(error);
  }
};