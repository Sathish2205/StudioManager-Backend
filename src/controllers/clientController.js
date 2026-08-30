'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// POST /api/clients
const createClient = async (req, res, next) => {
  try {
    const { Client } = req.tenant.models
    const clientData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.userId,
    }
    const client = await Client.create(clientData)
    return created(res, client, 'Client created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/clients
const getClients = async (req, res, next) => {
  try {
    const { Client } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['firstName', 'lastName', 'phone', 'email'])
    filter.tenantId = req.user.tenantId

    if (req.query.city) filter.city = { $regex: req.query.city, $options: 'i' }

    const [clients, total] = await Promise.all([
      Client.find(filter)
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
    const { Client, Event, Payment } = req.tenant.models
    const client = await Client.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).lean()

    if (!client) return notFound(res, 'Client not found')

    const events = await Event.find({ clientId: req.params.id, tenantId: req.user.tenantId })
      .select('eventName eventType eventDate status packageAmount remainingAmount venue')
      .sort({ eventDate: -1 })
      .lean()

    const payments = await Payment.find({ clientId: req.params.id, tenantId: req.user.tenantId })
      .select('amount paymentType paymentDate paymentMethod')
      .sort({ paymentDate: -1 })
      .lean()

    const totalSpent = payments.reduce((sum, p) => sum + (p.paymentType !== 'Refund' ? p.amount : -p.amount), 0)
    const upcomingEvents = events.filter(e => new Date(e.eventDate) > new Date() && e.status !== 'Cancelled')
    const referrals = await Client.countDocuments({ referredBy: req.params.id, tenantId: req.user.tenantId })

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
    const { Client } = req.tenant.models
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()

    if (!client) return notFound(res, 'Client not found')
    return success(res, client, 'Client updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/clients/:id
const deleteClient = async (req, res, next) => {
  try {
    const { Client } = req.tenant.models
    const client = await Client.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!client) return notFound(res, 'Client not found')
    return success(res, null, 'Client deleted successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/clients/dropdown
const getClientsDropdown = async (req, res, next) => {
  try {
    const { Client } = req.tenant.models
    const clients = await Client.find({ tenantId: req.user.tenantId, status: { $ne: 'inactive' } })
      .select('firstName lastName phone')
      .sort({ firstName: 1 })
      .lean()

    const mapped = clients.map(c => ({
      id: c._id,
      name: `${c.firstName} ${c.lastName || ''}`.trim(),
      mobile: c.phone,
      label: `${c.firstName} ${c.lastName || ''}`.trim() + (c.phone ? ` (${c.phone})` : ''),
    }))

    return success(res, mapped, 'Clients dropdown fetched')
  } catch (err) {
    next(err)
  }
}

module.exports = { createClient, getClients, getClientById, updateClient, deleteClient, getClientsDropdown }
