const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true },
    logoUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

brandSchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
