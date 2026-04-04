import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// Dashboard summary
router.get('/summary', productController.getDashboardSummary);

// Products
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Categories
router.get('/meta/categories', productController.listCategories);
router.post('/meta/categories', productController.createCategory);
router.put('/meta/categories/:id', productController.updateCategory);
router.delete('/meta/categories/:id', productController.deleteCategory);

// Brands
router.get('/meta/brands', productController.listBrands);
router.post('/meta/brands', productController.createBrand);
router.put('/meta/brands/:id', productController.updateBrand);
router.delete('/meta/brands/:id', productController.deleteBrand);

// Units
router.get('/meta/units', productController.listUnits);
router.post('/meta/units', productController.createUnit);
router.put('/meta/units/:id', productController.updateUnit);
router.delete('/meta/units/:id', productController.deleteUnit);

export default router;
