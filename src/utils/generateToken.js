'use strict'

const jwt = require('jsonwebtoken')
const { jwtSecret, jwtExpiresIn } = require('../config/env')

/**
 * Generate a signed JWT for the given user document.
 * @param {Object} user - Mongoose user document
 * @returns {string} signed JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  )
}

module.exports = generateToken
