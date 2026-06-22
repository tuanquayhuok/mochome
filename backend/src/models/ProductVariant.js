const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    attributes: {
      color: { type: String, default: '' },
      size: { type: String, default: '' }
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductVariant', productVariantSchema);
