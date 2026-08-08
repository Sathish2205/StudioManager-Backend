'use strict'

const { body } = require('express-validator')

const PAYMENT_TYPES = ['Advance', 'Installment', 'Final Payment', 'Refund']
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque', 'Online']

const createPaymentRules = [
  body('eventId').notEmpty().withMessage('Event ID is required').isMongoId().withMessage('Invalid event ID'),
  body('clientId').notEmpty().withMessage('Client ID is required').isMongoId().withMessage('Invalid client ID'),
  body('amount').notEmpty().withMessage('Amount is required').isNumeric().withMessage('Amount must be a number').custom(v => v > 0).withMessage('Amount must be greater than 0'),
  body('paymentDate').optional().isISO8601().withMessage('Invalid payment date'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required').isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  body('paymentType').notEmpty().withMessage('Payment type is required').isIn(PAYMENT_TYPES).withMessage('Invalid payment type'),
]

const updatePaymentRules = [
  body('amount').optional().isNumeric().withMessage('Amount must be a number').custom(v => v > 0).withMessage('Amount must be greater than 0'),
  body('paymentDate').optional().isISO8601().withMessage('Invalid payment date'),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),
  body('paymentType').optional().isIn(PAYMENT_TYPES).withMessage('Invalid payment type'),
]

module.exports = { createPaymentRules, updatePaymentRules }
