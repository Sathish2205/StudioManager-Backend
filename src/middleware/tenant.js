'use strict'

const { getTenantDatabase } = require('../services/tenantDatabase')
const { forbidden, notFound } = require('../utils/apiResponse')

/**
 * Tenant Resolution Middleware
 * CRITICAL SECURITY REQUIREMENT:
 * Never trust tenantId supplied by frontend in body, query, params, or headers.
 * Derive tenant context strictly from req.user.tenantId extracted from verified JWT.
 */
const tenant = async (req, res, next) => {
  try {
    if (!req.user || !req.user.tenantId) {
      return forbidden(res, 'Access denied: User tenant identity missing.')
    }

    const tenantId = req.user.tenantId

    try {
      const tenantContext = await getTenantDatabase(tenantId)
      req.tenant = tenantContext
      next()
    } catch (err) {
      if (err.statusCode === 404) {
        return notFound(res, 'Tenant account not found.')
      }
      if (err.statusCode === 403) {
        return forbidden(res, `Tenant access denied: ${err.message}`)
      }
      console.error(`❌ Tenant database resolution failed for [${tenantId}]:`, err.message)
      return forbidden(res, 'Unable to establish secure tenant database connection.')
    }
  } catch (err) {
    next(err)
  }
}

module.exports = { tenant }
