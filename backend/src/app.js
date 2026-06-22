const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { protect, adminOnly } = require('./middleware/auth');
const { storeLogin, storeRegister } = require('./controllers/authController');
const asyncHandler = require('./utils/asyncHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    message: 'API is running',
    storeApi: true,
    storeLoyalty: '/api/auth/store/loyalty'
  });
});

/** Đăng nhập/đăng ký cửa hàng — đăng ký trước middleware admin để không bị chặn 401. */
app.post('/api/auth/store/login', asyncHandler(storeLogin));
app.post('/api/auth/store/register', asyncHandler(storeRegister));
app.post('/api/store/login', asyncHandler(storeLogin));
app.post('/api/store/register', asyncHandler(storeRegister));

const storeRoutes = require('./routes/storeRoutes');
app.use('/api/auth/store', storeRoutes);
app.use('/api/store', storeRoutes);

app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', protect, adminOnly, routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Server error'
  });
});

module.exports = app;
