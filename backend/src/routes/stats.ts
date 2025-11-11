import Express from "express";
import { getDashboardStats, getSalesStats } from "../controllers/statsController";

const router = Express.Router();    

router.get('/dashboard', getDashboardStats);  // Route principale pour le dashboard
router.get('/sales', getSalesStats);           // Route pour les stats de ventes

export default router;