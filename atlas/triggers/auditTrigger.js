/**
 * atlas/triggers/auditTrigger.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Atlas Database Trigger source – INSERT this function body into the Atlas UI.
 *
 * Trigger configuration:
 *   Name:            empowerlyplus_audit
 *   Linked Data Source: <your Atlas cluster>
 *   Database:        empowerlyplus
 *   Collection:      * (one trigger per collection, or use Match Expression)
 *   Operation Types: Insert, Update, Delete
 *   Full Document:   on (for Insert / Update to capture documentId)
 *   Event Ordering:  off (for throughput)
 *   Function:        paste the body below
 *
 * Purpose:
 *   Writes a document to audit_logs for every INSERT / UPDATE / DELETE on any
 *   monitored collection.  Application code NEVER writes to audit_logs (see SPEC).
 * ──────────────────────────────────────────────────────────────────────────────
 */

exports = async function (changeEvent) {
  const { operationType, ns, documentKey, fullDocument } = changeEvent;

  const operationMap = {
    insert: "INSERT",
    update: "UPDATE",
    replace: "UPDATE",
    delete: "DELETE",
  };

  const operation = operationMap[operationType];
  if (!operation) return; // ignore other event types (e.g. drop)

  const mongo = context.services.get("mongodb-atlas");
  const db    = mongo.db("empowerlyplus");

  await db.collection("audit_logs").insertOne({
    collectionName: ns.coll,
    operation,
    documentId: documentKey._id,          // BSON ObjectId
    timestamp:  new Date(),
  });
};
