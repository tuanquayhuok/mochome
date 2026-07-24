require('dotenv').config();
const connectDb = require('./src/config/db');
const Post = require('./src/models/Post');

const run = async () => {
  await connectDb();

  const result = await Post.updateMany(
    {},
    { $set: { viewCount: 0 } }
  );

  console.log(`VIEW_RESET_DONE: Reset ${result.modifiedCount} posts to 0 views.`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
