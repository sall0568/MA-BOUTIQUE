import express from 'express';
import {
  getAllSales,
  getSaleById,
  createSale,
  deleteSale,
  getSalesStats
} from '../controllers/saleController';

const router = express.Router();

router.get('/', getAllSales);
router.get('/stats', getSalesStats);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.delete('/:id', deleteSale);

export default router;