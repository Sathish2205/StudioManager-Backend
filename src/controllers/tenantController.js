'use strict'

const Tenant = require('../models/master/Tenant')
const MasterUser = require('../models/master/User')
const { getTenantDatabase } = require('../services/tenantDatabase')
const { created, badRequest, conflict } = require('../utils/apiResponse')

/**
 * POST /api/tenants
 * Platform-level company creation endpoint.
 */
const createTenant = async (req, res, next) => {
  try {
    const { companyName, ownerName, ownerEmail, ownerUsername, password } = req.body

    if (!companyName || !ownerEmail || !password) {
      return badRequest(res, 'Company name, owner email, and password are required.')
    }

    const emailClean = ownerEmail.trim().toLowerCase()
    const usernameClean = (ownerUsername || emailClean.split('@')[0]).trim().toLowerCase()

    // 1. Check existing user/email in Master DB
    const existingUser = await MasterUser.findOne({
      $or: [{ email: emailClean }, { username: usernameClean }],
    })
    if (existingUser) {
      return conflict(res, 'A user with this email or username already exists.')
    }

    // 2. Generate unique tenantId and databaseName
    const count = await Tenant.countDocuments()
    const tenantId = `TENANT_${String(count + 1).padStart(3, '0')}`
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `company-${Date.now()}`
    const databaseName = `tenant_${String(count + 1).padStart(3, '0')}`

    // 3. Create Tenant in Master DB
    const tenant = await Tenant.create({
      tenantId,
      companyName,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      databaseName,
      status: 'active',
      contactEmail: emailClean,
    })

    // 4. Create Owner User in Master DB
    const userId = `USER_${Date.now().toString().slice(-6)}`
    const ownerUser = await MasterUser.create({
      userId,
      tenantId,
      name: ownerName || companyName + ' Owner',
      username: usernameClean,
      email: emailClean,
      passwordHash: password, // Pre-save hook hashes it
      role: 'owner',
      status: 'active',
    })

    // 5. Initialize tenant database and seed default settings
    const tenantCtx = await getTenantDatabase(tenantId)
    await tenantCtx.models.Settings.create({
      tenantId,
      studioName: companyName,
      email: emailClean,
    })

    return created(res, {
      tenant: {
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
        slug: tenant.slug,
        databaseName: tenant.databaseName,
        status: tenant.status,
      },
      owner: {
        userId: ownerUser.userId,
        name: ownerUser.name,
        username: ownerUser.username,
        email: ownerUser.email,
        role: ownerUser.role,
      },
    }, 'Company tenant created successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/tenants
 * Platform list tenants (optional admin endpoint)
 */
const getTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.find().select('-__v').lean()
    return res.json({ success: true, data: tenants })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createTenant,
  getTenants,
}
