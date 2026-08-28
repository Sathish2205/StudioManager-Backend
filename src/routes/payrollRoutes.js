'use strict'

const express = require('express')
const router = express.Router()
const {
  generatePayroll,
  getPayrolls,
  getPayrollById,
  updatePayrollStatus,
} = require('../controllers/payrollController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

router.use(protect)

router.route('/')
  .get(getPayrolls)
  .post(requireRole('admin', 'manager', 'accountant'), generatePayroll)

router.route('/:id')
  .get(getPayrollById)
  .put(requireRole('admin', 'manager', 'accountant'), updatePayrollStatus)

module.exports = router
