import express from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats
} from '../controllers/clientController';

const router = express.Router();

router.get('/', getAllClients);
router.get('/:id', getClientById);
router.get('/:id/stats', getClientStats);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;