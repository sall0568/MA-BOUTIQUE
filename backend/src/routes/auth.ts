import express from 'express';
import {
  login,
  register,
  initAdmin,
  getProfile,
  checkAdminExists,
  refreshAccessToken,
  logout,
  logoutAll
} from '../controllers/authController';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Routes publiques
router.post('/init', initAdmin);              // Initialiser le premier admin
router.post('/login', login);                 // Se connecter
router.post('/refresh', refreshAccessToken);  // Rafraîchir le token d'accès
router.get('/check-admin', checkAdminExists); // Vérifier si un admin existe

// Routes protégées
router.get('/profile', authMiddleware, getProfile);                        // Obtenir son profil
router.post('/logout', authMiddleware, logout);                            // Se déconnecter
router.post('/logout-all', authMiddleware, logoutAll);                     // Se déconnecter de tous les appareils
router.post('/register', authMiddleware, adminMiddleware, register);       // Créer un utilisateur (admin uniquement)

export default router;