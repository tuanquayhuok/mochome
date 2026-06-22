const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const colorOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hex: { type: String, default: '#9ca3af' }
  },
  { _id: false }
);

const specSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    imageUrl: { type: String, default: '' },
    images: { type: [String], default: [] },
    description: { type: String, default: '' },
    shortDescription: { type: String, maxlength: 255, default: '' },
    longDescription: { type: String, default: '' },
    brand: { type: String, default: '' },
    warranty: { type: String, default: '' },
    compareAtPrice: { type: Number, min: 0 },
    colors: { type: [colorOptionSchema], default: [] },
    sizes: { type: [String], default: [] },
    material: { type: String, default: '' },
    origin: { type: String, default: 'Việt Nam' },
    detailSpecs: { type: [specSchema], default: [] },
    careGuide: { type: String, default: '' },
    returnPolicy: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    collection: { type: String, default: '' },
    saleStatus: {
      type: String,
      enum: ['selling', 'out_of_stock', 'stopped'],
      default: 'selling'
    },
    isVisible: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
