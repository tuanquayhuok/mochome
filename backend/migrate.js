const mongoose = require('mongoose');
const dns = require('dns');

// Set DNS servers programmatically to Google DNS to bypass local ISP DNS limits
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Define connection URIs
const LOCAL_URI = 'mongodb://127.0.0.1:27017/furniture_admin';
const ATLAS_URI = 'mongodb+srv://trongtuan206z_db_user:G4uQlszJZmVTJE2I@cluster0.gi7a4z6.mongodb.net/furniture_admin?retryWrites=true&w=majority';

async function migrate() {
  console.log('Starting migration...');

  // 1. Connect to Local DB
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('Connected to Local MongoDB.');

  // 2. Connect to Atlas DB
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('Connected to MongoDB Atlas.');

  // Get all collection names from local db
  const collections = await localConn.db.listCollections().toArray();
  
  for (const col of collections) {
    const name = col.name;
    if (name.startsWith('system.')) continue; // skip system collections

    console.log(`Migrating collection: ${name}...`);

    // Fetch all documents from local
    const localData = await localConn.collection(name).find({}).toArray();
    console.log(`Found ${localData.length} documents in ${name}.`);

    if (localData.length > 0) {
      // Clear existing data in Atlas for this collection
      await atlasConn.collection(name).deleteMany({});
      
      // Insert to Atlas
      await atlasConn.collection(name).insertMany(localData);
      console.log(`Successfully migrated ${localData.length} documents to Atlas for ${name}.`);
    } else {
      console.log(`Collection ${name} is empty. Skipped.`);
    }
  }

  // Close connections
  await localConn.close();
  await atlasConn.close();
  console.log('Migration completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
