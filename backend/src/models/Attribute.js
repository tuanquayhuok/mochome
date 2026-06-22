const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    type: { type: String, enum: ['text', 'color', 'size'], default: 'text' },
    values: { type: [String], default: [] },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

attributeSchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

module.exports = mongoose.model('Attribute', attributeSchema);
