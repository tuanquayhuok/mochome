const Order = require('../models/Order');
const {
  getNextStatus,
  isValidStatusTransition,
  STATUS_FLOW_LABELS,
  formatCancellationReason
} = require('../utils/orderStatus');

const mapOrder = (order) => {
  const id = order._id.toString();
  const user = order.user || {};

  return {
    id,
    orderCode: `#DH${id.slice(-6).toUpperCase()}`,
    customerName: user.fullName || order.receiverName || 'Khách lẻ',
    customerEmail: user.email || '',
    phone: user.phone || order.receiverPhone || '',
    totalAmount: order.totalAmount,
    paymentMethod: normalizePayment(order.paymentMethod),
    status: order.status,
    createdAt: order.createdAt
  };
};

const mapStatusHistory = (history = []) =>
  history.map((entry) => ({
    fromStatus: entry.fromStatus,
    toStatus: entry.toStatus,
    reason: entry.reason,
    changedAt: entry.changedAt
  }));

const mapOrderDetail = (order) => ({
  ...mapOrder(order),
  receiverName: order.receiverName || '',
  receiverPhone: order.receiverPhone || '',
  shippingAddress: order.shippingAddress || '',
  note: order.note || '',
  subtotal: order.subtotal ?? 0,
  discountAmount: order.discountAmount ?? 0,
  voucherCode: order.voucherCode || '',
  items: (order.items || []).map((item) => ({
    productId: item.product?._id?.toString() || String(item.product || ''),
    productName: item.product?.name || 'Sản phẩm',
    quantity: item.quantity,
    price: item.price
  })),
  statusHistory: mapStatusHistory(order.statusHistory),
  nextStatus: getNextStatus(order.status),
  cancellationReason: order.cancellationReason || '',
  cancellationReasonOther: order.cancellationReasonOther || '',
  cancellationReasonLabel: formatCancellationReason(
    order.cancellationReason,
    order.cancellationReasonOther
  ),
  cancelledAt: order.cancelledAt || null,
  cancelledBy: order.cancelledBy || ''
});

const normalizePayment = (method) => {
  const value = String(method || 'cod').toUpperCase();
  if (value === 'COD') return 'COD';
  if (value === 'VNPAY' || value === 'BANKING') return 'VNPay';
  if (value === 'MOMO') return 'Momo';
  return 'COD';
};

const getStatistics = async (req, res) => {
  const [
    totalOrders,
    pendingOrders,
    processingOrders,
    shippingOrders,
    completedOrders,
    cancelledOrders,
    returnedOrders
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'processing' }),
    Order.countDocuments({ status: 'shipping' }),
    Order.countDocuments({ status: 'completed' }),
    Order.countDocuments({ status: 'cancelled' }),
    Order.countDocuments({ status: 'returned' })
  ]);

  return res.json({
    totalOrders,
    pendingOrders,
    processingOrders,
    shippingOrders,
    completedOrders,
    cancelledOrders,
    returnedOrders
  });
};

const listOrders = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.paymentMethod) {
    filter.paymentMethod = new RegExp(`^${req.query.paymentMethod}$`, 'i');
  }

  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      filter.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  let query = Order.find(filter).populate('user', 'fullName email phone').sort('-createdAt');

  if (req.query.search) {
    const orders = await query;
    const keyword = String(req.query.search).trim().toLowerCase();
    const codePart = keyword.replace(/^#?dh/i, '');
    const filtered = orders.filter((order) => {
      const mapped = mapOrder(order);
      const hay = `${mapped.orderCode} ${mapped.customerName} ${mapped.customerEmail} ${mapped.phone}`.toLowerCase();
      if (hay.includes(keyword)) return true;
      if (codePart && order._id.toString().slice(-6).toUpperCase().includes(codePart.toUpperCase())) {
        return true;
      }
      return false;
    });
    const total = filtered.length;
    const slice = filtered.slice(skip, skip + limit);
    return res.json({
      data: slice.map(mapOrder),
      total,
      page,
      limit
    });
  }

  if (req.query.orderCode) {
    const code = String(req.query.orderCode).replace(/^DH/i, '').toUpperCase();
    const orders = await query;
    const filtered = orders.filter((order) => order._id.toString().slice(-6).toUpperCase().includes(code));
    const total = filtered.length;
    const slice = filtered.slice(skip, skip + limit);
    return res.json({
      data: slice.map(mapOrder),
      total,
      page,
      limit
    });
  }

  if (req.query.customerName) {
    const orders = await query;
    const keyword = String(req.query.customerName).toLowerCase();
    const filtered = orders.filter((order) =>
      (order.user?.fullName || '').toLowerCase().includes(keyword)
    );
    const total = filtered.length;
    const slice = filtered.slice(skip, skip + limit);
    return res.json({
      data: slice.map(mapOrder),
      total,
      page,
      limit
    });
  }

  if (req.query.phone) {
    const orders = await query;
    const keyword = String(req.query.phone);
    const filtered = orders.filter((order) => (order.user?.phone || '').includes(keyword));
    const total = filtered.length;
    const slice = filtered.slice(skip, skip + limit);
    return res.json({
      data: slice.map(mapOrder),
      total,
      page,
      limit
    });
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'fullName email phone').sort('-createdAt').skip(skip).limit(limit),
    Order.countDocuments(filter)
  ]);

  return res.json({
    data: orders.map(mapOrder),
    total,
    page,
    limit
  });
};

const getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'fullName email phone')
    .populate('items.product', 'name');
  if (!order) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.json(mapOrderDetail(order));
};

const updateOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Not found' });
  }

  const { status, reason } = req.body;

  if (status !== undefined) {
    const nextStatus = String(status).trim();
    const currentStatus = order.status;

    if (nextStatus !== currentStatus) {
      const trimmedReason = String(reason || '').trim() || 'Cập nhật trạng thái';

      if (!isValidStatusTransition(currentStatus, nextStatus)) {
        const allowed = getNextStatus(currentStatus);
        const allowedLabel = allowed ? STATUS_FLOW_LABELS[allowed] : 'không có';
        return res.status(400).json({
          message: `Không thể chuyển từ "${STATUS_FLOW_LABELS[currentStatus] || currentStatus}" sang "${STATUS_FLOW_LABELS[nextStatus] || nextStatus}". Bước tiếp theo hợp lệ: ${allowedLabel}.`
        });
      }

      order.statusHistory.push({
        fromStatus: currentStatus,
        toStatus: nextStatus,
        reason: trimmedReason,
        changedAt: new Date()
      });
      order.status = nextStatus;
    }
  }

  await order.save();
  await order.populate([
    { path: 'user', select: 'fullName email phone' },
    { path: 'items.product', select: 'name' }
  ]);

  return res.json(mapOrderDetail(order));
};

const deleteOrder = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.json({ message: 'Deleted successfully' });
};

module.exports = {
  getStatistics,
  listOrders,
  getOrder,
  updateOrder,
  deleteOrder
};
