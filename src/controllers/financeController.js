'use strict'

const Payment = require('../models/Payment')
const Expense = require('../models/Expense')
const { success } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

// GET /api/finance
const getFinanceOverview = async (req, res, next) => {
  try {
    const { year } = req.query
    const targetYear = parseInt(year) || new Date().getFullYear()

    // Monthly revenue & expenses for the year
    const [monthlyRevenue, monthlyExpenses] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            paymentDate: {
              $gte: new Date(`${targetYear}-01-01`),
              $lte: new Date(`${targetYear}-12-31T23:59:59`),
            },
            paymentType: { $ne: 'Refund' },
          },
        },
        {
          $group: {
            _id: { month: { $month: '$paymentDate' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),
      Expense.aggregate([
        {
          $match: {
            expenseDate: {
              $gte: new Date(`${targetYear}-01-01`),
              $lte: new Date(`${targetYear}-12-31T23:59:59`),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: '$expenseDate' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),
    ])

    // Fill all 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const revenueByMonth = months.map((month, i) => {
      const found = monthlyRevenue.find(r => r._id.month === i + 1)
      return { month, revenue: found?.total || 0, count: found?.count || 0 }
    })
    const expenseByMonth = months.map((month, i) => {
      const found = monthlyExpenses.find(e => e._id.month === i + 1)
      return { month, expenses: found?.total || 0, count: found?.count || 0 }
    })

    // Category breakdown for expenses
    const expenseCategories = await Expense.aggregate([
      {
        $match: {
          expenseDate: {
            $gte: new Date(`${targetYear}-01-01`),
            $lte: new Date(`${targetYear}-12-31T23:59:59`),
          },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])

    // Payment method breakdown
    const paymentMethodBreakdown = await Payment.aggregate([
      { $match: { paymentType: { $ne: 'Refund' } } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])

    const totalRevenue = revenueByMonth.reduce((s, r) => s + r.revenue, 0)
    const totalExpenses = expenseByMonth.reduce((s, e) => s + e.expenses, 0)

    return success(res, {
      year: targetYear,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      revenueByMonth,
      expenseByMonth,
      expenseCategories: expenseCategories.map(c => ({ category: c._id, total: c.total, count: c.count })),
      paymentMethodBreakdown: paymentMethodBreakdown.map(p => ({ method: p._id, total: p.total, count: p.count })),
    }, 'Finance overview fetched successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/finance/payments — paginated recent payments
const getFinancePayments = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const filter = {}
    if (req.query.startDate || req.query.endDate) {
      filter.paymentDate = {}
      if (req.query.startDate) filter.paymentDate.$gte = new Date(req.query.startDate)
      if (req.query.endDate) filter.paymentDate.$lte = new Date(req.query.endDate)
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('eventId', 'eventName eventType packageAmount remainingAmount')
        .populate('clientId', 'firstName lastName phone')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ])

    const totalAmount = await Payment.aggregate([
      { $match: { ...filter, paymentType: { $ne: 'Refund' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])

    return success(res, {
      payments,
      totalAmount: totalAmount[0]?.total || 0,
    }, 'Finance payments fetched', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

module.exports = { getFinanceOverview, getFinancePayments }
