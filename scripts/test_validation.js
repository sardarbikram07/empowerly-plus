const path = require('path');
const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

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
  const users = db.collection("users");

  const org = await db.collection("organizations").findOne();
  const branch = await db.collection("branches").findOne();

  console.log("=== TEST 1: Insert user with role 'BOSS' ===");
  try {
    await users.insertOne({
      orgId: org._id,
      branchId: branch._id,
      name: "Invalid Boss",
      email: "boss@test.com",
      role: "BOSS"
    });
    console.log("ERROR: Insert succeeded unexpectedly!");
  } catch (err) {
    console.log("Validation Error Caught (role='BOSS'):");
    console.log("Code:", err.code, "| CodeName:", err.codeName);
    console.log("Message:", err.message);
  }

  console.log("\n=== TEST 2: Insert user with branchId as a string ===");
  try {
    await users.insertOne({
      orgId: org._id,
      branchId: "60c72b2f9b1d8b2a3c4d5e6f", // string instead of BSON ObjectId
      name: "Invalid Branch String User",
      email: "stringbranch@test.com",
      role: "EMPLOYEE"
    });
    console.log("ERROR: Insert succeeded unexpectedly!");
  } catch (err) {
    console.log("Validation Error Caught (branchId=string):");
    console.log("Code:", err.code, "| CodeName:", err.codeName);
    console.log("Message:", err.message);
  }

  await client.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
