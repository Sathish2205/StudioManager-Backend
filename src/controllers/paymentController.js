'use strict'

const Payment = require('../models/Payment')
const Event = require('../models/Event')
const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')
const { recalculateEventBalance } = require('./eventController')

// POST /api/payments
const createPayment = async (req, res, next) => {
  try {
    const { eventId, clientId } = req.body

    // Verify event exists
    const event = await Event.findById(eventId)
    if (!event) return notFound(res, 'Event not found')

    const payment = await Payment.create({
      ...req.body,
      receivedBy: req.user._id,
    })

    // Recalculate event balance after payment
    await recalculateEventBalance(eventId)

    const populated = await Payment.findById(payment._id)
      .populate('eventId', 'eventName packageAmount remainingAmount totalPaid')
      .populate('clientId', 'firstName lastName phone')
      .populate('receivedBy', 'name')
      .lean()

    return created(res, populated, 'Payment recorded successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/payments
const getPayments = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = {}

    if (req.query.eventId) filter.eventId = req.query.eventId
    if (req.query.clientId) filter.clientId = req.query.clientId
    if (req.query.paymentType) filter.paymentType = req.query.paymentType
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod
    if (req.query.startDate || req.query.endDate) {
      filter.paymentDate = {}
      if (req.query.startDate) filter.paymentDate.$gte = new Date(req.query.startDate)
      if (req.query.endDate) filter.paymentDate.$lte = new Date(req.query.endDate)
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('eventId', 'eventName eventType packageAmount remainingAmount')
        .populate('clientId', 'firstName lastName phone')
        .populate('receivedBy', 'name')
        .sort(sort)
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

// GET /api/payments/:id
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('eventId', 'eventName eventType packageAmount remainingAmount totalPaid')
      .populate('clientId', 'firstName lastName phone email')
      .populate('receivedBy', 'name email')
      .lean()

    if (!payment) return notFound(res, 'Payment not found')
    return success(res, payment, 'Payment fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/payments/:id
const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
    if (!payment) return notFound(res, 'Payment not found')

    const { eventId } = payment

    Object.assign(payment, req.body)
    await payment.save()

    // Recalculate after update
    await recalculateEventBalance(eventId)

    const updated = await Payment.findById(req.params.id)
      .populate('eventId', 'eventName packageAmount remainingAmount totalPaid')
      .populate('clientId', 'firstName lastName phone')
      .lean()

    return success(res, updated, 'Payment updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/payments/:id
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id)
    if (!payment) return notFound(res, 'Payment not found')

    // Recalculate after deletion
    await recalculateEventBalance(payment.eventId)

    return success(res, null, 'Payment deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createPayment, getPayments, getPaymentById, updatePayment, deletePayment }
