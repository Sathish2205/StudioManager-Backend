'use strict'

const express = require('express')
const router = express.Router()
const { createExpense, getExpenses, deleteExpense } = require('../controllers/expenseController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getExpenses)
  .post(createExpense)

router.delete('/:id', authorize('owner', 'admin'), deleteExpense)

module.exports = router
