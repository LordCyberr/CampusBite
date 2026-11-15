# CampusBite – Campus Food Ordering & Delivery Platform

CampusBite is a full-stack web application designed for university campuses. It connects students with campus canteens and student delivery partners through an end-to-end food ordering and tracking platform.

The system supports three user roles: **Customer**, **Restaurant Owner**, and **Delivery Partner**, with role-based access control enforced on every backend route.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Axios, CSS Modules
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2, Pydantic, Uvicorn
- **Authentication**: JWT (JSON Web Tokens) & Bcrypt password hashing
- **Database**: SQLite (default zero-configuration) with persistent storage
- **Containerization**: Docker & Docker Compose
- **Testing**: Pytest (backend automated test suite)

---

## Features by Role

### 1. Customer
- Register and log in with JWT authentication
- Browse campus restaurants and canteens with real-time search
- View restaurant menus, descriptions, and dish availability
- Cart management with single-restaurant ordering rule
- Place orders using simulated payment
- Live order tracking timeline with automatic status updates
- Order history with detailed receipts
- Submit 1-to-5 star ratings and reviews for delivered orders
- Request order returns with validated reasons
- AI-assisted dining insights on personal order history

### 2. Restaurant Owner
- Dedicated kitchen management dashboard
- Live order queue with one-click lifecycle actions:
  - `Accept Order` ➔ `Start Preparation` ➔ `Mark as Ready` ➔ `Assign Courier`
- Menu management: Add, edit, toggle availability, and soft-delete dishes
- Review and approve/reject customer return requests with automated refund ledger entries
- Business metrics: total orders, daily revenue, and customer ratings

### 3. Delivery Partner
- Mobile-friendly delivery dashboard
- View assigned deliveries and active orders
- One-touch status updates:
  - `Start Delivery` (`OUT_FOR_DELIVERY`) ➔ `Mark as Delivered` (`DELIVERED`)
- Delivery history tab showing completed orders

---

## Project Structure

```text
CampusBite/
├── backend/
│   ├── app/
│   │   ├── routers/         # API endpoints (auth, restaurants, orders, etc.)
│   │   ├── auth.py          # Password hashing, JWT & RBAC dependencies
│   │   ├── database.py      # SQLAlchemy engine and session setup
│   │   ├── main.py          # FastAPI application & middleware
│   │   ├── models.py        # Database schema models
│   │   └── schemas.py       # Pydantic request/response schemas
│   ├── tests/               # Pytest automated test suite
│   ├── Dockerfile           # Backend container build specification
│   ├── requirements.txt     # Python dependencies
│   └── seed.py              # Initial demo users and canteen data
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (Navbar, Cards, Badges)
│   │   ├── context/         # AuthContext and CartContext state
│   │   ├── pages/           # Pages (Restaurants, Menu, Orders, Dashboards)
│   │   ├── api/             # Axios API client functions
│   │   └── App.jsx          # Route definitions & protected routes
│   ├── package.json         # Node.js dependencies
│   └── vite.config.js       # Vite build configuration
├── docker-compose.yml       # Container orchestration
├── .env.example             # Template environment configuration
├── LICENSE                  # MIT License
└── README.md                # Project documentation
```

---

## How to Run Locally

### Prerequisites
- Python 3.10 or newer
- Node.js 18 or newer

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed initial demo restaurants and accounts
python seed.py

# Start the FastAPI server
python -m uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.  
Interactive Swagger docs: `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at `http://localhost:5173`.

### 3. Optional: Run with Docker Compose

If you have Docker Desktop installed:

```bash
docker compose up -d
```

---

## Demo Test Accounts

The seed script creates the following pre-configured test users (password for all is `password123`):

| Role | Email | Password |
|---|---|---|
| **Customer** | `customer@campusbite.com` | `password123` |
| **Restaurant Owner** | `owner1@campusbite.com` | `password123` |
| **Delivery Partner** | `delivery@campusbite.com` | `password123` |

The login page also provides one-click quick login buttons to quickly test each role without typing.

---

## Order Status Lifecycle

```text
[PLACED] ➔ [ACCEPTED] ➔ [PREPARING] ➔ [READY] ➔ [ASSIGNED] ➔ [OUT_FOR_DELIVERY] ➔ [DELIVERED]
```

- **Refund / Return Flow**:
  - `[DELIVERED]` ➔ `[RETURN_REQUESTED]` ➔ `[REFUNDED]` (or `[DELIVERED]` on rejection)

---

## Running Automated Tests

Run backend tests using `pytest`:

```bash
cd backend
python -m pytest
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
