'use strict'

const express = require('express')
const router = express.Router()
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesDropdown,
  getEmployeeDashboardStats,
} = require('../controllers/employeeController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.get('/dropdown', getEmployeesDropdown)
router.get('/dashboard/stats', getEmployeeDashboardStats)

router.route('/')
  .get(getEmployees)
  .post(authorize('owner', 'admin', 'manager'), createEmployee)

router.route('/:id')
  .get(getEmployeeById)
  .put(authorize('owner', 'admin', 'manager'), updateEmployee)
  .delete(authorize('owner', 'admin'), deleteEmployee)

module.exports = router
