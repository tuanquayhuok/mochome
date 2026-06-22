const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Contact = require('../models/Contact');
const CatalogCollection = require('../models/CatalogCollection');
const Attribute = require('../models/Attribute');
const ProductVariant = require('../models/ProductVariant');
const Banner = require('../models/Banner');
const dashboardRoutes = require('./dashboardRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const postRoutes = require('./postRoutes');
const voucherRoutes = require('./voucherRoutes');
const categoryRoutes = require('./categoryRoutes');
const createCrudRouter = require('./crudFactory');

const router = express.Router();

router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/products', createCrudRouter(Product, { populate: 'category' }));
router.use('/categories', categoryRoutes);
router.use('/collections', createCrudRouter(CatalogCollection));
router.use('/attributes', createCrudRouter(Attribute));
router.use('/variants', createCrudRouter(ProductVariant, { populate: 'product' }));
router.use('/orders', orderRoutes);
router.use('/reviews', createCrudRouter(Review, { populate: 'user product' }));
router.use('/contacts', createCrudRouter(Contact));
router.use('/posts', postRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/banners', createCrudRouter(Banner));

module.exports = router;
