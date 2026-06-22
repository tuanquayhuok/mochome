const mongoose = require('mongoose');

const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in .env');
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected:', uri.replace(/\/\/([^@]+@)?/, '//'));
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.name === 'MongooseServerSelectionError') {
      console.error('\nMongoDB chưa chạy. Hãy mở terminal tại thư mục d:\\admin và chạy:');
      console.error('  docker compose up -d');
      console.error('Sau đó chạy seed:');
      console.error('  cd backend');
      console.error('  npm run seed\n');
    }
    throw error;
  }
};

module.exports = connectDb;
