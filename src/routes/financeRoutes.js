'use strict'

const express = require('express')
const router = express.Router()
const { getFinanceOverview } = require('../controllers/financeController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')

router.use(authenticate, tenant)
router.get('/overview', getFinanceOverview)

module.exports = router
