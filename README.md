# Udhar Khata Management System

A full-stack financial ledger and debt tracking application designed for shops, small businesses, and individuals to track customer debts (Udhar) and repayments (Payments).

---

## 🚀 Features

- **Authentication & Multi-User Isolation**:
  - Secure account registration and login using salted `bcrypt` password hashing.
  - Data is isolated per user (`user_id`); each user only manages their own khata entries.
  - Persistent login state using local storage and React context.
- **Ledger & Debt Tracking**:
  - Record debts (**Udhar Given**) and repayments (**Payment Received**).
  - Real-time calculation of net balance (Owes You / Advance Paid / Settled).
  - Transaction history timeline with deletion and auditing capabilities.
- **Live Search & Autocomplete**:
  - Instant contact filtering by customer name or identity/phone/note.
  - Interactive HTML5 `<datalist>` autocomplete suggestions.
- **Financial KPI Dashboard**:
  - Live summary metrics: Total Udhar Given, Total Payments Received, Net Balance Outstanding, and Active Contacts.
- **Contact Management**:
  - Dedicated "Add New Contact" flow with optional initial balance.
  - Real-time side ledger preview showing existing balances and transaction counts.
  - Contact deletion with cascaded transaction cleanup.
- **Modern & Responsive UI**:
  - Clean Material Design 3 inspired color tokens, glassmorphic auth cards, smooth modal animations, and mobile-friendly layouts.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, React Router v7, Context API, CSS Variables & Flexbox/Grid
- **Backend**: Node.js, Express 5, `pg` (node-postgres connection pool), `bcrypt`, `cors`
- **Database**: PostgreSQL 13+ (UUID primary keys via `gen_random_uuid()`)

---

## 🗄️ Database Architecture

The PostgreSQL schema consists of two primary tables:

### 1. `users`
| Column | Type | Description |
|---|---|---|
| `user_id` | UUID (PK) | Unique user ID (`DEFAULT gen_random_uuid()`) |
| `name` | VARCHAR(255) | Full name of the account owner |
| `email` | VARCHAR(255) | Unique email address |
| `password` | VARCHAR(255) | Bcrypt hashed password |
| `created_at` | TIMESTAMPTZ | Account registration timestamp |

### 2. `udhar`
| Column | Type | Description |
|---|---|---|
| `udhar_id` | UUID (PK) | Unique transaction ID (`DEFAULT gen_random_uuid()`) |
| `name` | VARCHAR(255) | Contact / Customer name |
| `identity` | VARCHAR(255) | Phone number, CNIC, or identification note |
| `amount` | INT | Transaction amount in currency units (`CHECK (amount > 0)`) |
| `type` | VARCHAR(255) | Transaction type (`'udhar'` or `'payment'`) |
| `date` | DATE | Date of transaction |
| `user_id` | UUID (FK) | References `users(user_id) ON DELETE CASCADE` |
| `created_at` | TIMESTAMPTZ | Transaction creation timestamp |

Indexes:
- `idx_udhar_user` on `udhar(user_id)`
- `idx_udhar_contact` on `udhar(user_id, name, identity)`

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** running on `localhost:5432`

### 2. Database Setup
Create the `udhar` database in PostgreSQL:
```sql
CREATE DATABASE udhar;
```
*(The backend automatically runs schema verification and creates all required tables and indexes on first startup).*

### 3. Start Backend Server
```bash
cd Backend
npm install
npm start
```
The API server will start on `http://localhost:5000`.

Environment variables can be configured via `Backend/.env` (see `Backend/.env.example`):
- `PORT` (Default: `5000`)
- `PGUSER` (Default: `postgres`)
- `PGPASSWORD` (Default: `kashi2002`)
- `PGHOST` (Default: `localhost`)
- `PGPORT` (Default: `5432`)
- `PGDATABASE` (Default: `udhar`)

### 4. Start Frontend Application
```bash
cd udhar-management
npm install
npm start
```
The web app will open at `http://localhost:3000`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health and DB status |
| `POST` | `/api/signup` | Register new user account |
| `POST` | `/api/login` | Sign in with email/name and password |
| `GET` | `/api/contacts?user_id=...` | List all contacts and transaction history |
| `POST` | `/api/contacts` | Create a new contact with optional opening balance |
| `DELETE` | `/api/contacts` | Delete contact and all associated records |
| `POST` | `/api/udhar` | Record a new Udhar or Payment transaction |
| `DELETE` | `/api/udhar/:id` | Delete a single transaction entry |
| `GET` | `/api/summary?user_id=...` | Get aggregate ledger statistics |

---

## 🧪 Testing

To run backend integration tests:
```bash
node scratch/test_api.js
```
To run frontend tests and production build verification:
```bash
cd udhar-management
npm test -- --watchAll=false
npm run build
```
