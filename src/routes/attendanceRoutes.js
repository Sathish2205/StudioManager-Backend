'use strict'

const express = require('express')
const router = express.Router()
const { getTodayAttendance, getAttendanceLog, checkIn, checkOut, adjustAttendance } = require('../controllers/attendanceController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.get('/today', getTodayAttendance)
router.get('/log', getAttendanceLog)
router.post('/checkin', checkIn)
router.post('/checkout', checkOut)
router.put('/adjust/:id', authorize('owner', 'admin', 'manager'), adjustAttendance)

module.exports = router
