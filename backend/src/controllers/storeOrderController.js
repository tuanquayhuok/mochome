const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Voucher = require('../models/Voucher');
const { normalizeCode, validateVoucherForOrder } = require('../utils/voucherHelpers');
const {
  STATUS_FLOW_LABELS,
  ORDER_STATUS_PIPELINE,
  CANCELLATION_REASONS,
  isOrderEditable,
  isOrderCancellable,
  formatCancellationReason
} = require('../utils/orderStatus');

const mapStatusHistory = (history = []) =>
  history.map((entry) => ({
    fromStatus: entry.fromStatus,
    toStatus: entry.toStatus,
    reason: entry.reason,
    changedAt: entry.changedAt
  }));

const mapStoreOrder = (order) => {
  const id = order._id.toString();
  return {
    id,
    orderCode: `#DH${id.slice(-6).toUpperCase()}`,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount || 0,
    voucherCode: order.voucherCode || '',
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus || 'pending',
    status: order.status,
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    shippingAddress: order.shippingAddress,
    note: order.note || '',
    items: (order.items || []).map((line) => ({
      productId: line.product?._id || line.product,
      name: line.product?.name || '',
      slug: line.product?.slug || '',
      imageUrl: line.product?.imageUrl || '',
      quantity: line.quantity,
      price: line.price
    })),
    createdAt: order.createdAt
  };
};

const mapStoreOrderDetail = (order) => ({
  ...mapStoreOrder(order),
  statusHistory: mapStatusHistory(order.statusHistory),
  canEditShipping: isOrderEditable(order.status),
  canCancel: isOrderCancellable(order.status),
  cancellationReason: order.cancellationReason || '',
  cancellationReasonOther: order.cancellationReasonOther || '',
  cancellationReasonLabel: formatCancellationReason(
    order.cancellationReason,
    order.cancellationReasonOther
  ),
  cancelledAt: order.cancelledAt || null,
  cancelledBy: order.cancelledBy || ''
});

const findUserOrder = async (orderId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return null;
  }
  return Order.findOne({ _id: orderId, user: userId }).populate(
    'items.product',
    'name slug imageUrl'
  );
};

const createStoreOrder = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Tài khoản quản trị không đặt hàng qua cửa hàng.' });
  }

  const {
    items,
    receiverName,
    receiverPhone,
    shippingAddress,
    paymentMethod,
    voucherCode,
    note
  } = req.body;

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Giỏ hàng trống' });
  }

  if (!receiverName?.trim() || !receiverPhone?.trim() || !shippingAddress?.trim()) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin giao hàng' });
  }

  const orderLines = [];
  let subtotal = 0;

  for (const row of items) {
    if (!mongoose.Types.ObjectId.isValid(row.productId)) {
      return res.status(400).json({ message: 'Sản phẩm không hợp lệ' });
    }

    const qty = Math.max(1, Number(row.quantity) || 1);
    const product = await Product.findById(row.productId);

    if (!product) {
      return res.status(400).json({ message: `Không tìm thấy sản phẩm` });
    }

    if (product.isVisible === false) {
      return res.status(400).json({ message: `"${product.name}" hiện không bán` });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: `"${product.name}" không đủ tồn kho` });
    }

    const price = product.price;
    subtotal += price * qty;
    orderLines.push({
      product: product._id,
      quantity: qty,
      price
    });
  }

  let discountAmount = 0;
  let appliedCode = '';

  if (voucherCode) {
    const code = normalizeCode(voucherCode);
    const voucher = await Voucher.findOne({ code });
    const validation = await validateVoucherForOrder(voucher, {
      subtotal,
      userId: req.user._id
    });

    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    discountAmount = validation.discountAmount;
    appliedCode = code;
    voucher.usedCount += 1;
    await voucher.save();
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const pay = String(paymentMethod || 'cod').toLowerCase();

  const order = await Order.create({
    user: req.user._id,
    items: orderLines,
    subtotal,
    discountAmount,
    voucherCode: appliedCode,
    totalAmount,
    receiverName: receiverName.trim(),
    receiverPhone: receiverPhone.trim(),
    shippingAddress: shippingAddress.trim(),
    note: (note || '').trim(),
    paymentMethod: pay,
    status: 'pending'
  });

  for (const line of orderLines) {
    await Product.findByIdAndUpdate(line.product, { $inc: { stock: -line.quantity } });
  }

  const populated = await Order.findById(order._id).populate('items.product', 'name slug imageUrl');

  return res.status(201).json({
    message: 'Đặt hàng thành công',
    order: mapStoreOrder(populated)
  });
};

