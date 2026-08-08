'use strict'

const express = require('express')
const router = express.Router()
const { register, login, getMe, updateProfile, changePassword, logout } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { registerRules, loginRules, updateProfileRules, changePasswordRules } = require('../validators/authValidator')

router.post('/register', registerRules, validate, register)
router.post('/login', loginRules, validate, login)
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfileRules, validate, updateProfile)
router.put('/change-password', protect, changePasswordRules, validate, changePassword)
router.post('/logout', protect, logout)

module.exports = router
