'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const generateInvoiceNumber = async (Invoice, tenantId) => {
  const year = new Date().getFullYear()
  const lastInvoice = await Invoice.findOne({ tenantId, invoiceNumber: new RegExp(`^INV-${year}-`) })
    .sort({ invoiceNumber: -1 })
    .lean()

  let nextNum = 1
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-')
    nextNum = (parseInt(parts[2]) || 0) + 1
  }
  return `INV-${year}-${String(nextNum).padStart(3, '0')}`
}

// POST /api/invoices
const createInvoice = async (req, res, next) => {
  try {
    const { Invoice } = req.tenant.models
    const invoiceNumber = req.body.invoiceNumber || await generateInvoiceNumber(Invoice, req.user.tenantId)
    const { items, services, discount = 0, tax = 0 } = req.body

    const itemLst = items || services || []
    const subtotal = itemLst.reduce((sum, s) => sum + ((s.quantity || s.qty || 1) * (s.rate || s.unitPrice || 0)), 0)
    const grandTotal = subtotal - discount + tax
    const balance = grandTotal - (req.body.totalPaid || 0)

    const invoice = await Invoice.create({
      ...req.body,
      tenantId: req.user.tenantId,
      invoiceNumber,
      items: itemLst,
      subtotal: req.body.subtotal || subtotal,
      tax: req.body.tax || tax,
      grandTotal: req.body.grandTotal || grandTotal,
      balance: req.body.balance !== undefined ? req.body.balance : balance,
      createdBy: req.user.userId,
    })

    return created(res, invoice, 'Invoice created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { Invoice } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.status) filter.status = req.query.status
    if (req.query.clientId) filter.clientId = req.query.clientId

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
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
    const { Invoice, Payment } = req.tenant.models
    const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).lean()

    if (!invoice) return notFound(res, 'Invoice not found')

    const payments = await Payment.find({ invoiceId: invoice._id, tenantId: req.user.tenantId })
      .sort({ paymentDate: -1 })
      .lean()

    return success(res, { ...invoice, payments }, 'Invoice fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/invoices/:id
const updateInvoice = async (req, res, next) => {
  try {
    const { Invoice } = req.tenant.models
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()

    if (!invoice) return notFound(res, 'Invoice not found')
    return success(res, invoice, 'Invoice updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/invoices/:id
const deleteInvoice = async (req, res, next) => {
  try {
    const { Invoice } = req.tenant.models
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!invoice) return notFound(res, 'Invoice not found')
    return success(res, null, 'Invoice deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice }
