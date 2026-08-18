'use strict'

const Event = require('../models/Event')
const Client = require('../models/Client')
const Payment = require('../models/Payment')
const Workflow = require('../models/Workflow')
const Task = require('../models/Task')
const { success, created, notFound, badRequest } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// Recalculate and update event's totalPaid and remainingAmount
const recalculateEventBalance = async (eventId) => {
  const payments = await Payment.find({ eventId, paymentType: { $ne: 'Refund' } })
  const refunds = await Payment.find({ eventId, paymentType: 'Refund' })
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalRefunds = refunds.reduce((sum, p) => sum + p.amount, 0)
  const net = totalPaid - totalRefunds

  const event = await Event.findById(eventId)
  if (!event) return
  event.totalPaid = net
  event.remainingAmount = Math.max(0, event.packageAmount - net)
  await event.save()
}

// POST /api/events
const createEvent = async (req, res, next) => {
  try {
    const { clientId, packageAmount, advanceAmount } = req.body

    // Validate client exists
    const client = await Client.findById(clientId)
    if (!client) return badRequest(res, 'Client not found')

    // Validate event date is not in the past (for new bookings)
    if (req.body.eventDate && new Date(req.body.eventDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
      // Allow past dates — studios may backfill historical events
    }

    const remaining = packageAmount - (advanceAmount || 0)

    const event = await Event.create({
      ...req.body,
      totalPaid: advanceAmount || 0,
      remainingAmount: remaining,
      createdBy: req.user._id,
    })

    // Auto-generate workflow document for the event
    await Workflow.create({
      eventId: event._id,
      stage: 'Booking',
      status: 'In Progress',
      overallStatus: 'Booking',
      currentStageIndex: 0,
      order: 0,
    })

    // Update client status to active
    if (client.status === 'lead') {
      await Client.findByIdAndUpdate(clientId, { status: 'active' })
    }

    const populated = await Event.findById(event._id)
      .populate('clientId', 'firstName lastName phone email')
      .populate('assignedPhotographers', 'name role')
      .populate('assignedEditors', 'name role')
      .lean()

    return created(res, { success: true, id: event._id, data: populated }, 'Event created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/events
const getEvents = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['eventName', 'venue'])

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
    const event = await Event.findById(req.params.id)
      .populate('clientId', 'firstName lastName phone email alternatePhone address city state')
      .populate('assignedPhotographers', 'name role avatar phone email')
      .populate('assignedEditors', 'name role avatar phone email')
      .populate('createdBy', 'name email')
      .lean()

    if (!event) return notFound(res, 'Event not found')

    // Fetch related data
    const [payments, workflows, tasks] = await Promise.all([
      Payment.find({ eventId: req.params.id }).sort({ paymentDate: -1 }).lean(),
      Workflow.find({ eventId: req.params.id }).sort({ order: 1 }).populate('assignedTo', 'name role').lean(),
      Task.find({ eventId: req.params.id }).populate('assignedTo', 'name role').sort({ dueDate: 1 }).lean(),
    ])

    return success(res, { ...event, payments, workflows, tasks }, 'Event details fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/events/:id
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return notFound(res, 'Event not found')

    Object.assign(event, req.body)

    // Recalculate remaining amount if packageAmount changed
    if (req.body.packageAmount !== undefined) {
      event.remainingAmount = Math.max(0, event.packageAmount - event.totalPaid)
    }

    await event.save()

    const updated = await Event.findById(event._id)
      .populate('clientId', 'firstName lastName phone email')
      .populate('assignedPhotographers', 'name role')
      .populate('assignedEditors', 'name role')
      .lean()

    return success(res, updated, 'Event updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/events/:id
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id)
    if (!event) return notFound(res, 'Event not found')

    // Cascade delete related data
    await Promise.all([
      Payment.deleteMany({ eventId: req.params.id }),
      Workflow.deleteMany({ eventId: req.params.id }),
      Task.deleteMany({ eventId: req.params.id }),
    ])

    return success(res, null, 'Event deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent, recalculateEventBalance }
