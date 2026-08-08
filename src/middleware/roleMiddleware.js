'use strict'

const { forbidden } = require('../utils/apiResponse')

/**
 * Role-based access control middleware factory.
 * Usage: router.delete('/:id', protect, requireRole('admin', 'manager'), handler)
 *
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return forbidden(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user?.role || 'none'}`
      )
    }
    next()
  }
}

module.exports = { requireRole }
