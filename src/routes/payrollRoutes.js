'use strict'

const express = require('express')
const router = express.Router()
const { generatePayroll, getPayrolls, updatePayrollStatus } = require('../controllers/payrollController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getPayrolls)
  .post(authorize('owner', 'admin', 'manager'), generatePayroll)

router.put('/:id/status', authorize('owner', 'admin', 'manager'), updatePayrollStatus)

module.exports = router
