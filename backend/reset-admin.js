require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDb = require('./src/config/db');
const User = require('./src/models/User');

const run = async () => {
  await connectDb();
  const hashed = await bcrypt.hash('Admin@123', 10);

  await User.updateOne(
    { email: 'admin@furniture.com' },
    {
      $set: {
        fullName: 'System Admin',
        password: hashed,
        role: 'admin',
        isActive: true
      }
    },
    { upsert: true }
  );

  console.log('ADMIN_RESET_DONE');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
