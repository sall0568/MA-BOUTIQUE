// backend/src/server.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from './config/https.config';
import { cleanExpiredTokens } from './utils/jwt';

// Import des routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import saleRoutes from './routes/sales';
import clientRoutes from './routes/clients';
import creditRoutes from './routes/credits';
import expenseRoutes from './routes/expenses';
import statsRoutes from './routes/stats';

// Import des middlewares
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';

// Charger les variables d'environnement
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ========== CONFIGURATION DE SÉCURITÉ ==========

// CORS sécurisé
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (comme les apps mobiles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Sécurité headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger des requêtes en développement
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ========== ROUTES ==========

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);
app.use('/api/clients', authMiddleware, clientRoutes);
app.use('/api/credits', authMiddleware, creditRoutes);
app.use('/api/expenses', authMiddleware, expenseRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);

// Route de santé
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Ma Boutique Pro API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Route par défaut
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🛍️ Ma Boutique Pro API',
    version: '1.0.0',
    docs: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      sales: '/api/sales',
      clients: '/api/clients',
      credits: '/api/credits',
      expenses: '/api/expenses',
      stats: '/api/stats'
    }
  });
});

// Gestionnaire d'erreur 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false,
    error: 'Route non trouvée',
    path: req.path
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// ========== TÂCHES PROGRAMMÉES ==========

// Nettoyer les tokens expirés toutes les heures
setInterval(async () => {
  try {
    const deleted = await cleanExpiredTokens();
    if (deleted > 0) {
      console.log(`🧹 ${deleted} refresh tokens expirés nettoyés`);
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des tokens:', error);
  }
}, 60 * 60 * 1000); // 1 heure

// ========== DÉMARRAGE DU SERVEUR ==========

const server = createServer(app);

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Ma Boutique Pro API');
  console.log('='.repeat(50));
  console.log(`📍 URL: ${process.env.HTTPS_ENABLED === 'true' ? 'https' : 'http'}://localhost:${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 HTTPS: ${process.env.HTTPS_ENABLED === 'true' ? 'Activé' : 'Désactivé'}`);
  console.log(`📅 Démarré le: ${new Date().toLocaleString('fr-FR')}`);
  console.log('='.repeat(50) + '\n');

  // Afficher les instructions SSL en développement
  if (process.env.NODE_ENV !== 'production' && process.env.HTTPS_ENABLED !== 'true') {
    const { printSslInstructions } = require('./config/https.config');
    printSslInstructions();
  }
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('\n🛑 Signal SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Signal SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

export default app;