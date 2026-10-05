/**
 * scripts/seed.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Seed script for the empowerlyplus database.
 * Inserts one organization, two branches, one ADMIN user, one HR user, and
 * two EMPLOYEE users so the app can be used immediately after setup.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Requires: MONGODB_URI and MONGODB_DB in scripts/.env (see .env.example).
 * The script loads variables from scripts/.env automatically via dotenv.
 * ──────────────────────────────────────────────────────────────────────────────
 */

"use strict";

require("dotenv").config({ path: __dirname + "/.env" });

const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB  = process.env.MONGODB_DB || "empowerlyplus";

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is not set. Copy .env.example to scripts/.env and fill in values.");
  process.exit(1);
}

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("Connected to MongoDB:", MONGODB_DB);

  const db = client.db(MONGODB_DB);

  // ── Clear existing seed data (idempotent) ──────────────────────────────────
  const collections = ["organizations", "branches", "users"];
  for (const coll of collections) {
    await db.collection(coll).deleteMany({ _seeded: true });
  }

  // ── Organization ───────────────────────────────────────────────────────────
  const orgId = new ObjectId();
  await db.collection("organizations").insertOne({
    _id:     orgId,
    name:    "Empowerly Corp",
    _seeded: true,
  });
  console.log("Inserted organization:", orgId.toString());

  // ── Branches ───────────────────────────────────────────────────────────────
  const branch1Id = new ObjectId();
  const branch2Id = new ObjectId();
  await db.collection("branches").insertMany([
    { _id: branch1Id, orgId, name: "HQ Branch",    location: "Mumbai", _seeded: true },
    { _id: branch2Id, orgId, name: "South Branch",  location: "Chennai", _seeded: true },
  ]);
  console.log("Inserted branches:", branch1Id.toString(), branch2Id.toString());

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  const users = [
    {
      _id: new ObjectId(), orgId, branchId: branch1Id,
      name: "Alice Admin", email: "alice@empowerly.com",
      passwordHash, role: "ADMIN",
      department: "Management", designation: "CEO",
      baseSalary: 200000, active: true,
      leaveBalance: { sick: 10, casual: 10, earned: 20 },
      joiningDate: new Date("2020-01-01"), _seeded: true,
    },
    {
      _id: new ObjectId(), orgId, branchId: branch1Id,
      name: "Harry HR", email: "harry@empowerly.com",
      passwordHash, role: "HR",
      department: "Human Resources", designation: "HR Manager",
      baseSalary: 80000, active: true,
      leaveBalance: { sick: 10, casual: 10, earned: 15 },
      joiningDate: new Date("2021-03-15"), _seeded: true,
    },
    {
      _id: new ObjectId(), orgId, branchId: branch1Id,
      name: "Emily Employee", email: "emily@empowerly.com",
      passwordHash, role: "EMPLOYEE",
      department: "Engineering", designation: "Software Engineer",
      baseSalary: 60000, active: true,
      leaveBalance: { sick: 10, casual: 10, earned: 12 },
      joiningDate: new Date("2022-06-01"), _seeded: true,
    },
    {
      _id: new ObjectId(), orgId, branchId: branch2Id,
      name: "Sam South", email: "sam@empowerly.com",
      passwordHash, role: "EMPLOYEE",
      department: "Sales", designation: "Sales Executive",
      baseSalary: 50000, active: true,
      leaveBalance: { sick: 10, casual: 10, earned: 10 },
      joiningDate: new Date("2023-01-10"), _seeded: true,
    },
  ];

  await db.collection("users").insertMany(users);
  console.log(`Inserted ${users.length} users`);
  console.log("Default password for all seeded users: Admin@123");

  await client.close();
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
