'use strict'

const Quotation = require('../models/Quotation')
const Invoice = require('../models/Invoice')
const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

// Generate next quotation number
const generateQuotationNumber = async () => {
  const year = new Date().getFullYear()
  const lastQuotation = await Quotation.findOne({ quotationNumber: new RegExp(`^QT-${year}-`) })
    .sort({ quotationNumber: -1 })
    .lean()

  let nextNum = 1
  if (lastQuotation) {
    const parts = lastQuotation.quotationNumber.split('-')
    nextNum = (parseInt(parts[2]) || 0) + 1
  }
  return `QT-${year}-${String(nextNum).padStart(3, '0')}`
}

// POST /api/quotations
const createQuotation = async (req, res, next) => {
  try {
    const quotationNumber = await generateQuotationNumber()
    const { services, discount = 0, taxPercent = 18 } = req.body

    const subtotal = services.reduce((sum, s) => sum + (s.qty * s.unitPrice), 0)
    const taxAmount = Math.round((subtotal - discount) * taxPercent / 100)
    const grandTotal = subtotal - discount + taxAmount

    // Compute each service's total
    const computedServices = services.map(s => ({
      ...s,
      total: s.qty * s.unitPrice,
    }))

    const quotation = await Quotation.create({
      ...req.body,
      quotationNumber,
      services: computedServices,
      subtotal,
      taxAmount,
      grandTotal,
      createdBy: req.user._id,
    })

    const populated = await Quotation.findById(quotation._id)
      .populate('clientId', 'firstName lastName phone email')
      .populate('eventId', 'eventName eventType eventDate venue')
      .lean()

    return created(res, populated, 'Quotation created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/quotations
const getQuotations = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = {}

    if (req.query.status) filter.status = req.query.status
    if (req.query.clientId) filter.clientId = req.query.clientId
    if (req.query.eventId) filter.eventId = req.query.eventId

    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate('clientId', 'firstName lastName phone email')
        .populate('eventId', 'eventName eventType eventDate venue')
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quotation.countDocuments(filter),
    ])

    return success(res, quotations, 'Quotations fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/quotations/:id
const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('clientId', 'firstName lastName phone email address')
      .populate('eventId', 'eventName eventType eventDate endDate venue startTime endTime package packageAmount')
      .populate('convertedToInvoice', 'invoiceNumber status')
      .lean()

    if (!quotation) return notFound(res, 'Quotation not found')
    return success(res, quotation, 'Quotation fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/quotations/:id
const updateQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
    if (!quotation) return notFound(res, 'Quotation not found')

    const { services, discount, taxPercent } = req.body

    if (services) {
      const subtotal = services.reduce((sum, s) => sum + (s.qty * s.unitPrice), 0)
      const disc = discount !== undefined ? discount : quotation.discount
      const tp = taxPercent !== undefined ? taxPercent : quotation.taxPercent
      const taxAmount = Math.round((subtotal - disc) * tp / 100)
      const grandTotal = subtotal - disc + taxAmount

      req.body.services = services.map(s => ({ ...s, total: s.qty * s.unitPrice }))
      req.body.subtotal = subtotal
      req.body.taxAmount = taxAmount
      req.body.grandTotal = grandTotal
    }

    Object.assign(quotation, req.body)
    await quotation.save()

    const updated = await Quotation.findById(req.params.id)
      .populate('clientId', 'firstName lastName phone email')
      .populate('eventId', 'eventName eventType eventDate venue')
      .lean()

    return success(res, updated, 'Quotation updated successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/quotations/:id/status
const updateQuotationStatus = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
    if (!quotation) return notFound(res, 'Quotation not found')

    quotation.status = req.body.status
    await quotation.save()

    return success(res, quotation, `Quotation status updated to ${req.body.status}`)
  } catch (err) {
    next(err)
  }
}

// POST /api/quotations/:id/convert
const convertToInvoice = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
    if (!quotation) return notFound(res, 'Quotation not found')

    if (quotation.convertedToInvoice) {
      return success(res, { invoiceId: quotation.convertedToInvoice }, 'Quotation already converted to invoice')
    }

    // Auto-create Event if quotation has no linked event
    let eventId = quotation.eventId
    if (!eventId) {
      const Event = require('../models/Event')
      const newEvent = await Event.create({
        clientId: quotation.clientId,
        eventName: quotation.eventName || 'Confirmed Wedding Shoot',
        eventType: quotation.eventType || 'Wedding',
        eventDate: quotation.eventDate || quotation.date || new Date(),
        venue: quotation.venue || 'Main Banquet Hall',
        package: quotation.services && quotation.services.length > 0 ? quotation.services[0].name : 'Custom Package',
        packageAmount: quotation.grandTotal,
        advanceAmount: 0,
        totalPaid: 0,
        remainingAmount: quotation.grandTotal,
        status: 'Confirmed',
        createdBy: req.user._id,
      })
      eventId = newEvent._id
      quotation.eventId = eventId
    }

    // Generate invoice number
    const year = new Date().getFullYear()
    const lastInvoice = await Invoice.findOne({ invoiceNumber: new RegExp(`^INV-${year}-`) })
      .sort({ invoiceNumber: -1 })
      .lean()

    let nextNum = 1
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-')
      nextNum = (parseInt(parts[2]) || 0) + 1
    }
    const invoiceNumber = `INV-${year}-${String(nextNum).padStart(3, '0')}`

    const invoice = await Invoice.create({
      invoiceNumber,
      quotationId: quotation._id,
      clientId: quotation.clientId,
      eventId: eventId,
      services: quotation.services,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      taxPercent: quotation.taxPercent,
      taxAmount: quotation.taxAmount,
      grandTotal: quotation.grandTotal,
      balance: quotation.grandTotal,
      status: 'Issued',
      paymentTerms: quotation.terms,
      notes: quotation.notes,
      createdBy: req.user._id,
    })

    // Link invoice back to quotation
    quotation.convertedToInvoice = invoice._id
    quotation.status = 'Accepted'
    await quotation.save()

    const populated = await Invoice.findById(invoice._id)
      .populate('clientId', 'firstName lastName phone email')
      .populate('eventId', 'eventName eventType eventDate venue')
      .lean()

    return created(res, populated, 'Invoice and Event created from quotation successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/quotations/:id
const deleteQuotation = async (req, res, next) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id)
    if (!quotation) return notFound(res, 'Quotation not found')
    return success(res, null, 'Quotation deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationStatus,
  convertToInvoice,
  deleteQuotation,
}
