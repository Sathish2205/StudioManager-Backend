'use strict'

const { body } = require('express-validator')

const EXPENSE_CATEGORIES = [
  'Equipment', 'Travel', 'Salary', 'Office', 'Marketing',
  'Album Printing', 'Editing', 'Meals', 'Utilities', 'Other',
]

const createExpenseRules = [
  body('title').trim().notEmpty().withMessage('Expense title is required').isLength({ max: 200 }),
  body('category').notEmpty().withMessage('Category is required').isIn(EXPENSE_CATEGORIES).withMessage('Invalid category'),
  body('amount').notEmpty().withMessage('Amount is required').isNumeric().withMessage('Amount must be a number').custom(v => v >= 0).withMessage('Amount cannot be negative'),
  body('expenseDate').optional().isISO8601().withMessage('Invalid expense date'),
  body('paymentMethod').optional().isIn(['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque']).withMessage('Invalid payment method'),
]

const updateExpenseRules = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('category').optional().isIn(EXPENSE_CATEGORIES).withMessage('Invalid category'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number').custom(v => v >= 0).withMessage('Amount cannot be negative'),
  body('expenseDate').optional().isISO8601().withMessage('Invalid expense date'),
]

module.exports = { createExpenseRules, updateExpenseRules }
