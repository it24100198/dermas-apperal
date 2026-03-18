const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/roleCheck');
const { USER_ROLES } = require('../config/constants');
const {
  getMonthlyExpenseReport,
  getYearlyExpenseReport,
  getDepartmentSpending,
  getProfitLoss,
  getExpenseAnalytics,
  exportReportCsv,
  exportReportJson
} = require('../controllers/reportController');

// All report routes require authentication and report access roles.
router.use(
  protect,
  restrictTo(USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.ACCOUNTANT)
);

router.get('/monthly-expenses', getMonthlyExpenseReport);
router.get('/yearly-expenses', getYearlyExpenseReport);
router.get('/department-spending', getDepartmentSpending);
router.get('/profit-loss', getProfitLoss);
router.get('/analytics', getExpenseAnalytics);
router.get('/export/csv', exportReportCsv);
router.get('/export/json', exportReportJson);

module.exports = router;