'use strict'

const express = require('express')
const router = express.Router()
const { createPayment, getPayments, getPaymentById, updatePayment, deletePayment } = require('../controllers/paymentController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { createPaymentRules, updatePaymentRules } = require('../validators/paymentValidator')

router.use(protect)

router.route('/')
  .get(getPayments)
  .post(createPaymentRules, validate, createPayment)

router.route('/:id')
  .get(getPaymentById)
  .put(updatePaymentRules, validate, updatePayment)
  .delete(requireRole('admin', 'manager'), deletePayment)

module.exports = router
