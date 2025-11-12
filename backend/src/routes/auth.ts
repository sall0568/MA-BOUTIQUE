import express from 'express';
import {
  login,
  register,
  initAdmin,
  getProfile,
  checkAdminExists
} from '../controllers/authController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Routes publiques
router.post('/init', initAdmin);              // Initialiser le premier admin
router.post('/login', login);                 // Se connecter
router.get('/check-admin', checkAdminExists); // Vérifier si un admin existe

// Routes protégées
router.get('/profile', authMiddleware, getProfile);                        // Obtenir son profil
router.post('/register', authMiddleware, adminMiddleware, register);       // Créer un utilisateur (admin uniquement)

export default router;