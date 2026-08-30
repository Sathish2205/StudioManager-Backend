'use strict'

const { verifyAccessToken } = require('../services/tokenService')
const { unauthorized } = require('../utils/apiResponse')

/**
 * Authentication Middleware
 * 1. Read JWT from Authorization: Bearer <token>
 * 2. Verify JWT signature & expiration
 * 3. Extract userId, tenantId, role
 * 4. Attach req.user = { userId, tenantId, role, email, username }
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Authentication required. No bearer token provided.')
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return unauthorized(res, 'Authentication token missing.')
    }

    let decoded
    try {
      decoded = verifyAccessToken(token)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return unauthorized(res, 'Token has expired. Please log in again.')
      }
      return unauthorized(res, 'Invalid authentication token.')
    }

    if (!decoded.tenantId || (!decoded.userId && !decoded.id)) {
      return unauthorized(res, 'Malformed token payload: missing tenant identity.')
    }

    req.user = {
      userId: decoded.userId || decoded.id,
      tenantId: decoded.tenantId,
      role: decoded.role || 'employee',
      email: decoded.email,
      username: decoded.username,
    }

    next()
  } catch (err) {
    next(err)
  }
}

module.exports = { authenticate }
