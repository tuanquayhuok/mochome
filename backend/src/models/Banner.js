const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    imageUrl: { type: String, required: true },
    link: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    position: { type: String, trim: true, default: 'home_hero' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
