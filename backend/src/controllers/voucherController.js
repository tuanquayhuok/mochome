const Voucher = require('../models/Voucher');
const { normalizeCode, validateVoucherForOrder } = require('../utils/voucherHelpers');

const listVouchers = async (req, res) => {
  const vouchers = await Voucher.find().sort('-createdAt');
  return res.json(vouchers);
};

const getVoucher = async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) {
    return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
  }
  return res.json(voucher);
};

const createVoucher = async (req, res) => {
  const code = normalizeCode(req.body.code);
  if (!code) {
    return res.status(400).json({ message: 'Mã giảm giá là bắt buộc' });
  }

  const existing = await Voucher.findOne({ code });
  if (existing) {
    return res.status(409).json({ message: 'Mã giảm giá đã tồn tại' });
  }

  const payload = buildPayload(req.body, code);
  const err = validatePayload(payload);
  if (err) {
    return res.status(400).json({ message: err });
  }

  const voucher = await Voucher.create(payload);
  return res.status(201).json(voucher);
};

const updateVoucher = async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) {
    return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
  }

  if (req.body.code) {
    const code = normalizeCode(req.body.code);
    if (code !== voucher.code) {
      const dup = await Voucher.findOne({ code, _id: { $ne: voucher._id } });
      if (dup) {
        return res.status(409).json({ message: 'Mã giảm giá đã tồn tại' });
      }
      voucher.code = code;
    }
  }

  applyBodyToVoucher(voucher, req.body);
  const err = validatePayload(voucher.toObject());
  if (err) {
    return res.status(400).json({ message: err });
  }

  await voucher.save();
  return res.json(voucher);
};

const deleteVoucher = async (req, res) => {
  const deleted = await Voucher.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
  }
  return res.json({ message: 'Đã xóa mã giảm giá' });
};

const mapPickerVoucher = (v) => {
  let discountLabel = '';
  if (v.discountType === 'percent') {
    discountLabel = `Giảm ${v.discountValue}%`;
    if (v.maxDiscountAmount > 0) {
      discountLabel += ` (tối đa ${v.maxDiscountAmount.toLocaleString('vi-VN')}đ)`;
    }
  } else {
    discountLabel = `Giảm ${v.discountValue.toLocaleString('vi-VN')}đ`;
  }
  if (v.minOrderAmount > 0) {
    discountLabel += ` · Đơn từ ${v.minOrderAmount.toLocaleString('vi-VN')}đ`;
  }
  return {
    code: v.code,
    name: v.name,
    description: v.description || '',
    discountLabel,
    firstOrderOnly: Boolean(v.firstOrderOnly)
  };
};

const isVoucherCurrentlyAvailable = (v, now = new Date()) => {
  if (!v.isActive) return false;
  if (v.startDate && now < new Date(v.startDate)) return false;
  if (v.endDate && now > new Date(v.endDate)) return false;
  if (v.usageLimit > 0 && v.usedCount >= v.usageLimit) return false;
  return true;
};

const listPickerVouchers = async (req, res) => {
  const now = new Date();
  const vouchers = await Voucher.find({ showInStorePicker: true, isActive: true }).sort('code');
  const data = vouchers.filter((v) => isVoucherCurrentlyAvailable(v, now)).map(mapPickerVoucher);
  return res.json(data);
};

const validateVoucherPublic = async (req, res) => {
  const code = normalizeCode(req.body.code);
  const subtotal = Number(req.body.subtotal) || 0;
  const userId = req.body.userId || null;

  if (!code) {
    return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
  }

  const voucher = await Voucher.findOne({ code });
  const result = await validateVoucherForOrder(voucher, { subtotal, userId });

  if (!result.ok) {
    return res.status(400).json({ message: result.message });
  }

  return res.json(result);
};

function buildPayload(body, code) {
  return {
    code,
    name: String(body.name || '').trim(),
    description: body.description || '',
    discountType: body.discountType === 'fixed' ? 'fixed' : 'percent',
    discountValue: Number(body.discountValue) || 0,
    minOrderAmount: Number(body.minOrderAmount) || 0,
    maxDiscountAmount: Number(body.maxDiscountAmount) || 0,
    firstOrderOnly: Boolean(body.firstOrderOnly),
    usageLimit: Number(body.usageLimit) || 0,
    usedCount: Number(body.usedCount) || 0,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
    isActive: body.isActive !== false,
    showInStorePicker: Boolean(body.showInStorePicker)
  };
}

function applyBodyToVoucher(voucher, body) {
  if (body.name !== undefined) voucher.name = String(body.name).trim();
  if (body.description !== undefined) voucher.description = body.description;
  if (body.discountType !== undefined) {
    voucher.discountType = body.discountType === 'fixed' ? 'fixed' : 'percent';
  }
  if (body.discountValue !== undefined) voucher.discountValue = Number(body.discountValue) || 0;
  if (body.minOrderAmount !== undefined) voucher.minOrderAmount = Number(body.minOrderAmount) || 0;
  if (body.maxDiscountAmount !== undefined) voucher.maxDiscountAmount = Number(body.maxDiscountAmount) || 0;
  if (typeof body.firstOrderOnly === 'boolean') voucher.firstOrderOnly = body.firstOrderOnly;
  if (body.usageLimit !== undefined) voucher.usageLimit = Number(body.usageLimit) || 0;
  if (body.usedCount !== undefined) voucher.usedCount = Math.max(0, Number(body.usedCount) || 0);
  if (body.startDate !== undefined) voucher.startDate = body.startDate ? new Date(body.startDate) : undefined;
  if (body.endDate !== undefined) voucher.endDate = body.endDate ? new Date(body.endDate) : undefined;
  if (typeof body.isActive === 'boolean') voucher.isActive = body.isActive;
  if (typeof body.showInStorePicker === 'boolean') voucher.showInStorePicker = body.showInStorePicker;
}

function validatePayload(v) {
  if (!v.name) return 'Tên chương trình là bắt buộc';
  if (!v.discountValue || v.discountValue <= 0) return 'Giá trị giảm phải lớn hơn 0';
  if (v.discountType === 'percent' && v.discountValue > 100) {
    return 'Phần trăm giảm tối đa là 100%';
  }
  return null;
}

module.exports = {
  listVouchers,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucherPublic,
  listPickerVouchers
};
