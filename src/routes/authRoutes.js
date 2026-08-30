'use strict'

const express = require('express')
const router = express.Router()
const { login, getMe, logout } = require('../controllers/authController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')

router.post('/login', login)
router.post('/logout', logout)
router.get('/me', authenticate, tenant, getMe)

module.exports = router
