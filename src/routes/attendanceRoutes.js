'use strict'

const express = require('express')
const router = express.Router()
const {
  checkIn, checkOut, startBreak, endBreak,
  getTodayAttendance, getEmployeeAttendance, getMonthlyAttendance,
  adjustAttendance, getEmployeeCurrentStatus,
} = require('../controllers/attendanceController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

router.use(protect)

// Employee actions
router.post('/check-in', checkIn)
router.post('/check-out', checkOut)
router.post('/break/start', startBreak)
router.post('/break/end', endBreak)

// Summary & listing
router.get('/today', getTodayAttendance)
router.get('/employee/:id', getEmployeeAttendance)
router.get('/employee/:id/status', getEmployeeCurrentStatus)
router.get('/employee/:id/monthly/:year/:month', getMonthlyAttendance)

// Manual adjustment (admin/manager only)
router.put('/:id/adjust', requireRole('admin', 'manager'), adjustAttendance)

module.exports = router
