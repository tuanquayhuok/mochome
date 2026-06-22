const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const catalogCollectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

catalogCollectionSchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

module.exports = mongoose.model('CatalogCollection', catalogCollectionSchema);
