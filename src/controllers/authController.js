'use strict'

const MasterUser = require('../models/master/User')
const Tenant = require('../models/master/Tenant')
const { generateAccessToken, generateRefreshToken } = require('../services/tokenService')
const { success, unauthorized, badRequest, notFound } = require('../utils/apiResponse')

/**
 * POST /api/auth/login
 * Public enterprise login endpoint.
 * Automatic tenant resolution strictly via backend user lookup.
 */
const login = async (req, res, next) => {
  try {
    const { username, email, password } = req.body
    const loginIdentifier = (username || email || '').trim().toLowerCase()

    if (!loginIdentifier || !password) {
      return badRequest(res, 'Please provide email/username and password.')
    }

    // 1. Find user in Master Database
    const user = await MasterUser.findOne({
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }],
    })

    if (!user) {
      return unauthorized(res, 'Invalid email/username or password.')
    }

    // 2. Verify password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return unauthorized(res, 'Invalid email/username or password.')
    }

    // 3. Verify user status
    if (user.status !== 'active') {
      return unauthorized(res, 'Your user account has been deactivated. Please contact support.')
    }

    // 4. Resolve Tenant from Master Database
    const tenant = await Tenant.findOne({ tenantId: user.tenantId }).lean()
    if (!tenant) {
      return notFound(res, 'Tenant organization not found.')
    }

    if (tenant.status !== 'active') {
      return unauthorized(res, `Company account "${tenant.companyName}" is ${tenant.status}. Please contact billing.`)
    }

    // 5. Generate JWT tokens containing tenant context
    const tokenPayload = {
      userId: user.userId,
      tenantId: tenant.tenantId,
      role: user.role,
      email: user.email,
      username: user.username,
    }

    const token = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // 6. Return response envelope
    return success(res, {
      token,
      refreshToken,
      user: {
        userId: user.userId,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tenant: {
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
        slug: tenant.slug,
      },
    }, 'Authentication successful')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 * Protected endpoint returning current user & tenant profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await MasterUser.findOne({ userId: req.user.userId }).select('-passwordHash').lean()
    if (!user) {
      return notFound(res, 'User profile not found.')
    }

    const tenant = await Tenant.findOne({ tenantId: req.user.tenantId }).lean()

    return success(res, {
      user: {
        userId: user.userId,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      tenant: {
        tenantId: tenant.tenantId,
        companyName: tenant.companyName,
        slug: tenant.slug,
        status: tenant.status,
      },
    }, 'User profile retrieved successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/logout
 * Public/Protected logout endpoint.
 */
const logout = async (req, res, next) => {
  try {
    return success(res, null, 'Logged out successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  login,
  getMe,
  logout,
}
