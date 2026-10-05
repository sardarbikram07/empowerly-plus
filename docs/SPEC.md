# Empowerly+ spec

## Domain
Multi-branch company HR system. Roles: EMPLOYEE (own data only), HR (own branch), ADMIN (whole organization).

## Data model: MongoDB database "empowerlyplus"
Conventions: every *Id reference field is a BSON ObjectId, never a string (the validators require it). Money fields are BSON double. Counters, ratings, month and year are int32. Dates are BSON date. Fields beyond those listed are allowed. In the lists below, * means required by the validator.

- organizations: name*
- branches: orgId*, name*, location*
- users: orgId*, branchId*, name*, email* (matches ^.+@.+$), role* (EMPLOYEE|HR|ADMIN), department, leaveBalance {sick, casual, earned: int >= 0}. Extra fields used by the app: passwordHash, active (bool), baseSalary (double >= 0), designation, joiningDate (date).
- attendance_records: userId*, branchId*, date*, status* (PRESENT|ABSENT|CHECKED_IN), checkIn, checkOut
- leave_applications: userId*, branchId*, type* (SICK|CASUAL|EARNED), startDate*, endDate*, status* (PENDING|APPROVED|REJECTED). Extra: remarks, decidedBy.
- payroll_cycles: branchId*, month* (int 1-12), year*, status* (DRAFT|GENERATED|APPROVED)
- payroll_entries: cycleId*, userId*, baseSalary* (double >= 0), deductions (double >= 0), netPay* (double >= 0), status* (PENDING|APPROVED|PAID)
- review_cycles: period*, deadline*
- performance_reviews: reviewCycleId*, userId*, status* (SELF_SUBMITTED|HR_RATED|APPROVED), selfRating (int 1-5), hrRating (int 1-5)
- policy_documents: title*, text*, embedding (array of 768 doubles)
- audit_logs: collectionName*, operation* (INSERT|UPDATE|DELETE), documentId* (ObjectId), timestamp* (date). Written ONLY by the Atlas Trigger, never by application code.

## Indexes (db/indexes.js)
- attendance_records {branchId:1, date:-1}
- leave_applications {userId:1, status:1}
- payroll_entries {cycleId:1, userId:1}
- users {email:1} unique
- users text index on {name, email}
- Vector index "policy_vector_index" on policy_documents.embedding, 768 dims, cosine: created manually in the Atlas UI, not by script.
- Additional unique indexes that enforce business rules: attendance_records {userId:1, date:1}; payroll_cycles {branchId:1, year:1, month:1}.

## Business rules
- Leave balance is deducted only when a leave is approved, and approval is refused if the balance is insufficient. Duration is inclusive calendar days.
- One attendance record per user per day. checkOut must be after checkIn.
- Payroll generation is atomic: a multi-document transaction (@Transactional + MongoTransactionManager). The cycle must be DRAFT to generate, and ends as GENERATED. Entries are created for every active user in the branch.
- Payroll formula (keep simple and document it in code): deductions = 12% of baseSalary + (number of ABSENT days in the month x baseSalary / 30); netPay = baseSalary - deductions.
- Scope: EMPLOYEE sees only their own records; HR only their branch; ADMIN everything.
- Passwords are hashed with BCrypt. passwordHash is never returned by any endpoint.

## API conventions
All routes under /api. JWT Bearer auth. Use DTOs, never expose entities. Error body: {timestamp, status, error, message, path}. List endpoints support page and size.

## Repo rules
- Validators, indexes and views live ONLY in db/*.js, idempotent, applied with mongosh. Spring never creates indexes.
- The seed is a Node script in scripts/.
- No secrets in git.

Make the backend and scripts load variables from a local .env file (for Spring, use spring.config.import=optional:file:.env[.properties]), since Spring Boot does not read .env files on its own.

I am on Windows with PowerShell and my project path is C:\dev\empowerly-plus, so any shell scripts you create need a .ps1 version as well.
