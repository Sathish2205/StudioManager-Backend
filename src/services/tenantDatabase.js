'use strict'

const mongoose = require('mongoose')
const Tenant = require('../models/master/Tenant')
const { mongoUri } = require('../config/env')
const schemas = require('../models/tenant/tenantSchemas')

// Connection cache map: databaseName -> { connection, models }
const connectionCache = new Map()

/**
 * Derives a connection URI for a specific tenant database from the master URI.
 */
const getTenantDbUri = (databaseName) => {
  if (!databaseName) throw new Error('Database name is required for tenant connection')

  try {
    const url = new URL(mongoUri)
    url.pathname = `/${databaseName}`
    return url.toString()
  } catch (err) {
    // Fallback string replacement if URL parse fails
    return mongoUri.replace(/\/[^/?]+(\?|$)/, `/${databaseName}$1`)
  }
}

/**
 * Resolves a Mongoose connection and compiled models bound strictly to a tenant's database.
 * @param {string} tenantId - The unique tenant ID (e.g., 'TENANT_001')
 * @returns {Promise<{ id: string, companyName: string, databaseName: string, db: mongoose.Connection, models: Object }>}
 */
const getTenantDatabase = async (tenantId) => {
  if (!tenantId) {
    throw new Error('Tenant ID is required for database resolution')
  }

  // 1. Fetch Tenant from Master DB
  const tenant = await Tenant.findOne({ tenantId }).lean()
  if (!tenant) {
    const error = new Error(`Tenant record not found for tenantId: ${tenantId}`)
    error.statusCode = 404
    throw error
  }

  if (tenant.status !== 'active') {
    const error = new Error(`Tenant account is ${tenant.status}`)
    error.statusCode = 403
    throw error
  }

  const { databaseName, companyName } = tenant

  // 2. Check Connection Cache
  if (connectionCache.has(databaseName)) {
    const cached = connectionCache.get(databaseName)
    if (cached.db.readyState === 1) {
      return cached
    }
    // Stale or disconnected connection - remove from cache
    connectionCache.delete(databaseName)
  }

  // 3. Create New Connection for Tenant Database
  const tenantUri = getTenantDbUri(databaseName)
  console.log(`🔌 Creating MongoDB connection for tenant [${tenantId}] -> DB: ${databaseName}`)

  const tenantConnection = mongoose.createConnection(tenantUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })

  // Wait for connection to open
  await new Promise((resolve, reject) => {
    tenantConnection.once('open', resolve)
    tenantConnection.once('error', reject)
  })

  // 4. Compile Tenant Models bound to this tenant connection
  const models = {
    Client: tenantConnection.model('Client', schemas.clientSchema),
    Event: tenantConnection.model('Event', schemas.eventSchema),
    Employee: tenantConnection.model('Employee', schemas.employeeSchema),
    Attendance: tenantConnection.model('Attendance', schemas.attendanceSchema),
    Invoice: tenantConnection.model('Invoice', schemas.invoiceSchema),
    Payment: tenantConnection.model('Payment', schemas.paymentSchema),
    Workflow: tenantConnection.model('Workflow', schemas.workflowSchema),
    Settings: tenantConnection.model('Settings', schemas.settingsSchema),
    Equipment: tenantConnection.model('Equipment', schemas.equipmentSchema),
    Expense: tenantConnection.model('Expense', schemas.expenseSchema),
    Leave: tenantConnection.model('Leave', schemas.leaveSchema),
    Notification: tenantConnection.model('Notification', schemas.notificationSchema),
    Payroll: tenantConnection.model('Payroll', schemas.payrollSchema),
    Quotation: tenantConnection.model('Quotation', schemas.quotationSchema),
    Shift: tenantConnection.model('Shift', schemas.shiftSchema),
    Task: tenantConnection.model('Task', schemas.taskSchema),
    Package: tenantConnection.model('Package', schemas.packageSchema),
  }

  const tenantContext = {
    id: tenantId,
    companyName,
    databaseName,
    db: tenantConnection,
    models,
  }

  // 5. Save to Cache
  connectionCache.set(databaseName, tenantContext)

  return tenantContext
}

/**
 * Clears the connection cache (useful for testing or shutdown)
 */
const clearConnectionCache = async () => {
  for (const [dbName, context] of connectionCache.entries()) {
    try {
      await context.db.close()
    } catch {}
  }
  connectionCache.clear()
}

module.exports = {
  getTenantDatabase,
  getTenantDbUri,
  clearConnectionCache,
}
