# Atlas Configuration – Source Files Only

This directory contains **source code and documentation** for MongoDB Atlas services.
These files are **not automatically deployed**; they must be pasted into the Atlas UI manually,
or deployed via the [Atlas App Services CLI](https://www.mongodb.com/docs/atlas/app-services/cli/).

## Directory structure

```
atlas/
├── triggers/
│   └── auditTrigger.js   ← Database Trigger function body
└── README.md             ← This file
```

## Atlas Trigger: `empowerlyplus_audit`

| Setting             | Value                             |
|---------------------|-----------------------------------|
| Linked Data Source  | Your Atlas cluster                |
| Database            | `empowerlyplus`                   |
| Collection          | *(all collections)*               |
| Operation Types     | Insert, Update, Delete            |
| Full Document       | On                                |
| Event Ordering      | Off                               |
| Function            | paste `triggers/auditTrigger.js`  |

The trigger writes one document to `audit_logs` for every mutating operation.
**Application code never writes to `audit_logs`.**

## Vector Search Index: `policy_vector_index`

Must be created manually in the Atlas UI:
1. Go to **Atlas Search → Create Search Index**
2. Select **Vector Search**
3. Collection: `empowerlyplus.policy_documents`
4. Field: `embedding`
5. Dimensions: `768`
6. Similarity: `cosine`
7. Name: `policy_vector_index`

This index cannot be created via mongosh or the Spring application.
