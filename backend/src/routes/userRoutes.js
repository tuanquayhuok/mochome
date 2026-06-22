const express = require('express');
const {
  listUsers,
  getUser,
  getUserOrders,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(listUsers));
router.get('/:id/orders', asyncHandler(getUserOrders));
router.get('/:id', asyncHandler(getUser));
router.post('/', asyncHandler(createUser));
router.put('/:id', asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

module.exports = router;
