const express = require('express');
const {
  getStatistics,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');

const router = express.Router();

router.get('/statistics', getStatistics);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

module.exports = router;
