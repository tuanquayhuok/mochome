const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'mochome_furniture_admin_default_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }

  if (user.isActive === false) {
    return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
  }

  const token = signToken(user._id, user.role);

  return res.json({
    token,
    user: mapUser(user)
  });
};

const mapUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || '',
  role: user.role
});

const buildActivationUrl = (req, token, email) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}/api/public/store/activate?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
};

const digestToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const redirectActivationResult = (req, res, ok, message) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/$/, '');
  return res.redirect(`${frontendUrl}/tai-khoan?activated=${ok ? '1' : '0'}&message=${encodeURIComponent(message)}`);
};

const mailDebug = async (req, res) => {
  const to = String(req.body.to || req.query.to || '').trim();
  const { getSmtpDebugInfo, sendDebugEmail } = require('../utils/mail');

  if (!to) {
    return res.status(400).json({
      message: 'Thiếu địa chỉ email để test',
      config: getSmtpDebugInfo()
    });
  }

  const result = await sendDebugEmail(to);
  return res.status(result.sent ? 200 : 500).json({
    message: result.sent
      ? 'Đã gửi mail debug thành công.'
      : 'Không gửi được mail debug.',
    ...result
  });
};

const storeLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  if (user.role === 'admin') {
    return res.status(403).json({ message: 'Tài khoản admin vui lòng đăng nhập qua trang quản trị' });
  }

  if (user.isActive === false) {
    return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
  }

  const token = signToken(user._id, user.role);
  const { getLoyaltySnapshot } = require('../utils/loyalty');
  const { mapStoreUser } = require('./storeProfileController');
  const loyalty = await getLoyaltySnapshot(user);

  return res.json({
    token,
    user: mapStoreUser(user, loyalty)
  });
};

const storeRegister = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email đã được sử dụng' });
  }

  const activationToken = crypto.randomBytes(32).toString('hex');
  const activationTokenHash = digestToken(activationToken);
  const activationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone: phone || '',
    role: 'user',
    isActive: true,
    emailVerifiedAt: new Date(),
    activationTokenHash: '',
    activationTokenExpiresAt: null
  });

  const { sendWelcomeEmail } = require('../utils/mail');
  const mailResult = await sendWelcomeEmail(user);

  const token = signToken(user._id, user.role);
  const { getLoyaltySnapshot } = require('../utils/loyalty');
  const { mapStoreUser } = require('./storeProfileController');
  const loyalty = await getLoyaltySnapshot(user);

  return res.status(201).json({
    token,
    user: mapStoreUser(user, loyalty),
    emailSent: mailResult.sent,
    emailMessage: mailResult.sent
      ? 'Đăng ký thành công! Email chào mừng đã được gửi đến hộp thư của bạn.'
      : 'Đăng ký thành công! (Không thể gửi email chào mừng).'
  });
};

const activateStoreAccount = async (req, res) => {
  const email = String(req.query.email || req.body.email || '').trim().toLowerCase();
  const token = String(req.query.token || req.body.token || '').trim();

  if (!email || !token) {
    return redirectActivationResult(req, res, false, 'Liên kết kích hoạt không hợp lệ.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return redirectActivationResult(req, res, false, 'Không tìm thấy tài khoản cần kích hoạt.');
  }

  if (user.emailVerifiedAt) {
    return redirectActivationResult(req, res, true, 'Tài khoản đã được kích hoạt trước đó.');
  }

  if (!user.activationTokenHash || !user.activationTokenExpiresAt || user.activationTokenExpiresAt < new Date()) {
    return redirectActivationResult(req, res, false, 'Liên kết kích hoạt đã hết hạn. Vui lòng đăng ký lại.');
  }

  if (digestToken(token) !== user.activationTokenHash) {
    return redirectActivationResult(req, res, false, 'Liên kết kích hoạt không hợp lệ.');
  }

  user.emailVerifiedAt = new Date();
  user.activationTokenHash = '';
  user.activationTokenExpiresAt = null;
  await user.save();

  return redirectActivationResult(req, res, true, 'Kích hoạt tài khoản thành công. Bạn có thể đăng nhập ngay.');
};

const storeMe = async (req, res) => {
  const { getLoyaltySnapshot } = require('../utils/loyalty');
  const { mapStoreUser } = require('./storeProfileController');

  const loyalty = await getLoyaltySnapshot(req.user);
  return res.json({ user: mapStoreUser(req.user, loyalty) });
};

const registerAdmin = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: 'admin'
  });

  return res.status(201).json({
    message: 'Admin created',
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
  });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing password fields' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json({ message: 'Password updated successfully' });
};

const me = async (req, res) => {
  return res.json({ user: req.user });
};

const https = require('https');

const verifyGoogleToken = (accessToken) => {
  return new Promise((resolve, reject) => {
    https.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error('Google token validation failed: ' + data));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const googleLogin = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ message: 'Thiếu Google Access Token' });
  }

  try {
    const googleProfile = await verifyGoogleToken(accessToken);
    const { email, name } = googleProfile;

    if (!email) {
      return res.status(400).json({ message: 'Không thể lấy email từ tài khoản Google này.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user if not exist
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        fullName: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
        isActive: true,
        emailVerifiedAt: new Date()
      });
    } else {
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Tài khoản admin không được phép đăng nhập storefront.' });
      }
      if (user.isActive === false) {
        return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
      }
    }

    const token = signToken(user._id, user.role);
    const { getLoyaltySnapshot } = require('../utils/loyalty');
    const { mapStoreUser } = require('./storeProfileController');
    const loyalty = await getLoyaltySnapshot(user);

    return res.json({
      token,
      user: mapStoreUser(user, loyalty)
    });
  } catch (err) {
    console.error('Lỗi đăng nhập Google:', err);
    return res.status(401).json({ message: 'Xác thực tài khoản Google không hợp lệ hoặc đã hết hạn.' });
  }
};

module.exports = {
  login,
  registerAdmin,
  changePassword,
  me,
  storeLogin,
  storeRegister,
  storeMe,
  activateStoreAccount,
  mailDebug,
  googleLogin
};

