'use strict'

const User = require('../models/User')
const generateToken = require('../utils/generateToken')
const { success, created, unauthorized, notFound, badRequest } = require('../utils/apiResponse')

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body

    const exists = await User.findOne({ email })
    if (exists) {
      return badRequest(res, 'An account with this email already exists.')
    }

    const user = await User.create({ name, email, password, phone, role: role || 'staff' })
    const token = generateToken(user)

    return created(res, { token, user }, 'Account created successfully')
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return unauthorized(res, 'Invalid email or password')
    }
    if (!user.isActive) {
      return unauthorized(res, 'Account is deactivated. Please contact your administrator.')
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return unauthorized(res, 'Invalid email or password')
    }

    const token = generateToken(user)
    const userObj = user.toJSON()
    delete userObj.password

    return success(res, { token, user: userObj }, 'Login successful')
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    return success(res, req.user, 'Profile fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body
    const update = {}
    if (name !== undefined) update.name = name
    if (phone !== undefined) update.phone = phone
    if (avatar !== undefined) update.avatar = avatar

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      runValidators: true,
    })
    if (!user) return notFound(res, 'User not found')

    return success(res, user, 'Profile updated successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user._id).select('+password')
    if (!user) return notFound(res, 'User not found')

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return badRequest(res, 'Current password is incorrect')
    }

    user.password = newPassword
    await user.save()

    return success(res, null, 'Password changed successfully')
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  // JWT is stateless. Client discards the token. Optionally: add to blocklist.
  return success(res, null, 'Logged out successfully')
}

module.exports = { register, login, getMe, updateProfile, changePassword, logout }
