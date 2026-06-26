const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getLoyaltySnapshot, MILESTONES } = require('../utils/loyalty');
const { generateTempPassword, sendPasswordResetEmail } = require('../utils/mail');

const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

const mapStoreUser = (user, loyalty) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  avatarUrl: user.avatarUrl || '',
  dateOfBirth: user.dateOfBirth || '',
  gender: user.gender || '',
  address: user.address || {
    province: '',
    district: '',
    ward: '',
    street: '',
    zip: ''
  },
  loyalty
});

const ensureLoggedIn = (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }
  return true;
};

/** Chỉ khách hàng (role user) — thao tác ghi */
const ensureStoreUser = (req, res) => {
  if (!ensureLoggedIn(req, res)) return false;
  if (req.user.role === 'admin') {
    res.status(403).json({ message: 'Tài khoản quản trị không chỉnh sửa tại đây' });
    return false;
  }
  return true;
};

const getStoreProfile = async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;

  const loyalty = await getLoyaltySnapshot(req.user);
  return res.json({ user: mapStoreUser(req.user, loyalty) });
};

const getStoreLoyalty = async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;
  const loyalty = await getLoyaltySnapshot(req.user);
  return res.json({ loyalty });
};

const updateStoreProfile = async (req, res) => {
  if (!ensureStoreUser(req, res)) return;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
  }

  const { fullName, phone, dateOfBirth, gender, address } = req.body;

  if (fullName !== undefined) {
    const name = String(fullName).trim();
    if (!name) {
      return res.status(400).json({ message: 'Họ tên không được để trống' });
    }
    user.fullName = name;
  }
  if (phone !== undefined) user.phone = String(phone).trim();
  if (dateOfBirth !== undefined) user.dateOfBirth = String(dateOfBirth).trim();
  if (gender !== undefined) user.gender = String(gender).trim();

  if (address && typeof address === 'object') {
    user.address = {
      province: String(address.province || '').trim(),
      district: String(address.district || '').trim(),
      ward: String(address.ward || '').trim(),
      street: String(address.street || '').trim(),
      zip: String(address.zip || '').trim()
    };
  }

  await user.save();
  const loyalty = await getLoyaltySnapshot(user);
  return res.json({ user: mapStoreUser(user, loyalty), message: 'Đã cập nhật thông tin' });
};

const updateStoreAvatar = async (req, res) => {
  if (!ensureStoreUser(req, res)) return;

  const { avatarUrl } = req.body;
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return res.status(400).json({ message: 'Thiếu ảnh đại diện' });
  }
  if (avatarUrl.length > 600_000) {
    return res.status(400).json({ message: 'Ảnh quá lớn (tối đa ~500KB)' });
  }
  if (!avatarUrl.startsWith('data:image/')) {
    return res.status(400).json({ message: 'Định dạng ảnh không hợp lệ' });
  }

  const user = await User.findById(req.user._id);
  user.avatarUrl = avatarUrl;
  await user.save();

  const loyalty = await getLoyaltySnapshot(user);
  return res.json({ user: mapStoreUser(user, loyalty), message: 'Đã cập nhật ảnh đại diện' });
};

const changeStorePassword = async (req, res) => {
  if (!ensureStoreUser(req, res)) return;

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng nhập đủ mật khẩu' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới tối thiểu 6 ký tự' });
  }

  const user = await User.findById(req.user._id);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return res.json({ message: 'Đã đổi mật khẩu thành công' });
};

const forgotStorePassword = async (req, res) => {
  const emailRaw = String(req.body.email || '').trim().toLowerCase();
  const phoneRaw = normalizePhone(req.body.phone);

  if (!emailRaw && !phoneRaw) {
    return res.status(400).json({ message: 'Vui lòng nhập email hoặc số điện thoại đã đăng ký' });
  }

  let user = null;
  if (emailRaw && phoneRaw) {
    user = await User.findOne({
      role: 'user',
      isActive: { $ne: false },
      $or: [{ email: emailRaw }, { phone: phoneRaw }]
    });
    if (!user) {
      const candidates = await User.find({ role: 'user', isActive: { $ne: false }, phone: { $ne: '' } });
      user = candidates.find((u) => normalizePhone(u.phone) === phoneRaw) || null;
    }
  } else if (emailRaw) {
    user = await User.findOne({ role: 'user', isActive: { $ne: false }, email: emailRaw });
  } else {
    user = await User.findOne({ role: 'user', isActive: { $ne: false }, phone: phoneRaw });
    if (!user) {
      const candidates = await User.find({ role: 'user', isActive: { $ne: false }, phone: { $ne: '' } });
      user = candidates.find((u) => normalizePhone(u.phone) === phoneRaw) || null;
    }
  }

  const genericMsg =
    'Nếu thông tin khớp tài khoản, mật khẩu khôi phục đã được gửi tới email đăng ký. Kiểm tra hộp thư (cả thư rác).';

  if (!user) {
    return res.json({ message: genericMsg });
  }

  if (!user.email) {
    return res.status(400).json({ message: 'Tài khoản chưa có email — liên hệ hotline 1900 1234' });
  }

  const tempPassword = generateTempPassword();
  user.password = await bcrypt.hash(tempPassword, 10);
  await user.save();

  const mailResult = await sendPasswordResetEmail(user, tempPassword);

  if (!mailResult.sent) {
    return res.status(500).json({
      message: 'Không thể gửi email khôi phục mật khẩu. Vui lòng kiểm tra cấu hình SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS) trong biến môi trường của Vercel/Local.',
      reason: mailResult.reason,
      errorDetail: mailResult.error || null
    });
  }

  return res.json({
    message: `Đã gửi mật khẩu khôi phục tới ${user.email}. Vui lòng kiểm tra hòm thư của bạn (và cả mục thư rác/spam).`
  });
};

const claimMilestone = async (req, res) => {
  if (!ensureLoggedIn(req, res)) return;
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Vui lòng đăng nhập tài khoản khách để nhận voucher' });
  }

  const milestoneId = req.params.id;
  const milestone = MILESTONES.find((m) => m.id === milestoneId);
  if (!milestone) {
    return res.status(404).json({ message: 'Mốc tích lũy không tồn tại' });
  }

  const user = await User.findById(req.user._id);
  const loyalty = await getLoyaltySnapshot(user);
  const row = loyalty.milestones.find((m) => m.id === milestoneId);

  if (!row?.reached) {
    return res.status(400).json({ message: 'Bạn chưa đạt mốc tích lũy này' });
  }
  if (row.claimed) {
    return res.status(400).json({ message: 'Bạn đã nhận voucher mốc này' });
  }

  const claimed = new Set(user.claimedMilestones || []);
  claimed.add(milestoneId);
  user.claimedMilestones = [...claimed];
  await user.save();

  const updated = await getLoyaltySnapshot(user);
  return res.json({
    message: `Đã nhận voucher ${milestone.voucherCode}`,
    voucherCode: milestone.voucherCode,
    voucherTitle: milestone.voucherTitle,
    user: mapStoreUser(user, updated)
  });
};

module.exports = {
  getStoreProfile,
  getStoreLoyalty,
  updateStoreProfile,
  updateStoreAvatar,
  changeStorePassword,
  forgotStorePassword,
  claimMilestone,
  mapStoreUser
};
