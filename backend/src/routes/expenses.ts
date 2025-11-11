import express from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  deleteExpense
} from '../controllers/expenseController';

const router = express.Router();

router.get('/', getAllExpenses);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;