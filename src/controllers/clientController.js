'use strict'

const Client = require('../models/Client')
const Event = require('../models/Event')
const Payment = require('../models/Payment')
const { success, created, notFound, badRequest } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// POST /api/clients
const createClient = async (req, res, next) => {
  try {
    const clientData = { ...req.body, createdBy: req.user._id }
    const client = await Client.create(clientData)
    return created(res, client, 'Client created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/clients
const getClients = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['firstName', 'lastName', 'phone', 'email'])

    // Additional city/state filter
    if (req.query.city) filter.city = { $regex: req.query.city, $options: 'i' }

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Client.countDocuments(filter),
    ])

    return success(res, clients, 'Clients fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/clients/:id
const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('referredBy', 'firstName lastName phone')
      .lean()

    if (!client) return notFound(res, 'Client not found')

    // Fetch client history
    const events = await Event.find({ clientId: req.params.id })
      .select('eventName eventType eventDate status packageAmount remainingAmount venue')
      .sort({ eventDate: -1 })
      .lean()

    const payments = await Payment.find({ clientId: req.params.id })
      .select('amount paymentType paymentDate paymentMethod')
      .sort({ paymentDate: -1 })
      .lean()

    const totalSpent = payments.reduce((sum, p) => sum + (p.paymentType !== 'Refund' ? p.amount : -p.amount), 0)
    const upcomingEvents = events.filter(e => new Date(e.eventDate) > new Date() && e.status !== 'Cancelled')
    const referrals = await Client.countDocuments({ referredBy: req.params.id })

    return success(res, {
      ...client,
      events,
      payments,
      totalSpent,
      upcomingEvents,
      referralsCount: referrals,
    }, 'Client details fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/clients/:id
const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean()

    if (!client) return notFound(res, 'Client not found')
    return success(res, client, 'Client updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/clients/:id
const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id)
    if (!client) return notFound(res, 'Client not found')
    return success(res, null, 'Client deleted successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/clients/dropdown — lightweight list for form dropdowns
const getClientsDropdown = async (req, res, next) => {
  try {
    const clients = await Client.find({ status: { $ne: 'inactive' } })
      .select('firstName lastName phone')
      .sort({ firstName: 1 })
      .lean()

    const mapped = clients.map(c => ({
      id: c._id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      mobile: c.phone,
      label: `${c.firstName} ${c.lastName}`.trim() + (c.phone ? ` (${c.phone})` : ''),
    }))

    return success(res, mapped, 'Clients dropdown fetched')
  } catch (err) {
    next(err)
  }
}

module.exports = { createClient, getClients, getClientById, updateClient, deleteClient, getClientsDropdown }
