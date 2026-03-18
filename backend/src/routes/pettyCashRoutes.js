const express = require('express');
const pettyCashController = require('../controllers/pettyCashController');
const { protect } = require('../middleware/auth');
const { isAccountant, isAdmin } = require('../middleware/roleCheck');
const upload = require('../config/multer');
const { logAction } = require('../middleware/auditLogger');

const router = express.Router();

router.use(protect);

router.get('/summary', isAccountant, pettyCashController.getSummary);

router
	.route('/')
	.get(isAccountant, pettyCashController.getAllTransactions)
	.post(
		isAccountant,
		upload.single('receipt'),
		logAction('CREATE', 'PETTY_CASH'),
		pettyCashController.createTransaction
	);

router
	.route('/:id')
	.get(isAccountant, pettyCashController.getTransaction)
	.delete(
		isAdmin,
		logAction('DELETE', 'PETTY_CASH'),
		pettyCashController.deleteTransaction
	);

module.exports = router;
