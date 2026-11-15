# CampusBite – Campus Food Ordering & Delivery Platform

CampusBite is a full-stack campus food ordering and delivery web application. It connects students with campus canteens and student delivery partners.

The application supports three distinct user roles: **Customer**, **Restaurant Owner**, and **Delivery Partner**, with server-side role-based access control (RBAC) enforced on every endpoint.

---

## User Roles

- **Customer**: Browse canteens, search dishes, manage cart, place orders with simulated payment, track live order status, rate and review delivered meals, request returns, and get order history insights.
- **Restaurant Owner**: Manage canteen menus (add, edit, toggle availability), track incoming orders on a live kitchen queue, advance order preparation, assign delivery partners, and approve or reject return requests.
- **Delivery Partner**: Mobile-friendly dashboard to accept delivery assignments and update delivery progress from pickup to drop-off.

---

## How It Works & Workflows

### 1. Main Order Lifecycle

```text
PLACED → ACCEPTED → PREPARING → READY → ASSIGNED → OUT_FOR_DELIVERY → DELIVERED
```

| Step | Who Performs It | Rules & Logic |
|---|---|---|
| **Place Order** | Customer | All dishes must belong to a single canteen and be marked available. Payment is recorded in the ledger as paid. |
| **Accept Order** | Restaurant Owner | Order moves from `PLACED` to `ACCEPTED`. Canteen acknowledges the order. |
| **Start Preparation** | Restaurant Owner | Order moves from `ACCEPTED` to `PREPARING` as the kitchen begins cooking. |
| **Mark Ready** | Restaurant Owner | Order moves from `PREPARING` to `READY` when cooking is complete. |
| **Assign Courier** | Restaurant Owner | Owner assigns an available delivery partner, moving status to `ASSIGNED`. |
| **Start Delivery** | Delivery Partner | Courier picks up the food and marks it `OUT_FOR_DELIVERY`. |
| **Mark Delivered** | Delivery Partner | Courier hands the food to the student and marks it `DELIVERED`. |

*Note: The backend validates every state transition. Orders cannot jump states or skip stages.*

### 2. Return & Refund Loop

```text
DELIVERED → RETURN_REQUESTED → REFUNDED (or REJECTED)
```

1. Once an order is marked `DELIVERED`, the customer can submit a return request with a mandatory explanation (minimum 5 characters).
2. The restaurant owner reviews the request on the **Return Requests** dashboard.
3. If approved, the order status changes to `REFUNDED` and an automated refund entry is written to the payment ledger.
4. If rejected, the order remains `DELIVERED` and the return status is marked as rejected.
5. Refunded orders cannot receive customer reviews.

### 3. Review & Rating Flow

- Customers can submit a 1-to-5 star rating with an optional written review once an order is `DELIVERED`.
- Exactly one review is allowed per order.
- Restaurant average ratings and review counts update automatically.

### 4. Background Reminder Loop

- An automated background worker monitors orders in the kitchen.
- If an order remains stuck in `PLACED`, `ACCEPTED`, or `PREPARING` past the configured threshold (default: 15 minutes), a reminder alert is logged so orders are never missed during rush hours.

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router, Axios, CSS Modules
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2, Pydantic, Uvicorn
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing
- **Database**: SQLite with persistent volume storage
- **Containerization**: Docker & Docker Compose
- **Testing**: Pytest (55 automated tests)

---

## Project Structure

```text
CampusBite/
├── backend/
│   ├── app/
│   │   ├── routers/         # API endpoints (auth, restaurants, orders, etc.)
│   │   ├── auth.py          # Password hashing, JWT & RBAC dependencies
│   │   ├── database.py      # Database engine and session setup
│   │   ├── main.py          # FastAPI application & CORS configuration
│   │   ├── middleware.py    # Request ID tracing and performance logging
│   │   ├── models.py        # SQLAlchemy schema models
│   │   ├── order_rules.py   # State machine validation logic
│   │   ├── reminders.py     # Background stuck-order worker
│   │   └── schemas.py       # Pydantic validation models
│   ├── tests/               # 55 Pytest automated tests
│   ├── Dockerfile           # Backend container build file
│   ├── requirements.txt     # Python dependencies
│   └── seed.py              # Demo database seed script
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client functions
│   │   ├── components/      # Reusable UI components (Navbar, Cards, Badges)
│   │   ├── context/         # AuthContext and CartContext
│   │   ├── pages/           # Customer pages, Owner dashboard, Courier hub
│   │   └── App.jsx          # Route definitions
│   ├── package.json         # Node.js dependencies
│   └── vite.config.js       # Vite configuration
├── docker-compose.yml       # Docker Compose configuration
├── .env.example             # Example environment configuration
├── LICENSE                  # MIT License
└── README.md                # Project documentation
```

---

## How to Run Locally

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

# Seed initial demo canteens and accounts
python seed.py

# Run FastAPI server
python -m uvicorn app.main:app --reload
```

* API will run on `http://127.0.0.1:8000`
* Swagger documentation available at `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

In a second terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

* Open `http://localhost:5173` in your browser.

### 3. Docker Compose (Optional)

```bash
docker compose up -d
```

---

## Demo Test Accounts

The seed script creates the following pre-configured test users (password for all is `password123`):

| Role | Email | Password | What You Can Test |
|---|---|---|---|
| **Customer** | `customer@campusbite.com` | `password123` | Browse canteens, place order, live tracking, reviews, returns |
| **Restaurant Owner** | `owner1@campusbite.com` | `password123` | Kitchen queue, accept/prepare/ready actions, menu management |
| **Delivery Partner** | `delivery@campusbite.com` | `password123` | View assigned orders, mark out for delivery and delivered |

*The login page also includes quick-login buttons to autofill these credentials with a single click.*

---

## Running Automated Tests

Run backend tests using `pytest`:

```bash
cd backend
python -m pytest
```

---

## License

This project is open-source and licensed under the [MIT License](LICENSE).
