'use strict'

const express = require('express')
const router = express.Router()
const { createPayment, getPayments, deletePayment } = require('../controllers/paymentController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getPayments)
  .post(createPayment)

router.delete('/:id', authorize('owner', 'admin'), deletePayment)

module.exports = router
