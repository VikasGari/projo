const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDashboardData,
  updateDashboardData,
  updateActiveTime
} = require('../controllers/dashboardController');

// All routes require authentication
router.use(protect);

// Dashboard routes
router.get('/', getDashboardData);
router.put('/', updateDashboardData);
router.put('/active-time', updateActiveTime);

module.exports = router; 