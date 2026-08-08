'use strict'

const Client = require('../models/Client')
const Event = require('../models/Event')
const Payment = require('../models/Payment')
const Expense = require('../models/Expense')
const Workflow = require('../models/Workflow')
const Task = require('../models/Task')
const { success } = require('../utils/apiResponse')

// GET /api/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [
      totalClients,
      totalEvents,
      upcomingEventsCount,
      completedEventsCount,
      cancelledEventsCount,
      revenueData,
      expensesData,
      pendingPaymentsData,
      recentClients,
      recentPayments,
      upcomingEvents,
      eventStatusCounts,
      workflowStatusCounts,
      taskStatusCounts,
      monthlyRevenue,
      monthlyExpenses,
    ] = await Promise.all([
      // Core counts
      Client.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ eventDate: { $gte: now, $lte: next30Days }, status: { $nin: ['Cancelled', 'Completed'] } }),
      Event.countDocuments({ status: 'Completed' }),
      Event.countDocuments({ status: 'Cancelled' }),

      // Total revenue (sum of all non-refund payments)
      Payment.aggregate([
        { $match: { paymentType: { $ne: 'Refund' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Total expenses
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Pending payments (events with remainingAmount > 0)
      Event.aggregate([
        { $match: { remainingAmount: { $gt: 0 }, status: { $nin: ['Cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$remainingAmount' }, count: { $sum: 1 } } },
      ]),

      // Recent 5 clients
      Client.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName phone status createdAt').lean(),

      // Recent 5 payments
      Payment.find().sort({ paymentDate: -1 }).limit(5)
        .populate('eventId', 'eventName')
        .populate('clientId', 'firstName lastName')
        .lean(),

      // Upcoming events (next 30 days)
      Event.find({
        eventDate: { $gte: now, $lte: next30Days },
        status: { $nin: ['Cancelled'] },
      })
        .populate('clientId', 'firstName lastName phone')
        .sort({ eventDate: 1 })
        .limit(10)
        .lean(),

      // Event status distribution
      Event.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Workflow status distribution
      Workflow.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Task status distribution
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Monthly revenue for current year
      Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: new Date(`${now.getFullYear()}-01-01`) },
            paymentType: { $ne: 'Refund' },
          },
        },
        {
          $group: {
            _id: { month: { $month: '$paymentDate' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),

      // Monthly expenses for current year
      Expense.aggregate([
        { $match: { expenseDate: { $gte: new Date(`${now.getFullYear()}-01-01`) } } },
        {
          $group: {
            _id: { month: { $month: '$expenseDate' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.month': 1 } },
      ]),
    ])

    const totalRevenue = revenueData[0]?.total || 0
    const totalExpenses = expensesData[0]?.total || 0
    const pendingPayments = pendingPaymentsData[0]?.total || 0
    const pendingPaymentsCount = pendingPaymentsData[0]?.count || 0
    const netProfit = totalRevenue - totalExpenses

    // Build monthly chart data (12 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyChart = months.map((month, i) => {
      const rev = monthlyRevenue.find(r => r._id.month === i + 1)
      const exp = monthlyExpenses.find(e => e._id.month === i + 1)
      return {
        month,
        revenue: rev?.total || 0,
        expenses: exp?.total || 0,
        profit: (rev?.total || 0) - (exp?.total || 0),
      }
    })

    // Event type distribution
    const eventTypeData = await Event.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    return success(res, {
      // Core KPIs
      totalClients,
      totalEvents,
      upcomingEvents: upcomingEventsCount,
      completedEvents: completedEventsCount,
      cancelledEvents: cancelledEventsCount,
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingPayments,
      pendingPaymentsCount,

      // Chart data
      monthlyChart,

      // Status distributions
      eventStatusCounts: eventStatusCounts.map(e => ({ status: e._id, count: e.count })),
      workflowStatusCounts: workflowStatusCounts.map(w => ({ status: w._id, count: w.count })),
      taskStatusCounts: taskStatusCounts.map(t => ({ status: t._id, count: t.count })),
      eventTypeDistribution: eventTypeData.map(e => ({ type: e._id, count: e.count })),

      // Recent activity
      recentClients,
      recentPayments,
      upcomingEventsList: upcomingEvents,
    }, 'Dashboard data fetched successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { getDashboard }
