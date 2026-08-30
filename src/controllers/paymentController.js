'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const createPayment = async (req, res, next) => {
  try {
    const { Payment, Event, Invoice } = req.tenant.models
    const payment = await Payment.create({
      ...req.body,
      tenantId: req.user.tenantId,
      paymentDate: req.body.paymentDate || new Date(),
    })

    // Recalculate event balance if linked
    if (req.body.eventId) {
      const payments = await Payment.find({ eventId: req.body.eventId, tenantId: req.user.tenantId })
      const totalPaid = payments.reduce((sum, p) => sum + (p.paymentType !== 'Refund' ? p.amount : -p.amount), 0)
      const event = await Event.findOne({ _id: req.body.eventId, tenantId: req.user.tenantId })
      if (event) {
        event.totalPaid = totalPaid
        event.remainingAmount = Math.max(0, event.packageAmount - totalPaid)
        await event.save()
      }
    }

    return created(res, payment, 'Payment recorded successfully')
  } catch (err) {
    next(err)
  }
}

const getPayments = async (req, res, next) => {
  try {
    const { Payment } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.clientId) filter.clientId = req.query.clientId
    if (req.query.eventId) filter.eventId = req.query.eventId
    if (req.query.invoiceId) filter.invoiceId = req.query.invoiceId

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort(sort || { paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ])

    return success(res, payments, 'Payments fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

const deletePayment = async (req, res, next) => {
  try {
    const { Payment } = req.tenant.models
    const payment = await Payment.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!payment) return notFound(res, 'Payment record not found')
    return success(res, null, 'Payment deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createPayment, getPayments, deletePayment }
