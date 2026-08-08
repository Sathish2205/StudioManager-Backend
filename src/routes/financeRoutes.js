'use strict'

const express = require('express')
const router = express.Router()
const { getFinanceOverview, getFinancePayments } = require('../controllers/financeController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.get('/', getFinanceOverview)
router.get('/payments', getFinancePayments)

module.exports = router
