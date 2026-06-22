const Order = require('../models/Order');

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

const computeDiscount = (voucher, subtotal) => {
  const amount = Number(subtotal) || 0;
  let discount = 0;

  if (voucher.discountType === 'percent') {
    discount = Math.round((amount * voucher.discountValue) / 100);
    if (voucher.maxDiscountAmount > 0) {
      discount = Math.min(discount, voucher.maxDiscountAmount);
    }
  } else {
    discount = Math.round(voucher.discountValue);
  }

  return Math.min(discount, amount);
};

const validateVoucherForOrder = async (voucher, { subtotal, userId }) => {
  if (!voucher) {
    return { ok: false, message: 'Mã giảm giá không tồn tại.' };
  }

  if (!voucher.isActive) {
    return { ok: false, message: 'Mã giảm giá đã ngừng hoạt động.' };
  }

  const now = new Date();
  if (voucher.startDate && now < new Date(voucher.startDate)) {
    return { ok: false, message: 'Mã giảm giá chưa có hiệu lực.' };
  }
  if (voucher.endDate && now > new Date(voucher.endDate)) {
    return { ok: false, message: 'Mã giảm giá đã hết hạn.' };
  }

  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
    return { ok: false, message: 'Mã giảm giá đã hết lượt sử dụng.' };
  }

  const orderTotal = Number(subtotal) || 0;
  if (orderTotal < voucher.minOrderAmount) {
    return {
      ok: false,
      message: `Đơn hàng tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để áp dụng mã.`
    };
  }

  if (voucher.firstOrderOnly) {
    if (!userId) {
      return {
        ok: false,
        message: 'Vui lòng đăng nhập để dùng mã dành cho khách mua lần đầu.'
      };
    }

    const priorOrders = await Order.countDocuments({
      user: userId,
      status: { $nin: ['cancelled'] }
    });

    if (priorOrders > 0) {
      return {
        ok: false,
        message: 'Mã chỉ áp dụng cho khách hàng mua hàng lần đầu tiên.'
      };
    }
  }

  const discountAmount = computeDiscount(voucher, orderTotal);

  if (discountAmount <= 0) {
    return { ok: false, message: 'Mã giảm giá không áp dụng được cho đơn này.' };
  }

  return {
    ok: true,
    discountAmount,
    finalAmount: orderTotal - discountAmount,
    voucher: {
      id: voucher._id,
      code: voucher.code,
      name: voucher.name,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      firstOrderOnly: voucher.firstOrderOnly
    }
  };
};

module.exports = {
  normalizeCode,
  computeDiscount,
  validateVoucherForOrder
};
