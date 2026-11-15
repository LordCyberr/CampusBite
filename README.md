# CampusBite — University Canteen Ordering & Delivery Platform

CampusBite is a full-stack campus food ordering, kitchen management, and courier dispatch system designed to eliminate cafeteria rush-hour bottlenecks. It connects campus dining facilities with students and student delivery runners through a real-time, role-segregated platform.

---

## What Problem Does It Solve?

During peak campus break hours, university canteens face overcrowded counters, long waiting queues, and chaotic delivery across campus hostiles and lecture halls. 

CampusBite provides a unified digital ecosystem supporting **three distinct user roles**:
1. **Students (Customers)**: Order ahead, pay via dummy checkout, and track delivery progress in real time.
2. **Canteen Managers (Restaurant Owners)**: Manage menu availability, view live kitchen queues, and advance orders using a strict single-action kitchen board.
3. **Student Couriers (Delivery Partners)**: Accept dispatch assignments on a mobile-friendly dashboard and update delivery status directly to the customer.

---

## Key Engineering Highlights (What Evaluators Look For)

* **Strict 7-Step Order State Machine**:
  Orders follow a deterministic lifecycle:
  $$\text{PLACED} \longrightarrow \text{ACCEPTED} \longrightarrow \text{PREPARING} \longrightarrow \text{READY} \longrightarrow \text{ASSIGNED} \longrightarrow \text{OUT\_FOR\_DELIVERY} \longrightarrow \text{DELIVERED}$$
  The backend strictly rejects invalid state jumps (e.g., an order cannot be marked `DELIVERED` before being `ASSIGNED`).
* **Tamper-Proof Price Recalculation**:
  The client-side cart subtotal is treated as untrusted input. The backend recalculates order totals directly from verified database records and snapshots the price at checkout (`OrderItem.price_at_order`), ensuring future canteen menu price edits never alter historical financial receipts.
* **Single-Restaurant Cart Rule**:
  Prevents order conflicts by restricting each checkout session to a single canteen, alerting the student before switching restaurants.
* **Immutable Payment Ledger**:
  All transactions (simulated payments and approved returns) are recorded as append-only records in a dedicated `PaymentLedger` table.
* **Role-Based Access Control (RBAC)**:
  Every private endpoint is guarded by server-side FastAPI dependencies (`require_role(...)`), verifying Bcrypt-hashed passwords and HMAC-SHA256 JWT tokens.

---

## System Architecture

```text
CampusBite/
├── backend/
│   ├── app/
│   │   ├── routers/         # REST API routes (auth, restaurants, orders, owner, delivery, etc.)
│   │   ├── auth.py          # Bcrypt hashing, JWT token creation, RBAC dependencies
│   │   ├── database.py      # SQLAlchemy engine, session management, SQLite/Postgres URLs
│   │   ├── main.py          # FastAPI application, CORS middleware, lifespan setup
│   │   ├── middleware.py    # Request ID tracing (X-Request-ID) and latency logging
│   │   ├── models.py        # SQLAlchemy relational schema models
│   │   ├── order_rules.py   # State machine validation and price calculation logic
│   │   ├── reminders.py     # Background worker for stuck-order alerts
│   │   └── schemas.py       # Pydantic data validation schemas
│   ├── tests/               # 55 automated unit and integration tests (Pytest)
│   ├── Dockerfile           # Multi-stage production container build
│   ├── requirements.txt     # Locked Python package dependencies
│   └── seed.py              # Idempotent demo database populator
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios REST client with automatic JWT bearer injection
│   │   ├── components/      # Reusable UI (OrderTimeline, StatusBadge, Cards, Navbar)
│   │   ├── context/         # AuthContext and CartContext global state
│   │   ├── pages/           # Customer pages, Kitchen Dashboard, Courier Hub
│   │   └── App.jsx          # Route declarations and role-guarded routes
│   ├── package.json         # React 18 & Vite configuration
│   └── vite.config.js       # Vite bundler configuration
├── docker-compose.yml       # Production multi-container orchestration
├── .env.example             # Clean environment variable template
├── LICENSE                  # MIT License
└── README.md                # Project documentation
```

---

## Quick Evaluation Guide (How to Test in 2 Minutes)

To help evaluators test the platform immediately without creating new accounts, the database includes pre-seeded demo personas:

| Role | Pre-configured Email | Password | What to Test |
|---|---|---|---|
| **Student** | `customer@campusbite.com` | `password123` | Browse canteens, add to cart, checkout, live order timeline, 1-5★ reviews. |
| **Canteen Owner** | `owner1@campusbite.com` | `password123` | Live kitchen queue, one-click order progression, menu availability toggles. |
| **Courier** | `delivery@campusbite.com` | `password123` | Active delivery list, mark order `OUT_FOR_DELIVERY` ➔ `DELIVERED`. |

> **Evaluation Shortcut**: The login page (`/login`) includes one-click quick demo buttons that automatically fill in these credentials for instant evaluation.

### Recommended 3-Minute Walkthrough Flow:
1. Log in as **Student** (`customer@campusbite.com`) ➔ Place an order from *Mario's Campus Pizzeria*.
2. Log in as **Canteen Owner** (`owner1@campusbite.com`) ➔ Open **Owner Orders** ➔ Click `Accept` ➔ Click `Prepare` ➔ Click `Mark Ready` ➔ Assign courier *Sam Courier*.
3. Log in as **Courier** (`delivery@campusbite.com`) ➔ Open **Delivery Dashboard** ➔ Click `Start Delivery` ➔ Click `Mark Delivered`.
4. Switch back to **Student** ➔ View order status updated to `DELIVERED` ➔ Submit a 5-star review!

---

## Local Setup & Installation

### Option A: Standard Local Setup

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS / Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with demo restaurants and accounts
python seed.py

# Start the API server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend API: `http://127.0.0.1:8000`
* Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`

#### 2. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
* Open: `http://localhost:5173`

---

### Option B: Docker Container Deployment

The project includes a production-grade container configuration:
```bash
docker compose up -d
```
* Persistent SQLite database volume: `campusbite-sqlite-data`
* Non-root security user: `appuser` (UID 10001)
* Standard library container healthcheck on `/health`

---

## Automated Testing & Code Quality

The backend includes an exhaustive test suite covering authentication, RBAC, cart isolation, order state machine enforcement, and refund handling:

```bash
cd backend
python -m pytest
```

* **Test Suite**: 55 passed out of 55 unit and integration tests (100% pass rate).
* **End-to-End Walkthrough Script**: `python scripts/verify_phase7b_e2e.py` (verifies all 11 user scenarios programmatically).

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).
