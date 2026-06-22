const express = require('express');
const {
  listVouchers,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher
} = require('../controllers/voucherController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(listVouchers));
router.get('/:id', asyncHandler(getVoucher));
router.post('/', asyncHandler(createVoucher));
router.put('/:id', asyncHandler(updateVoucher));
router.delete('/:id', asyncHandler(deleteVoucher));

module.exports = router;
