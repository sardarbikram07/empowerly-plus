/**
 * db/indexes.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Idempotent index creation script for the "empowerlyplus" database.
 * Run with:
 *   mongosh "$MONGODB_URI" --eval "use empowerlyplus" db/indexes.js
 * Or on Windows PowerShell:
 *   mongosh $env:MONGODB_URI --eval "use empowerlyplus" db/indexes.js
 *
 * Rules (from docs/SPEC.md § Repo rules):
 *   - ALL index DDL lives here. Spring Boot NEVER creates indexes.
 *   - spring.data.mongodb.auto-index-creation is false.
 *   - The vector index "policy_vector_index" is created manually in the Atlas UI
 *     (Atlas Search / Vector Search) and is NOT created by this script.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// Helper: create index only if it does not already exist (idempotent).
function ensureIndex(collName, keyPattern, options = {}) {
  const coll = db.getCollection(collName);
  try {
    coll.createIndex(keyPattern, options);
    print(`[OK]  ${collName} ${JSON.stringify(keyPattern)}`);
  } catch (e) {
    if (e.code === 85 || e.code === 86) {
      // IndexOptionsConflict or IndexKeySpecsConflict – index already exists
      print(`[SKIP] ${collName} ${JSON.stringify(keyPattern)} (already exists)`);
    } else {
      throw e;
    }
  }
}

// ── attendance_records ────────────────────────────────────────────────────────
ensureIndex("attendance_records", { branchId: 1, date: -1 });

// Business rule: one record per user per day
ensureIndex("attendance_records", { userId: 1, date: 1 }, { unique: true });

// ── leave_applications ────────────────────────────────────────────────────────
ensureIndex("leave_applications", { userId: 1, status: 1 });

// ── payroll_entries ───────────────────────────────────────────────────────────
ensureIndex("payroll_entries", { cycleId: 1, userId: 1 });

// ── payroll_cycles ────────────────────────────────────────────────────────────
// Business rule: one cycle per branch per month+year
ensureIndex("payroll_cycles", { branchId: 1, year: 1, month: 1 }, { unique: true });

// ── users ─────────────────────────────────────────────────────────────────────
ensureIndex("users", { email: 1 }, { unique: true });

// Text index for search by name or email
ensureIndex("users", { name: "text", email: "text" }, { name: "users_text_idx" });

// ── NOTE: Vector index "policy_vector_index" ──────────────────────────────────
// Collection: policy_documents, field: embedding, dimensions: 768, similarity: cosine
// CREATE THIS MANUALLY in the Atlas UI under Atlas Search → Create Search Index → Vector Search.
// It cannot be created via mongosh because Atlas Vector Search indexes use a separate API.
print("[NOTE] policy_vector_index must be created manually in the Atlas UI.");

print("All indexes applied successfully.");
