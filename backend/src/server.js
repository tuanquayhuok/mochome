require('dotenv').config();

const connectDb = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server', error.message || error);
    process.exit(1);
  }
};

start();
