# 📸 PhotoStudio Pro - Production Backend API

A complete, production-ready **Node.js, Express, MongoDB, Mongoose, & JWT** REST API backend for **PhotoStudio PRO®** (Wedding Photography Studio Management Platform).

---

## 🚀 Technical Highlights

- **Framework**: Node.js & Express.js (Modular MVC architecture)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) & bcrypt password hashing
- **Security**: Helmet, CORS, Express Rate Limiting, Input Validation & Sanitisation
- **Validation**: express-validator middleware with consistent error responses
- **Pagination & Search**: DRY pagination helper supporting sort, filter, status, and regex text search
- **Business Logic**: Automated event remaining balance calculation on payment create/delete; auto-generated 10-stage workflow pipelines; photographer conflict checking for calendar bookings
- **Analytics**: High-performance MongoDB Aggregation Pipelines powering Dashboard KPIs and financial charts
- **Seeding**: Fully idempotent seed script (`npm run seed`) populating sample data matching frontend mocks

---

## 🛠️ Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection & graceful shutdown handlers
│   │   └── env.js                # Centralised environment variable exports
│   │
│   ├── controllers/
│   │   ├── authController.js         # Register, Login, Me, Profile, Password, Logout
│   │   ├── dashboardController.js    # Aggregated KPI cards, monthly revenue/expenses
│   │   ├── clientController.js       # Client CRM CRUD with pagination & history
│   │   ├── eventController.js        # Event CRUD, remaining balance calc, workflow auto-gen
│   │   ├── calendarController.js     # Calendar event formatting & crew conflict checker
│   │   ├── workflowController.js     # Post-production pipeline stage tracking
│   │   ├── financeController.js      # Monthly financial overview & payment breakdowns
│   │   ├── paymentController.js      # Payment transactions & balance recalculation
│   │   ├── expenseController.js      # Studio operational expenses
│   │   ├── employeeController.js     # Crew & staff roster management
│   │   ├── taskController.js         # Employee task assignment & tracking
│   │   ├── equipmentController.js    # Photography gear inventory & availability
│   │   ├── notificationController.js # System alerts & read status tracking
│   │   └── settingsController.js     # Studio settings & package pricing presets
│   │
│   ├── models/
│   │   ├── User.js               # Auth users with roles (admin, manager, photographer, editor, staff)
│   │   ├── Client.js             # Customer CRM records
│   │   ├── Event.js              # Shoot bookings & financial balances
│   │   ├── Payment.js            # Payment receipts (Advance, Installment, Final)
│   │   ├── Expense.js            # Operating expenses across 10 categories
│   │   ├── Employee.js           # Staff roster & pay rates
│   │   ├── Task.js               # Tasks with priorities & auto-completedAt
│   │   ├── Workflow.js           # 10-stage event post-production pipeline
│   │   ├── Equipment.js          # Gear inventory, condition, checkout availability
│   │   ├── Notification.js       # User notification alerts
│   │   └── Settings.js           # Studio configuration singleton
│   │
│   ├── routes/                   # Modular Express routers
│   ├── middleware/               # Auth, Role RBAC, Validation & Centralised Error Handler
│   ├── validators/               # express-validator rule sets
│   ├── utils/                    # Response helpers, Token generator, Pagination parser
│   ├── seed.js                   # Database seeder script
│   ├── app.js                    # Express app setup
│   └── server.js                 # Server entry point
│
├── tests/                        # Integration test suite (Jest & Supertest)
├── Postman_Collection.json       # Ready-to-import Postman API collection
├── .env                          # Local environment settings
└── package.json
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/photostudiopro
JWT_SECRET=photostudiopro_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 📦 Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Seed the database** with initial users, clients, events, payments, crew, gear, and tasks:
   ```bash
   npm run seed
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Server will run at: `http://localhost:5000/api`

4. **Run Integration Tests**:
   ```bash
   npm test
   ```

---

## 🔐 Login Credentials (After Seeding)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@photostudiopro.com` | `admin123` |
| **Manager** | `manager@photostudiopro.com` | `manager123` |

---

## 🌐 API Endpoint Reference

