const express = require('express');
const { getCatalog, getProductBySlug, getPostBySlug, likePost, getPostComments, createPostComment, likePostComment } = require('../controllers/publicController');
const { storeChat } = require('../controllers/chatController');
const { storeLogin, storeRegister, activateStoreAccount, mailDebug, googleLogin } = require('../controllers/authController');
const { validateVoucherPublic, listPickerVouchers } = require('../controllers/voucherController');
const { sepayWebhook } = require('../controllers/sepayController');
const { protect } = require('../middleware/auth');
const Banner = require('../models/Banner');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/sepay/webhook', asyncHandler(sepayWebhook));

router.get('/catalog', getCatalog);
router.get('/products/:slug', getProductBySlug);
router.post('/chat', asyncHandler(storeChat));
router.post('/store/login', asyncHandler(storeLogin));
router.post('/store/register', asyncHandler(storeRegister));
router.post('/store/google-login', asyncHandler(googleLogin));
router.get('/store/activate', asyncHandler(activateStoreAccount));
router.post('/mail/debug', asyncHandler(mailDebug));
router.get('/vouchers/picker', asyncHandler(listPickerVouchers));
router.post('/vouchers/validate', asyncHandler(validateVoucherPublic));

// Posts & Comments routes
router.get('/posts/:slug', asyncHandler(getPostBySlug));
router.post('/posts/:id/like', protect, asyncHandler(likePost));
router.get('/posts/:id/comments', asyncHandler(getPostComments));
router.post('/posts/:id/comments', protect, asyncHandler(createPostComment));
router.post('/comments/:id/like', protect, asyncHandler(likePostComment));

router.get('/banners', asyncHandler(async (req, res) => {
  const banners = await Banner.find({ active: true }).sort('order');
  return res.json(banners);
}));

module.exports = router;
