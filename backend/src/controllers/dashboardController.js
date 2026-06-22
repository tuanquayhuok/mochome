const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

const REVENUE_STATUSES = ['processing', 'shipping', 'completed'];

const getSummary = async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lowStockThreshold = 6;

  const [
    revenueTodayResult,
    revenueMonthResult,
    revenueAllResult,
    totalOrders,
    totalUsers,
    totalProducts,
    lowStockCount,
    recentOrders,
    monthlyRevenue,
    categories,
    lowStockProducts,
    bestSelling,
    slowSelling,
    topCustomers
  ] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          status: { $in: ['processing', 'shipping', 'completed'] },
          createdAt: { $gte: startOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      {
        $match: {
          status: { $in: ['processing', 'shipping', 'completed'] },
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['processing', 'shipping', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Product.countDocuments({ stock: { $lte: lowStockThreshold } }),
    Order.find()
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(7),
    Order.aggregate([
      {
        $match: {
          status: { $in: ['processing', 'shipping', 'completed'] },
          createdAt: { $gte: new Date(now.getFullYear(), 0, 1), $lte: now }
        }
      },
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]),
    Category.find().sort('name'),
    Product.find({ stock: { $lte: lowStockThreshold } })
      .populate('category', 'name')
      .sort('stock')
      .limit(10),
    Order.aggregate([
      { $match: { status: { $in: ['processing', 'shipping', 'completed'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          sold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { sold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: '$product.name',
          imageUrl: '$product.imageUrl',
          price: '$product.price',
          stock: '$product.stock',
          categoryName: '$category.name',
          sold: 1,
          revenue: 1
        }
      }
    ]),
    Product.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { prodId: '$_id' },
          pipeline: [
            { $match: { status: { $in: ['processing', 'shipping', 'completed'] } } },
            { $unwind: '$items' },
            { $match: { $expr: { $eq: ['$items.product', '$$prodId'] } } },
            {
              $group: {
                _id: null,
                sold: { $sum: '$items.quantity' },
                revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
              }
            }
          ],
          as: 'sales'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryObj'
        }
      },
      { $unwind: { path: '$categoryObj', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          imageUrl: 1,
          price: 1,
          stock: 1,
          categoryName: '$categoryObj.name',
          sold: { $ifNull: [{ $arrayElemAt: ['$sales.sold', 0] }, 0] },
          revenue: { $ifNull: [{ $arrayElemAt: ['$sales.revenue', 0] }, 0] }
        }
      },
      { $sort: { sold: 1, name: 1 } },
      { $limit: 10 }
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['processing', 'shipping', 'completed'] } } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.fullName',
          email: '$user.email',
          phone: '$user.phone',
          isVip: '$user.isVip',
          createdAt: '$user.createdAt',
          totalSpent: 1,
          orderCount: 1
        }
      }
    ])
  ]);

  const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const chart = monthNames.map((label, index) => {
    const matched = monthlyRevenue.find((item) => item._id === index + 1);
    return { month: label, revenue: matched ? matched.revenue : 0 };
  });

  const categoryCounts = await Promise.all(
    categories.map(async (cat) => ({
      name: cat.name,
      count: await Product.countDocuments({ category: cat._id })
    }))
  );

  return res.json({
    cards: {
      revenueToday: revenueTodayResult[0]?.total || 0,
      revenueMonth: revenueMonthResult[0]?.total || 0,
      revenueAll: revenueAllResult[0]?.total || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      lowStockCount
    },
    chart,
    recentOrders,
    bestSellers: bestSelling,
    slowSellers: slowSelling,
    topCustomers,
    categories: categoryCounts,
    lowStockProducts: lowStockProducts.map((p) => ({
      _id: p._id,
      name: p.name,
      imageUrl: p.imageUrl,
      price: p.price,
      categoryName: p.category ? p.category.name : '—',
      stock: p.stock,
      level: p.stock <= 2 ? 'critical' : 'low'
    }))
  });
};

const getRevenueChart = async (req, res) => {
  const mode = String(req.query.mode || 'day').toLowerCase();
  const now = new Date();

  if (mode === 'day') {
    const days = [7, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

    const rows = await Order.aggregate([
      {
        $match: {
          status: { $in: REVENUE_STATUSES },
          createdAt: { $gte: start, $lte: now }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chart = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
      ].join('-');
      const matched = rows.find((row) => row._id === key);
      chart.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: matched?.revenue || 0
      });
    }

    return res.json({ mode: 'day', days, chart });
  }

  if (mode === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const rows = await Order.aggregate([
      {
        $match: {
          status: { $in: REVENUE_STATUSES },
          createdAt: { $gte: start, $lte: now }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const chart = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const matched = rows.find((row) => row._id.year === y && row._id.month === m);
      chart.push({
        label: `T${m}/${String(y).slice(-2)}`,
        revenue: matched?.revenue || 0
      });
    }

    return res.json({ mode: 'month', chart });
  }

  if (mode === 'year') {
    const year = Number(req.query.year) || now.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const rows = await Order.aggregate([
      {
        $match: {
          status: { $in: REVENUE_STATUSES },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const chart = monthNames.map((label, index) => {
      const matched = rows.find((row) => row._id === index + 1);
      return { label, revenue: matched?.revenue || 0 };
    });

    return res.json({ mode: 'year', year, chart });
  }

  return res.status(400).json({ message: 'mode không hợp lệ (day | month | year)' });
};

module.exports = {
  getSummary,
  getRevenueChart
};
