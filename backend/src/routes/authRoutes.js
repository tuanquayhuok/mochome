const express = require('express');
const { login, registerAdmin, changePassword, me } = require('../controllers/authController');
const storeRoutes = require('./storeRoutes');
const { protect, adminOnly } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/login', asyncHandler(login));
router.post('/register-admin', asyncHandler(registerAdmin));
router.use('/store', storeRoutes);
router.get('/me', protect, adminOnly, me);
router.put('/change-password', protect, adminOnly, changePassword);

module.exports = router;
