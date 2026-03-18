const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { isAccountant, isAdmin } = require('../middleware/roleCheck');
const { logAction } = require('../middleware/auditLogger');

const router = express.Router();

router.use(protect);

router.get('/tree', categoryController.getCategoryTree);
router.post('/seed-defaults', isAdmin, categoryController.seedDefaultCategories);

router
	.route('/')
	.get(categoryController.getAllCategories)
	.post(
		isAccountant,
		logAction('CREATE', 'CATEGORY'),
		categoryController.createCategory
	);

router
	.route('/:id')
	.get(categoryController.getCategory)
	.patch(
		isAccountant,
		logAction('UPDATE', 'CATEGORY'),
		categoryController.updateCategory
	)
	.delete(
		isAccountant,
		logAction('DELETE', 'CATEGORY'),
		categoryController.deleteCategory
	);

module.exports = router;
