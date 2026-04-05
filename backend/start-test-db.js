const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function startTestDB() {
  console.log('🔄 Starting in-memory MongoDB...');
  
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  console.log('✅ In-memory MongoDB started at:', uri);
  console.log('📝 Updating .env file...');
  
  // Write URI to a temp file that can be sourced
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '.env.test');
  
  fs.writeFileSync(envPath, `MONGODB_URI=${uri}\n`, 'utf8');
  
  console.log('✅ MongoDB URI saved to .env.test');
  console.log('\n🚀 You can now start the backend with:');
  console.log('   export $(cat .env.test) && node src/app.js');
  console.log('\nOr run seed script with:');
  console.log('   export $(cat .env.test) && node src/utils/seed.js\n');
  
  // Keep process alive
  console.log('⏳ MongoDB will stay running. Press Ctrl+C to stop.\n');
}

startTestDB().catch(console.error);
