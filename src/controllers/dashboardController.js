'use strict'

const { success } = require('../utils/apiResponse')

const getDashboardStats = async (req, res, next) => {
  try {
    const { Client, Event, Payment, Task } = req.tenant.models
    const filter = { tenantId: req.user.tenantId }

    const [totalClients, totalEvents, payments, pendingTasks, recentEvents, recentClients] = await Promise.all([
      Client.countDocuments(filter),
      Event.countDocuments(filter),
      Payment.find(filter).lean(),
      Task.countDocuments({ ...filter, status: { $ne: 'Completed' } }),
      Event.find(filter).sort({ createdAt: -1 }).limit(5).lean(),
      Client.find(filter).sort({ createdAt: -1 }).limit(5).lean(),
    ])

    const totalCollected = payments.reduce((sum, p) => sum + (p.paymentType !== 'Refund' ? p.amount : -p.amount), 0)

    return success(res, {
      totalClients,
      totalEvents,
      totalCollected,
      pendingTasks,
      recentEvents,
      recentClients,
    }, 'Dashboard metrics fetched')
  } catch (err) {
    next(err)
  }
}

module.exports = { getDashboardStats }
