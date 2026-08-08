const mongoose = require('mongoose');

const partnerStoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true },
    googleMapUrl: { type: String, trim: true },
    phone: { type: String, required: true },
    email: { type: String, trim: true },
    manager: { type: String, required: true },
    tier: { type: String, enum: ['Platinum', 'Gold', 'Silver', 'Standard'], default: 'Standard' },
    supplyVolume: { type: Number, default: 0 },
    inventory: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        stock: { type: Number, default: 0 }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PartnerStore', partnerStoreSchema);
