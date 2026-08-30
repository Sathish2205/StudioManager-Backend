'use strict'

const express = require('express')
const router = express.Router()
const { getDashboardStats } = require('../controllers/dashboardController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')

router.use(authenticate, tenant)
router.get('/', getDashboardStats)

module.exports = router
