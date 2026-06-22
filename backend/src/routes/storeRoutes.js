const express = require('express');
const { storeMe } = require('../controllers/authController');
const {
  getStoreProfile,
  getStoreLoyalty,
  updateStoreProfile,
  updateStoreAvatar,
  changeStorePassword,
  forgotStorePassword,
  claimMilestone
} = require('../controllers/storeProfileController');
const { createStoreOrder, listMyStoreOrders, getMyStoreOrder, updateMyStoreOrderShipping, cancelMyStoreOrder, getCancellationReasons } = require('../controllers/storeOrderController');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

/** API khách hàng cửa hàng — mount tại /api/auth/store và /api/store */
const router = express.Router();

router.get('/me', protect, storeMe);
router.get('/profile', protect, asyncHandler(getStoreProfile));
router.get('/loyalty', protect, asyncHandler(getStoreLoyalty));
router.put('/profile', protect, asyncHandler(updateStoreProfile));
router.put('/profile/avatar', protect, asyncHandler(updateStoreAvatar));
router.put('/password', protect, asyncHandler(changeStorePassword));
router.post('/forgot-password', asyncHandler(forgotStorePassword));
router.post('/loyalty/claim/:id', protect, asyncHandler(claimMilestone));
router.get('/orders', protect, asyncHandler(listMyStoreOrders));
router.get('/orders/cancellation-reasons', protect, asyncHandler(getCancellationReasons));
router.get('/orders/:id', protect, asyncHandler(getMyStoreOrder));
router.patch('/orders/:id/shipping', protect, asyncHandler(updateMyStoreOrderShipping));
router.post('/orders/:id/cancel', protect, asyncHandler(cancelMyStoreOrder));
router.post('/orders', protect, asyncHandler(createStoreOrder));

module.exports = router;
