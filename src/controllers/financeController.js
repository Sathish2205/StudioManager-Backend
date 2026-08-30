'use strict'

const { success } = require('../utils/apiResponse')

const getFinanceOverview = async (req, res, next) => {
  try {
    const { Payment, Expense, Invoice } = req.tenant.models
    const filter = { tenantId: req.user.tenantId }

    const [payments, expenses, invoices] = await Promise.all([
      Payment.find(filter).lean(),
      Expense.find(filter).lean(),
      Invoice.find(filter).lean(),
    ])

    const totalCollected = payments.reduce((sum, p) => sum + (p.paymentType !== 'Refund' ? p.amount : -p.amount), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalRevenue = invoices.reduce((sum, i) => sum + i.grandTotal, 0)
    const pendingBalance = invoices.reduce((sum, i) => sum + i.balance, 0)

    const overview = {
      totalCollected,
      totalExpenses,
      totalRevenue,
      pendingBalance,
      netProfit: totalCollected - totalExpenses,
    }

    return success(res, { overview, recentPayments: payments.slice(-5) }, 'Finance overview retrieved')
  } catch (err) {
    next(err)
  }
}

module.exports = { getFinanceOverview }
