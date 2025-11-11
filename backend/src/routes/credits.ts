import express from 'express';
import {
  getAllCredits,
  getCreditById,
  payCredit
} from '../controllers/creditController';

const router = express.Router();

router.get('/', getAllCredits);
router.get('/:id', getCreditById);
router.patch('/:id/pay', payCredit);

export default router;