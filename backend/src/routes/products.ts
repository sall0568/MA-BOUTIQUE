// routes/products.ts
import express from 'express';
import {
  getAllProducts,
  getProductById,
  getProductByCode,
  createProduct,
  updateProduct,
  restockProduct,
  deleteProduct,
  getLowStockProducts
} from '../controllers/productController';

const router = express.Router();

// Routes produits
router.get('/', getAllProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/code/:code', getProductByCode);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id/restock', restockProduct);
router.delete('/:id', deleteProduct);

export default router;