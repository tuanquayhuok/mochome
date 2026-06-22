const express = require('express');
const { getSummary, getRevenueChart } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/summary', getSummary);
router.get('/revenue-chart', getRevenueChart);

module.exports = router;
