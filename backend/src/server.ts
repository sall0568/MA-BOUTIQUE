import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import des routes
import productRoutes from './routes/products';
import saleRoutes from './routes/sales';
import clientRoutes from './routes/clients';
import creditRoutes from './routes/credits';
import expenseRoutes from './routes/expenses';
import statsRoutes from './routes/stats';

// Import du middleware d'erreur
import { errorHandler } from './middleware/errorHandler';

// Charger les variables d'environnement
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger des requêtes en développement
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);

// Route de santé
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Ma Boutique Pro API is running',
    timestamp: new Date().toISOString()
  });
});

// Route par défaut
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🛍️ Ma Boutique Pro API',
    version: '1.0.0',
    endpoints: {
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
    error: 'Route non trouvée',
    path: req.path
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});

export default app;