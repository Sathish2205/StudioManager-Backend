'use strict'

const Expense = require('../models/Expense')
const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, createdBy: req.user._id })
    return created(res, expense, 'Expense recorded successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['title', 'description'])

    if (req.query.category) filter.category = req.query.category
    if (req.query.startDate || req.query.endDate) {
      filter.expenseDate = {}
      if (req.query.startDate) filter.expenseDate.$gte = new Date(req.query.startDate)
      if (req.query.endDate) filter.expenseDate.$lte = new Date(req.query.endDate)
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('createdBy', 'name')
        .sort(sort)
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

// GET /api/expenses/:id
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('createdBy', 'name email').lean()
    if (!expense) return notFound(res, 'Expense not found')
    return success(res, expense, 'Expense fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean()
    if (!expense) return notFound(res, 'Expense not found')
    return success(res, expense, 'Expense updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id)
    if (!expense) return notFound(res, 'Expense not found')
    return success(res, null, 'Expense deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense }
