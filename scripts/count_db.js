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

  const orgsCount = await db.collection("organizations").countDocuments();
  const branchCount = await db.collection("branches").countDocuments();
  const userCount = await db.collection("users").countDocuments();

  console.log("=== COLLECTION COUNTS ===");
  console.log(`organizations count: ${orgsCount}`);
  console.log(`branches count:      ${branchCount}`);
  console.log(`users count:         ${userCount}`);

  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
