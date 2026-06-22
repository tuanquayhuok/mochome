const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: 0, min: 0 },
    firstOrderOnly: { type: Boolean, default: false },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    /** Hiển thị trong danh sách chọn mã trên giỏ hàng / thanh toán */
    showInStorePicker: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Voucher', voucherSchema);
