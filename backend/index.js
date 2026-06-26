const app = require('./src/app');
const connectDb = require('./src/config/db');

// Connect to MongoDB
connectDb().catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
