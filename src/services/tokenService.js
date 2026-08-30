'use strict'

const jwt = require('jsonwebtoken')
const { jwtSecret, jwtExpiresIn, refreshSecret, refreshExpiresIn } = require('../config/env')

/**
 * Generate Access Token containing trusted identity info (userId, tenantId, role)
 */
const generateAccessToken = (payload) => {
  const tokenPayload = {
    userId: payload.userId || payload._id,
    tenantId: payload.tenantId,
    role: payload.role,
    email: payload.email,
    username: payload.username,
  }
  return jwt.sign(tokenPayload, jwtSecret, { expiresIn: jwtExpiresIn })
}

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (payload) => {
  const tokenPayload = {
    userId: payload.userId || payload._id,
    tenantId: payload.tenantId,
  }
  return jwt.sign(tokenPayload, refreshSecret, { expiresIn: refreshExpiresIn })
}

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtSecret)
}

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, refreshSecret)
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
}