### Authentication & User Profile
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login & return JWT
- `GET /api/auth/me` - Get logged-in user profile
- `PUT /api/auth/profile` - Update user profile details
- `PUT /api/auth/change-password` - Update account password
- `POST /api/auth/logout` - Logout user

### Dashboard & Analytics
- `GET /api/dashboard` - Get full aggregated dashboard statistics, KPIs, charts & recent activity

### Client CRM
- `GET /api/clients` - List clients with search, status filter & pagination (`?page=1&limit=10&search=sathish`)
- `POST /api/clients` - Create a new client
- `GET /api/clients/:id` - Get client profile with full event & payment history
- `PUT /api/clients/:id` - Update client profile
- `DELETE /api/clients/:id` - Delete client (Admin/Manager only)
- `GET /api/clients/dropdown` - Lightweight list for frontend forms

### Events & Shoots
- `GET /api/events` - List events with date range, status, and type filters
- `POST /api/events` - Book a new shoot (auto-creates 10-stage workflow pipeline)
- `GET /api/events/:id` - Get event details with payments, workflow progress, and tasks
- `PUT /api/events/:id` - Update event details & recalculate balance
- `DELETE /api/events/:id` - Delete event & cascade delete payments/workflows (Admin/Manager)

### Shoot Calendar
- `GET /api/calendar/events` - Get calendar events formatted for UI calendar components
- `GET /api/calendar/events/:id` - Get event detail for calendar click modal
- `GET /api/calendar/check-conflicts` - Check crew double-booking conflicts for a date

### Finance & Payments
- `POST /api/payments` - Record a payment (automatically updates event totalPaid & remainingAmount)
- `GET /api/payments` - List payments with event & client populates
- `GET /api/payments/:id` - Get payment receipt details
- `PUT /api/payments/:id` - Update payment & recalculate event balance
- `DELETE /api/payments/:id` - Delete payment & recalculate event balance
- `GET /api/finance` - Financial overview with monthly revenue/expense aggregation & category breakdown

### Expenses
- `GET /api/expenses` - List studio operational expenses
- `POST /api/expenses` - Log a new expense
- `GET /api/expenses/:id` - Get expense detail
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense (Admin/Manager)

### Workflow Management
- `GET /api/workflows` - List workflow stages across events
- `GET /api/workflows/:eventId` - Get full post-production pipeline for an event
- `POST /api/workflows` - Add a custom workflow stage
- `PUT /api/workflows/stage/:id` - Update stage status (Pending/In Progress/Completed/On Hold)
- `DELETE /api/workflows/stage/:id` - Remove a workflow stage

### Crew & Staff Management
- `GET /api/employees` - List staff roster
- `POST /api/employees` - Register a new crew member (Admin/Manager)
- `GET /api/employees/:id` - Get employee details with assigned tasks, shoots, and gear
- `PUT /api/employees/:id` - Update crew member profile
- `DELETE /api/employees/:id` - Remove crew member
- `GET /api/employees/dropdown` - Grouped list of photographers, videographers, and editors for assignment forms

### Task Management
- `GET /api/tasks` - List tasks by priority, status, or assignee
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get task detail
- `PUT /api/tasks/:id` - Update task status (auto-sets completedAt when status is Completed)
- `DELETE /api/tasks/:id` - Delete task

### Equipment Tracker
- `GET /api/equipment` - List photography gear with condition and availability filters
- `POST /api/equipment` - Add gear item
- `GET /api/equipment/:id` - Get gear detail & checkout status
- `PUT /api/equipment/:id` - Update equipment status/assignment
- `DELETE /api/equipment/:id` - Remove gear item

### Notifications
- `GET /api/notifications` - Get user notifications & unread count
- `PUT /api/notifications/:id/read` - Mark single notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Clear notification

### Settings & Pricing
- `GET /api/settings` - Get studio settings & pricing packages
- `PUT /api/settings` - Update studio settings (Admin/Manager)
- `GET /api/settings/packages` - Get package catalog for frontend forms

---

## 🔗 Connecting to Frontend

Set environment variable in `c:\PhotoStudioPro\.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

The services in `src/services/` are configured to call `VITE_API_URL` endpoints cleanly.
