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

  const collections = await db.listCollections().toArray();
  collections.sort((a, b) => a.name.localeCompare(b.name));

  console.log("=== COLLECTION VALIDATORS & INDEXES ===");
  for (const collInfo of collections) {
    const name = collInfo.name;
    const hasValidator = !!(collInfo.options && collInfo.options.validator);
    console.log(`\nCollection: ${name}`);
    console.log(`  Validator Attached: ${hasValidator ? 'YES' : 'NO'}`);
    const indexes = await db.collection(name).indexes();
    console.log("  Indexes:");
    for (const idx of indexes) {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(UNIQUE)' : ''}`);
    }
  }
  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
