'use strict'

const express = require('express')
const router = express.Router()
const {
  applyLeave,
  getLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  deleteLeave,
} = require('../controllers/leaveController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

router.use(protect)

router.route('/')
  .get(getLeaves)
  .post(applyLeave)

router.route('/:id')
  .get(getLeaveById)
  .delete(requireRole('admin', 'manager'), deleteLeave)

router.put('/:id/approve', requireRole('admin', 'manager'), approveLeave)
router.put('/:id/reject', requireRole('admin', 'manager'), rejectLeave)

module.exports = router
