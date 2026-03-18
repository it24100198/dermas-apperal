const express = require('express');
const vendorController = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');
const { isAccountant } = require('../middleware/roleCheck');
const { logAction } = require('../middleware/auditLogger');

const router = express.Router();

router.use(protect);

router.get('/stats', isAccountant, vendorController.getVendorStats);

router
	.route('/')
	.get(vendorController.getAllVendors)
	.post(
		isAccountant,
		logAction('CREATE', 'VENDOR'),
		vendorController.createVendor
	);

router
	.route('/:id')
	.get(vendorController.getVendor)
	.patch(
		isAccountant,
		logAction('UPDATE', 'VENDOR'),
		vendorController.updateVendor
	)
	.delete(
		isAccountant,
		logAction('DELETE', 'VENDOR'),
		vendorController.deleteVendor
	);

module.exports = router;
