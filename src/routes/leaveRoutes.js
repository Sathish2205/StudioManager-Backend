'use strict'

const express = require('express')
const router = express.Router()
const { applyLeave, getLeaves, approveLeave, rejectLeave } = require('../controllers/leaveController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getLeaves)
  .post(applyLeave)

router.put('/:id/approve', authorize('owner', 'admin', 'manager'), approveLeave)
router.put('/:id/reject', authorize('owner', 'admin', 'manager'), rejectLeave)

module.exports = router
