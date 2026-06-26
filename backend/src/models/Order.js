const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    fromStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'],
      required: true
    },
    toStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'],
      required: true
    },
    reason: { type: String, required: true, trim: true },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    voucherCode: { type: String, default: '' },
    totalAmount: { type: Number, required: true, min: 0 },
    receiverName: { type: String, default: '' },
    receiverPhone: { type: String, default: '' },
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'],
      default: 'pending'
    },
    paymentMethod: { type: String, default: 'cod' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    shippingAddress: { type: String, default: '' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    cancellationReason: {
      type: String,
      enum: ['no_longer_want', 'out_of_money', 'wrong_address', 'found_cheaper', 'other', ''],
      default: ''
    },
    cancellationReasonOther: { type: String, default: '', trim: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['user', 'admin', ''], default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
