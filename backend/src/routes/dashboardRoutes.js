const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardStats,
  getDepartmentStats
} = require('../controllers/dashboardController');

router.get('/', protect, getDashboardStats);
router.get('/department-stats', protect, getDepartmentStats);

module.exports = router;