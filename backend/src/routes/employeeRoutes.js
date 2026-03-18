const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { isHR } = require('../middleware/roleCheck');
const { logAction } = require('../middleware/auditLogger');

const router = express.Router();

router.use(protect);

router.get('/stats', isHR, employeeController.getEmployeeStats);

router
	.route('/')
	.get(isHR, employeeController.getAllEmployees)
	.post(
		isHR,
		logAction('CREATE', 'EMPLOYEE'),
		employeeController.createEmployee
	);

router.patch(
	'/:id/status',
	isHR,
	logAction('UPDATE', 'EMPLOYEE'),
	employeeController.updateEmployeeStatus
);

router
	.route('/:id')
	.get(isHR, employeeController.getEmployee)
	.patch(
		isHR,
		logAction('UPDATE', 'EMPLOYEE'),
		employeeController.updateEmployee
	)
	.delete(
		isHR,
		logAction('DELETE', 'EMPLOYEE'),
		employeeController.deleteEmployee
	);

module.exports = router;
