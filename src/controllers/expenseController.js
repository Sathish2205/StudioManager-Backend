'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const createExpense = async (req, res, next) => {
  try {
    const { Expense } = req.tenant.models
    const expense = await Expense.create({
      ...req.body,
      tenantId: req.user.tenantId,
    })
    return created(res, expense, 'Expense recorded successfully')
  } catch (err) {
    next(err)
  }
}

const getExpenses = async (req, res, next) => {
  try {
    const { Expense } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.category) filter.category = req.query.category

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort(sort || { expenseDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ])

    return success(res, expenses, 'Expenses fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

const deleteExpense = async (req, res, next) => {
  try {
    const { Expense } = req.tenant.models
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!expense) return notFound(res, 'Expense record not found')
    return success(res, null, 'Expense deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createExpense, getExpenses, deleteExpense }
