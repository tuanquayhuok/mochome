const express = require('express');
const { getCatalog, getProductBySlug } = require('../controllers/publicController');
const { storeChat } = require('../controllers/chatController');
const { storeLogin, storeRegister, activateStoreAccount, mailDebug, googleLogin } = require('../controllers/authController');
const { validateVoucherPublic, listPickerVouchers } = require('../controllers/voucherController');
const { sepayWebhook } = require('../controllers/sepayController');
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

router.get('/banners', asyncHandler(async (req, res) => {
  const banners = await Banner.find({ active: true }).sort('order');
  return res.json(banners);
}));

module.exports = router;
