// Temporary script to inspect validators and indexes
const collections = db.getCollectionNames();
collections.sort().forEach(collName => {
  const info = db.getCollectionInfos({ name: collName })[0];
  const hasValidator = !!(info && info.options && info.options.validator);
  print("Collection: " + collName);
  print("  Validator attached: " + (hasValidator ? "YES" : "NO"));
  print("  Indexes:");
  db.getCollection(collName).getIndexes().forEach(idx => {
    print("    - " + idx.name + ": " + JSON.stringify(idx.key));
  });
  print("");
});
