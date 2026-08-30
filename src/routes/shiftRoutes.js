'use strict'

const express = require('express')
const router = express.Router()
const { createShift, getShifts, updateShift, deleteShift } = require('../controllers/shiftController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getShifts)
  .post(authorize('owner', 'admin', 'manager'), createShift)

router.route('/:id')
  .put(authorize('owner', 'admin', 'manager'), updateShift)
  .delete(authorize('owner', 'admin'), deleteShift)

module.exports = router
