import  Express  from "express";
import { getSalesStats } from "../controllers/saleController";

const router = Express.Router();    
router.get('/dashboard', getSalesStats);

export default router;

