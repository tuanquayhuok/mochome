const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort('createdAt');
    const data = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id });
        return {
          ...cat.toObject(),
          productCount
        };
      })
    );
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Category.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Not found' });
    }
    const productCount = await Product.countDocuments({ category: item._id });
    return res.json({
      ...item.toObject(),
      productCount
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const created = await Category.create(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json({ message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