const listMyStoreOrders = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({ data: [] });
  }

  const orders = await Order.find({ user: req.user._id })
    .populate('items.product', 'name slug imageUrl')
    .sort('-createdAt')
    .limit(50);

  return res.json({
    data: orders.map(mapStoreOrder)
  });
};

const getMyStoreOrder = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }

  const order = await findUserOrder(req.params.id, req.user._id);
  if (!order) {
    return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  }

  return res.json(mapStoreOrderDetail(order));
};

const updateMyStoreOrderShipping = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }

  const order = await findUserOrder(req.params.id, req.user._id);
  if (!order) {
    return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  }

  if (!isOrderEditable(order.status)) {
    return res.status(400).json({
      message: 'Không thể sửa thông tin giao hàng khi đơn đã được giao hoặc đã hủy.'
    });
  }

  const { receiverPhone, shippingAddress } = req.body;
  const phone = String(receiverPhone || '').trim();
  const address = String(shippingAddress || '').trim();

  if (!phone || !address) {
    return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và địa chỉ giao hàng' });
  }

  order.receiverPhone = phone;
  order.shippingAddress = address;
  await order.save();

  return res.json({
    message: 'Đã cập nhật thông tin giao hàng',
    order: mapStoreOrderDetail(order)
  });
};

const cancelMyStoreOrder = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  }

  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  }

  if (!isOrderCancellable(order.status)) {
    return res.status(400).json({
      message: 'Không thể hủy đơn hàng ở trạng thái hiện tại.'
    });
  }

  const { reason, reasonOther } = req.body;
  const cancelReason = String(reason || '').trim();

  if (!cancelReason || !CANCELLATION_REASONS[cancelReason]) {
    return res.status(400).json({ message: 'Vui lòng chọn lý do hủy đơn hàng' });
  }

  const otherText = String(reasonOther || '').trim();
  if (cancelReason === 'other' && !otherText) {
    return res.status(400).json({ message: 'Vui lòng nhập lý do hủy khác' });
  }

  const reasonLabel = formatCancellationReason(cancelReason, otherText);
  const currentStatus = order.status;

  order.status = 'cancelled';
  order.cancellationReason = cancelReason;
  order.cancellationReasonOther = cancelReason === 'other' ? otherText : '';
  order.cancelledAt = new Date();
  order.cancelledBy = 'user';
  order.statusHistory.push({
    fromStatus: currentStatus,
    toStatus: 'cancelled',
    reason: `Khách hàng hủy: ${reasonLabel}`,
    changedAt: new Date()
  });

  await order.save();

  for (const line of order.items || []) {
    await Product.findByIdAndUpdate(line.product, { $inc: { stock: line.quantity } });
  }

  const populated = await Order.findById(order._id).populate('items.product', 'name slug imageUrl');

  return res.json({
    message: 'Đã hủy đơn hàng',
    order: mapStoreOrderDetail(populated)
  });
};

const getCancellationReasons = (_req, res) => {
  return res.json({ data: CANCELLATION_REASONS });
};

module.exports = {
  createStoreOrder,
  listMyStoreOrders,
  getMyStoreOrder,
  updateMyStoreOrderShipping,
  cancelMyStoreOrder,
  getCancellationReasons,
  ORDER_STATUS_PIPELINE,
  STATUS_FLOW_LABELS
};
