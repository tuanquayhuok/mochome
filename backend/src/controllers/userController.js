const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');

const mapUserOrder = (order) => {
  const id = order._id.toString();
  const user = order.user || {};
  return {
    id,
    orderCode: `#DH${id.slice(-6).toUpperCase()}`,
    customerName: user.fullName || 'Khách lẻ',
    customerEmail: user.email || '',
    phone: user.phone || '',
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    status: order.status,
    shippingAddress: order.shippingAddress || '',
    createdAt: order.createdAt
  };
};

const listUsers = async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt').lean();
  const counts = await Order.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  return res.json(
    users.map((u) => ({
      ...u,
      orderCount: countMap[String(u._id)] || 0
    }))
  );
};

const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  }
  return res.json(user);
};

const createUser = async (req, res) => {
  const { fullName, email, password, phone, role, isActive, isVip } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Họ tên, email và mật khẩu là bắt buộc' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email đã được sử dụng' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone: phone || '',
    role: role === 'admin' ? 'admin' : 'user',
    isActive: isActive !== false && isActive !== 'false',
    emailVerifiedAt: new Date(),
    activationTokenHash: '',
    activationTokenExpiresAt: null
  });

  const safe = await User.findById(user._id).select('-password');
  return res.status(201).json(safe);
};

const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  }

  const { fullName, email, password, phone, role, isActive, isVip } = req.body;

  if (fullName) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (role === 'admin' || role === 'user') user.role = role;
  if (isActive !== undefined && isActive !== null) {
    user.isActive = isActive === true || String(isActive) === 'true';
  }
  if (typeof isVip === 'boolean') user.isVip = isVip;

  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }
    user.email = email.toLowerCase();
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });
    }
    user.password = await bcrypt.hash(password, 10);
  }

  await user.save();
  const safe = await User.findById(user._id).select('-password');
  return res.json(safe);
};

const deleteUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: 'Không thể xóa tài khoản đang đăng nhập' });
  }

  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  }

  return res.json({ message: 'Đã xóa người dùng' });
};

const getUserOrders = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  }

  const orders = await Order.find({ user: user._id }).sort('-createdAt').limit(100);
  return res.json({
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || ''
    },
    data: orders.map(mapUserOrder),
    total: orders.length
  });
};

module.exports = {
  listUsers,
  getUser,
  getUserOrders,
  createUser,
  updateUser,
  deleteUser
};
