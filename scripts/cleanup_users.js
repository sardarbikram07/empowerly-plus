const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const envPath = path.join(__dirname, '../backend/.env');
const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
let uri = '';
let dbName = 'empowerlyplus';
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      if (k === 'MONGODB_URI') uri = v;
      if (k === 'MONGODB_DB') dbName = v;
    }
  }
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Delete all users except admin@empowerly.test
  const deleteResult = await db.collection("users").deleteMany({
    email: { $ne: "admin@empowerly.test" }
  });
  console.log(`Deleted ${deleteResult.deletedCount} non-admin test users.`);

  const remainingUsers = await db.collection("users").find({}).toArray();
  console.log(`Current users count: ${remainingUsers.length}`);
  console.log("Remaining users:");
  remainingUsers.forEach(u => {
    console.log(`  - Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });

  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
