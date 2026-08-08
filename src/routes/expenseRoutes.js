'use strict'

const express = require('express')
const router = express.Router()
const { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense } = require('../controllers/expenseController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { createExpenseRules, updateExpenseRules } = require('../validators/expenseValidator')

router.use(protect)

router.route('/')
  .get(getExpenses)
  .post(createExpenseRules, validate, createExpense)

router.route('/:id')
  .get(getExpenseById)
  .put(updateExpenseRules, validate, updateExpense)
  .delete(requireRole('admin', 'manager'), deleteExpense)

module.exports = router
