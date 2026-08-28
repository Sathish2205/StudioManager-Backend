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
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

router.use(protect)

router.get('/dropdown', getEmployeesDropdown)
router.get('/dashboard/stats', getEmployeeDashboardStats)

router.route('/')
  .get(getEmployees)
  .post(requireRole('admin', 'manager'), createEmployee)

router.route('/:id')
  .get(getEmployeeById)
  .put(requireRole('admin', 'manager'), updateEmployee)
  .delete(requireRole('admin', 'manager'), deleteEmployee)

module.exports = router
