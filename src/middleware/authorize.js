'use strict'

const { forbidden } = require('../utils/apiResponse')

/**
 * Role-Based Access Control (RBAC) Middleware
 * Usage: authorize('owner', 'admin', 'manager')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return forbidden(res, 'Access denied: User role not defined.')
    }

    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, `Access denied: Role '${req.user.role}' is not authorized to perform this action. Required: ${allowedRoles.join(', ')}`)
    }

    next()
  }
}

module.exports = { authorize }
