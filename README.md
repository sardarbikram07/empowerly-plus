# Empowerly+

> Multi-branch HR & Workforce Management System · DBMS Project
> Stack: Java 17 · Spring Boot 3.x · MongoDB Atlas · React 19 · Vite · Tailwind CSS

---

## Repository layout

```
empowerly-plus/
├── backend/          Spring Boot 3 application (com.empowerlyplus)
├── frontend/         Vite + React 19 SPA
├── db/               mongosh scripts (indexes, validators) – idempotent
├── atlas/            Atlas Trigger & Function source + docs (deploy manually)
├── scripts/          Node.js utility scripts (seed)
└── docs/             Project spec and future ADRs
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Node.js | 20+ |
| mongosh | 2.x (for running db/ scripts) |
| MongoDB Atlas | Free tier M0 or higher |

---

## First-time setup

### 1 – Create local .env files

Copy the examples and fill in your values:

```powershell
# Backend
Copy-Item backend\.env.example backend\.env

# Scripts
Copy-Item scripts\.env.example scripts\.env
```

Then open each `.env` file and fill in:
- `MONGODB_URI` – your Atlas connection string (get it from Atlas UI → Connect → Drivers)
- `JWT_SECRET`  – any random string ≥ 32 characters
- Leave the rest as defaults for local dev

The frontend reads `VITE_API_URL` from `frontend/.env.local`, but in dev mode
the Vite proxy forwards `/api` to `localhost:8080` automatically, so no value is needed.

---

### 2 – Apply MongoDB indexes and validators

> **Note**: Phase 1 adds a proper apply script for database initialization.

> **Atlas Vector Search index**: must be created manually in the Atlas UI.
> See [atlas/README.md](atlas/README.md) for instructions.

---

### 3 – Run the backend

```powershell
cd backend
# Windows
.\mvnw.cmd spring-boot:run

# macOS/Linux
./mvnw spring-boot:run
```

The backend starts on **http://localhost:8080**.
Verify it is up: `curl http://localhost:8080/api/health`

Expected response:
```json
{ "status": "UP", "mongoPing": "ok", "timestamp": "..." }
```

Swagger UI is available at: http://localhost:8080/api/swagger-ui.html

---

### 4 – Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**.

---

### 5 – Seed the database (optional)

```powershell
cd scripts
npm install
npm run seed
```

This inserts one organization, two branches, and four users.
Default password for all seeded accounts: `Admin@123`

| Email | Role |
|-------|------|
| alice@empowerly.com | ADMIN |
| harry@empowerly.com | HR |
| emily@empowerly.com | EMPLOYEE (HQ) |
| sam@empowerly.com   | EMPLOYEE (South) |

---

---

## Environment variable reference

### backend/.env

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `MONGODB_DB` | ✅ | Database name (`empowerlyplus`) |
| `JWT_SECRET` | ✅ | HMAC-SHA256 signing secret (≥ 32 chars) |
| `JWT_EXPIRY_MINUTES` | ☑️ | Token lifetime in minutes (default 60) |
| `GEMINI_API_KEY` | ☑️ | Google Gemini API key (AI features) |
| `CORS_ORIGIN` | ☑️ | Frontend origin (default `http://localhost:5173`) |

### scripts/.env

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `MONGODB_DB` | ☑️ | Database name (default `empowerlyplus`) |

### frontend/.env.local

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ☑️ | Backend URL for production builds (empty = use proxy) |

---

## Spec

See [docs/SPEC.md](docs/SPEC.md) for the full data model, business rules, API conventions, and repo rules.
Every implementation task should start by reading it.
