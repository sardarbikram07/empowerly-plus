/**
 * scripts/bootstrap.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time setup seed: inserts one organization, three branches, and one ADMIN
 * user (admin@empowerly.test / Admin@123). Safe to run twice — every insert is
 * guarded by an upsert / findOne check. All *Id reference fields are stored as
 * BSON ObjectId so the collection validators accept the writes.
 *
 * Usage:
 *   node scripts/bootstrap.js
 *
 * Requires: MONGODB_URI and MONGODB_DB in backend/.env (or scripts/.env).
 * The script reads backend/.env first; falls back to scripts/.env.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const path = require("path");
const fs   = require("fs");

// ── Load .env manually (support backend/.env and scripts/.env) ───────────────
function loadEnv(...files) {
  for (const f of files) {
    if (fs.existsSync(f)) {
      const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx <= 0) continue;
        const key   = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) process.env[key] = value;  // don't override real env
      }
      // Stop after first found file
      break;
    }
  }
}

const root = path.resolve(__dirname, "..");
loadEnv(
  path.join(root, "backend", ".env"),
  path.join(__dirname, ".env")
);

const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB  = process.env.MONGODB_DB || "empowerlyplus";

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in.");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main bootstrap
// ─────────────────────────────────────────────────────────────────────────────
async function bootstrap() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db(MONGODB_DB);

  // ── Organization ────────────────────────────────────────────────────────────
  // Skip if already bootstrapped (check by name sentinel)
  let org = await db.collection("organizations").findOne({ name: "Empowerly Corp" });
  if (!org) {
    const orgId = new ObjectId();
    await db.collection("organizations").insertOne({
      _id:  orgId,
      name: "Empowerly Corp",
    });
    org = await db.collection("organizations").findOne({ _id: orgId });
    console.log("Inserted organization:", org._id.toString());
  } else {
    console.log("Organization already exists:", org._id.toString());
  }
  const orgId = org._id; // already an ObjectId

  // ── Branches (3) ────────────────────────────────────────────────────────────
  const branchDefs = [
    { name: "HQ Branch",    location: "Mumbai"  },
    { name: "North Branch", location: "Delhi"   },
    { name: "South Branch", location: "Chennai" },
  ];

  const branchIds = {};
  for (const def of branchDefs) {
    let branch = await db.collection("branches").findOne({ orgId, name: def.name });
    if (!branch) {
      const id = new ObjectId();
      await db.collection("branches").insertOne({
        _id:      id,
        orgId,                 // ObjectId – validator requires bsonType objectId
        name:     def.name,
        location: def.location,
      });
      branchIds[def.name] = id;
      console.log(`Inserted branch "${def.name}":`, id.toString());
    } else {
      branchIds[def.name] = branch._id;
      console.log(`Branch "${def.name}" already exists:`, branch._id.toString());
    }
  }

  // Use HQ branch for the admin user
  const adminBranchId = branchIds["HQ Branch"];

  // ── ADMIN user ───────────────────────────────────────────────────────────────
  const ADMIN_EMAIL = "admin@empowerly.test";
  let adminUser = await db.collection("users").findOne({ email: ADMIN_EMAIL });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash("Admin@123", 12);
    const userId = new ObjectId();
    await db.collection("users").insertOne({
      _id:          userId,
      orgId,                   // ObjectId
      branchId:     adminBranchId,  // ObjectId
      name:         "Admin User",
      email:        ADMIN_EMAIL,
      passwordHash,
      role:         "ADMIN",
      active:       true,
      leaveBalance: {
        sick:   10,
        casual: 12,
        earned: 15,
      },
    });
    console.log("Inserted ADMIN user:", userId.toString(), "email:", ADMIN_EMAIL);
  } else {
    console.log("ADMIN user already exists:", adminUser._id.toString(), "email:", ADMIN_EMAIL);
  }

  await client.close();
  console.log("Bootstrap complete.");
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
