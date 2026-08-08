'use strict'

const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config/env')
const { unauthorized } = require('../utils/apiResponse')
const User = require('../models/User')

/**
 * Protect route — verify JWT from Authorization: Bearer <token>.
 * Attaches the full user document (minus password) to req.user.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided. Please log in.')
    }

    const token = authHeader.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return unauthorized(res, 'Token has expired. Please log in again.')
      }
      return unauthorized(res, 'Invalid token. Please log in.')
    }

    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return unauthorized(res, 'User not found. Token invalid.')
    }
    if (!user.isActive) {
      return unauthorized(res, 'Account is deactivated. Contact support.')
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

module.exports = { protect }
