'use strict'

const mongoose = require('mongoose')
const { success, created, notFound, badRequest } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// Recalculate and update event's totalPaid and remainingAmount
const recalculateEventBalance = async (eventId, models, tenantId) => {
  const { Event, Payment } = models
  const payments = await Payment.find({ eventId, tenantId, paymentType: { $ne: 'Refund' } })
  const refunds = await Payment.find({ eventId, tenantId, paymentType: 'Refund' })
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalRefunds = refunds.reduce((sum, p) => sum + p.amount, 0)
  const net = totalPaid - totalRefunds

  const event = await Event.findOne({ _id: eventId, tenantId })
  if (!event) return
  event.totalPaid = net
  event.remainingAmount = Math.max(0, event.packageAmount - net)
  await event.save()
}

// POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const { Event, Client, Workflow } = req.tenant.models
    const { clientId, packageAmount = 0, advanceAmount = 0, clientName } = req.body

    let client = null

    // 1. Try finding client by ID if valid ObjectId
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      client = await Client.findOne({ _id: clientId, tenantId: req.user.tenantId })
    }

    // 2. Fallback: Auto-create Client document in tenant database if not found
    if (!client) {
      const nameClean = (clientName || 'Valued Client').trim()
      const parts = nameClean.split(' ')
      const firstName = parts[0] || 'Client'
      const lastName = parts.slice(1).join(' ') || ''

      client = await Client.create({
        tenantId: req.user.tenantId,
        firstName,
        lastName,
        phone: req.body.clientPhone || '+91 98765 43210',
        email: req.body.clientEmail || 'client@example.com',
        city: req.body.city || 'Bengaluru',
        status: 'active',
      })
    }

    const pkgAmt = Number(packageAmount) || 0
    const advAmt = Number(advanceAmount) || 0
    const remaining = Math.max(0, pkgAmt - advAmt)

    // 3. Create Event document
    const event = await Event.create({
      ...req.body,
      clientId: client._id,
      tenantId: req.user.tenantId,
      packageAmount: pkgAmt,
      advancePaid: advAmt,
      totalPaid: advAmt,
      remainingAmount: remaining,
      createdBy: req.user.userId,
    })

    // 4. Auto-generate workflow document for event
    await Workflow.create({
      tenantId: req.user.tenantId,
      eventId: event._id,
      clientName: `${client.firstName} ${client.lastName || ''}`.trim(),
      eventName: event.eventName,
      stage: 'Booking',
      status: 'In Progress',
      overallStatus: 'Booking',
      currentStageIndex: 0,
    })

    if (client.status === 'lead') {
      await Client.findOneAndUpdate({ _id: client._id, tenantId: req.user.tenantId }, { status: 'active' })
    }

    const populated = await Event.findOne({ _id: event._id, tenantId: req.user.tenantId })
      .populate('clientId', 'firstName lastName phone email')
      .lean()

    return created(res, populated, 'Event created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/events
const getEvents = async (req, res, next) => {
  try {
    const { Event } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['eventName', 'venue'])
    filter.tenantId = req.user.tenantId

    if (req.query.eventType) filter.eventType = req.query.eventType
    if (req.query.startDate || req.query.endDate) {
      filter.eventDate = {}
      if (req.query.startDate) filter.eventDate.$gte = new Date(req.query.startDate)
      if (req.query.endDate) filter.eventDate.$lte = new Date(req.query.endDate)
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('clientId', 'firstName lastName phone email')
        .populate('assignedPhotographers', 'name role avatar')
        .populate('assignedEditors', 'name role avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ])

    return success(res, events, 'Events fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/events/:id
const getEventById = async (req, res, next) => {
  try {
    const { Event, Payment, Workflow, Task } = req.tenant.models
    const event = await Event.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .populate('clientId', 'firstName lastName phone email alternatePhone address city state')
      .populate('assignedPhotographers', 'name role avatar phone email')
      .populate('assignedEditors', 'name role avatar phone email')
      .lean()

    if (!event) return notFound(res, 'Event not found')

    const [payments, workflows, tasks] = await Promise.all([
      Payment.find({ eventId: req.params.id, tenantId: req.user.tenantId }).sort({ paymentDate: -1 }).lean(),
      Workflow.find({ eventId: req.params.id, tenantId: req.user.tenantId }).lean(),
      Task.find({ eventId: req.params.id, tenantId: req.user.tenantId }).sort({ dueDate: 1 }).lean(),
    ])

    return success(res, { ...event, payments, workflows, tasks }, 'Event details fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const { Event } = req.tenant.models
    const event = await Event.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!event) return notFound(res, 'Event not found')

    Object.assign(event, req.body)

    if (req.body.packageAmount !== undefined) {
      event.remainingAmount = Math.max(0, req.body.packageAmount - event.totalPaid)
    }

    await event.save()
    return success(res, event, 'Event updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const { Event, Workflow, Task, Payment } = req.tenant.models
    const event = await Event.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!event) return notFound(res, 'Event not found')

    await Promise.all([
      Workflow.deleteMany({ eventId: req.params.id, tenantId: req.user.tenantId }),
      Task.deleteMany({ eventId: req.params.id, tenantId: req.user.tenantId }),
      Payment.deleteMany({ eventId: req.params.id, tenantId: req.user.tenantId }),
    ])

    return success(res, null, 'Event deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent, recalculateEventBalance }
