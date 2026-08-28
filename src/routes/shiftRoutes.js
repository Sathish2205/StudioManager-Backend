'use strict'

const express = require('express')
const router = express.Router()
const { createShift, getShifts, getActiveShifts, getShiftById, updateShift, deleteShift } = require('../controllers/shiftController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

router.use(protect)

router.get('/active', getActiveShifts)

router.route('/')
  .get(getShifts)
  .post(requireRole('admin', 'manager'), createShift)

router.route('/:id')
  .get(getShiftById)
  .put(requireRole('admin', 'manager'), updateShift)
  .delete(requireRole('admin', 'manager'), deleteShift)

module.exports = router
