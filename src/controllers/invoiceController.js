'use strict'

const Invoice = require('../models/Invoice')
const Payment = require('../models/Payment')
const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

// Generate next invoice number
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear()
  const lastInvoice = await Invoice.findOne({ invoiceNumber: new RegExp(`^INV-${year}-`) })
    .sort({ invoiceNumber: -1 })
    .lean()

  let nextNum = 1
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-')
    nextNum = (parseInt(parts[2]) || 0) + 1
  }
  return `INV-${year}-${String(nextNum).padStart(3, '0')}`
}

// Recalculate invoice balance from payments
const recalculateInvoiceBalance = async (invoiceId) => {
  const payments = await Payment.find({ invoiceId }).lean()
  const totalPaid = payments.reduce((sum, p) => sum + (p.paymentType !== 'Refund' ? p.amount : -p.amount), 0)

  const invoice = await Invoice.findById(invoiceId)
  if (!invoice) return

  invoice.totalPaid = totalPaid
  invoice.balance = Math.max(0, invoice.grandTotal - totalPaid)

  if (invoice.balance === 0 && totalPaid > 0) {
    invoice.status = 'Paid'
  } else if (totalPaid > 0 && invoice.balance > 0) {
    invoice.status = 'Partially Paid'
  }

  await invoice.save()
}

// POST /api/invoices
const createInvoice = async (req, res, next) => {
  try {
    const invoiceNumber = await generateInvoiceNumber()
    const { services, discount = 0, taxPercent = 18 } = req.body

    const subtotal = services.reduce((sum, s) => sum + (s.qty * s.unitPrice), 0)
    const taxAmount = Math.round((subtotal - discount) * taxPercent / 100)
    const grandTotal = subtotal - discount + taxAmount

    const computedServices = services.map(s => ({
      ...s,
      total: s.qty * s.unitPrice,
    }))

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      services: computedServices,
      subtotal,
      taxAmount,
      grandTotal,
      balance: grandTotal,
      createdBy: req.user._id,
    })

    const populated = await Invoice.findById(invoice._id)
      .populate('clientId', 'firstName lastName phone email')
      .populate('eventId', 'eventName eventType eventDate venue')
      .lean()

    return created(res, populated, 'Invoice created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = {}

    if (req.query.status) filter.status = req.query.status
    if (req.query.clientId) filter.clientId = req.query.clientId
    if (req.query.eventId) filter.eventId = req.query.eventId

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('clientId', 'firstName lastName phone email')
        .populate('eventId', 'eventName eventType eventDate venue')
        .populate('quotationId', 'quotationNumber')
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ])

    return success(res, invoices, 'Invoices fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/invoices/:id
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('clientId', 'firstName lastName phone email address')
      .populate('eventId', 'eventName eventType eventDate endDate venue startTime endTime package packageAmount')
      .populate('quotationId', 'quotationNumber status')
      .lean()

    if (!invoice) return notFound(res, 'Invoice not found')

    // Fetch related payments
    const payments = await Payment.find({ eventId: invoice.eventId._id || invoice.eventId })
      .sort({ paymentDate: -1 })
      .populate('receivedBy', 'name')
      .lean()

    return success(res, { ...invoice, payments }, 'Invoice fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/invoices/:id
const updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return notFound(res, 'Invoice not found')

    const { services, discount, taxPercent } = req.body

    if (services) {
      const subtotal = services.reduce((sum, s) => sum + (s.qty * s.unitPrice), 0)
      const disc = discount !== undefined ? discount : invoice.discount
      const tp = taxPercent !== undefined ? taxPercent : invoice.taxPercent
      const taxAmount = Math.round((subtotal - disc) * tp / 100)
      const grandTotal = subtotal - disc + taxAmount

      req.body.services = services.map(s => ({ ...s, total: s.qty * s.unitPrice }))
      req.body.subtotal = subtotal
      req.body.taxAmount = taxAmount
      req.body.grandTotal = grandTotal
      req.body.balance = grandTotal - invoice.totalPaid
    }

    Object.assign(invoice, req.body)
    await invoice.save()

    const updated = await Invoice.findById(req.params.id)
      .populate('clientId', 'firstName lastName phone email')
      .populate('eventId', 'eventName eventType eventDate venue')
      .lean()

    return success(res, updated, 'Invoice updated successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/invoices/:id/status
const updateInvoiceStatus = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
    if (!invoice) return notFound(res, 'Invoice not found')

    invoice.status = req.body.status
    await invoice.save()

    return success(res, invoice, `Invoice status updated to ${req.body.status}`)
  } catch (err) {
    next(err)
  }
}

// DELETE /api/invoices/:id
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id)
    if (!invoice) return notFound(res, 'Invoice not found')
    return success(res, null, 'Invoice deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  recalculateInvoiceBalance,
}
