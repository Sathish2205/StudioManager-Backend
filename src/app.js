'use strict'

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const { clientUrl, isDev } = require('./config/env')
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware')

// Route imports
const authRoutes = require('./routes/authRoutes')
const clientRoutes = require('./routes/clientRoutes')
const eventRoutes = require('./routes/eventRoutes')
const calendarRoutes = require('./routes/calendarRoutes')
const workflowRoutes = require('./routes/workflowRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const expenseRoutes = require('./routes/expenseRoutes')
const financeRoutes = require('./routes/financeRoutes')
const employeeRoutes = require('./routes/employeeRoutes')
const taskRoutes = require('./routes/taskRoutes')
const equipmentRoutes = require('./routes/equipmentRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const settingsRoutes = require('./routes/settingsRoutes')
const quotationRoutes = require('./routes/quotationRoutes')
const invoiceRoutes = require('./routes/invoiceRoutes')
const shiftRoutes = require('./routes/shiftRoutes')
const attendanceRoutes = require('./routes/attendanceRoutes')
const leaveRoutes = require('./routes/leaveRoutes')
const payrollRoutes = require('./routes/payrollRoutes')
const packageRoutes = require('./routes/packageRoutes')

const tenantRoutes = require('./routes/tenantRoutes')

const app = express()

// ──────────────── Security & Parsing ────────────────
app.use(helmet())
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
if (isDev) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// ──────────────── Health Check ────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PhotoStudio Pro API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// ──────────────── API Routes ────────────────
app.use('/api/auth', authRoutes)
app.use('/api/tenants', tenantRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/workflows', workflowRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/quotations', quotationRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/shifts', shiftRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/packages', packageRoutes)

// ──────────────── Error Handling ────────────────
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
