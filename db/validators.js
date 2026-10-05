/**
 * db/validators.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Idempotent JSON Schema validators for all collections.
 * Run after indexes.js:
 *   mongosh "$MONGODB_URI" --eval "use empowerlyplus" db/validators.js
 *
 * Conventions (from SPEC):
 *   - *Id fields are BSON ObjectId (bsonType: "objectId")
 *   - Money fields are "double"
 *   - Counters, ratings, month/year are "int"
 *   - Dates are "date"
 *   - validationAction: "error" so inserts that violate the schema are rejected
 * ──────────────────────────────────────────────────────────────────────────────
 */

function applyValidator(collName, validator, validationLevel = "moderate") {
  const collNames = db.getCollectionNames();
  if (!collNames.includes(collName)) {
    db.createCollection(collName, { validator, validationLevel, validationAction: "error" });
    print(`[CREATED] ${collName}`);
  } else {
    db.runCommand({
      collMod: collName,
      validator,
      validationLevel,
      validationAction: "error",
    });
    print(`[UPDATED] ${collName}`);
  }
}

// ── organizations ─────────────────────────────────────────────────────────────
applyValidator("organizations", {
  $jsonSchema: {
    bsonType: "object",
    required: ["name"],
    properties: {
      name: { bsonType: "string", minLength: 1 },
    },
  },
});

// ── branches ──────────────────────────────────────────────────────────────────
applyValidator("branches", {
  $jsonSchema: {
    bsonType: "object",
    required: ["orgId", "name", "location"],
    properties: {
      orgId:    { bsonType: "objectId" },
      name:     { bsonType: "string", minLength: 1 },
      location: { bsonType: "string", minLength: 1 },
    },
  },
});

// ── users ─────────────────────────────────────────────────────────────────────
applyValidator("users", {
  $jsonSchema: {
    bsonType: "object",
    required: ["orgId", "branchId", "name", "email", "role"],
    properties: {
      orgId:    { bsonType: "objectId" },
      branchId: { bsonType: "objectId" },
      name:     { bsonType: "string", minLength: 1 },
      email:    { bsonType: "string", pattern: "^.+@.+$" },
      role:     { bsonType: "string", enum: ["EMPLOYEE", "HR", "ADMIN"] },
      department:  { bsonType: ["string", "null"] },
      designation: { bsonType: ["string", "null"] },
      joiningDate: { bsonType: ["date", "null"] },
      baseSalary:  { bsonType: ["double", "null"], minimum: 0 },
      active:      { bsonType: ["bool", "null"] },
      leaveBalance: {
        bsonType: "object",
        properties: {
          sick:   { bsonType: "int", minimum: 0 },
          casual: { bsonType: "int", minimum: 0 },
          earned: { bsonType: "int", minimum: 0 },
        },
      },
    },
  },
});

// ── attendance_records ────────────────────────────────────────────────────────
applyValidator("attendance_records", {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "branchId", "date", "status"],
    properties: {
      userId:   { bsonType: "objectId" },
      branchId: { bsonType: "objectId" },
      date:     { bsonType: "date" },
      status:   { bsonType: "string", enum: ["PRESENT", "ABSENT", "CHECKED_IN"] },
      checkIn:  { bsonType: ["date", "null"] },
      checkOut: { bsonType: ["date", "null"] },
    },
  },
});

// ── leave_applications ────────────────────────────────────────────────────────
applyValidator("leave_applications", {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "branchId", "type", "startDate", "endDate", "status"],
    properties: {
      userId:    { bsonType: "objectId" },
      branchId:  { bsonType: "objectId" },
      type:      { bsonType: "string", enum: ["SICK", "CASUAL", "EARNED"] },
      startDate: { bsonType: "date" },
      endDate:   { bsonType: "date" },
      status:    { bsonType: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
      remarks:   { bsonType: ["string", "null"] },
      decidedBy: { bsonType: ["objectId", "null"] },
    },
  },
});

// ── payroll_cycles ────────────────────────────────────────────────────────────
applyValidator("payroll_cycles", {
  $jsonSchema: {
    bsonType: "object",
    required: ["branchId", "month", "year", "status"],
    properties: {
      branchId: { bsonType: "objectId" },
      month:    { bsonType: "int", minimum: 1, maximum: 12 },
      year:     { bsonType: "int" },
      status:   { bsonType: "string", enum: ["DRAFT", "GENERATED", "APPROVED"] },
    },
  },
});

// ── payroll_entries ───────────────────────────────────────────────────────────
applyValidator("payroll_entries", {
  $jsonSchema: {
    bsonType: "object",
    required: ["cycleId", "userId", "baseSalary", "netPay", "status"],
    properties: {
      cycleId:    { bsonType: "objectId" },
      userId:     { bsonType: "objectId" },
      baseSalary: { bsonType: "double", minimum: 0 },
      deductions: { bsonType: ["double", "null"], minimum: 0 },
      netPay:     { bsonType: "double", minimum: 0 },
      status:     { bsonType: "string", enum: ["PENDING", "APPROVED", "PAID"] },
    },
  },
});

// ── review_cycles ─────────────────────────────────────────────────────────────
applyValidator("review_cycles", {
  $jsonSchema: {
    bsonType: "object",
    required: ["period", "deadline"],
    properties: {
      period:   { bsonType: "string", minLength: 1 },
      deadline: { bsonType: "date" },
    },
  },
});

// ── performance_reviews ───────────────────────────────────────────────────────
applyValidator("performance_reviews", {
  $jsonSchema: {
    bsonType: "object",
    required: ["reviewCycleId", "userId", "status"],
    properties: {
      reviewCycleId: { bsonType: "objectId" },
      userId:        { bsonType: "objectId" },
      status:        { bsonType: "string", enum: ["SELF_SUBMITTED", "HR_RATED", "APPROVED"] },
      selfRating:    { bsonType: ["int", "null"], minimum: 1, maximum: 5 },
      hrRating:      { bsonType: ["int", "null"], minimum: 1, maximum: 5 },
    },
  },
});

// ── policy_documents ──────────────────────────────────────────────────────────
applyValidator("policy_documents", {
  $jsonSchema: {
    bsonType: "object",
    required: ["title", "text"],
    properties: {
      title:     { bsonType: "string", minLength: 1 },
      text:      { bsonType: "string" },
      embedding: { bsonType: ["array", "null"] },
    },
  },
});

// ── audit_logs ────────────────────────────────────────────────────────────────
// Written ONLY by the Atlas Trigger – never by application code.
applyValidator("audit_logs", {
  $jsonSchema: {
    bsonType: "object",
    required: ["collectionName", "operation", "documentId", "timestamp"],
    properties: {
      collectionName: { bsonType: "string", minLength: 1 },
      operation:      { bsonType: "string", enum: ["INSERT", "UPDATE", "DELETE"] },
      documentId:     { bsonType: "objectId" },
      timestamp:      { bsonType: "date" },
    },
  },
});

print("All validators applied successfully.");
