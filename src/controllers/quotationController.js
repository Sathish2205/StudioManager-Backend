'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const generateQuotationNumber = async (Quotation, tenantId) => {
  const year = new Date().getFullYear()
  const lastQuotation = await Quotation.findOne({ tenantId, quotationNumber: new RegExp(`^QT-${year}-`) })
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
    const { Quotation } = req.tenant.models
    const quotationNumber = req.body.quotationNumber || await generateQuotationNumber(Quotation, req.user.tenantId)
    const validUntil = req.body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const quotation = await Quotation.create({
      ...req.body,
      tenantId: req.user.tenantId,
      quotationNumber,
      validUntil,
      createdBy: req.user.userId,
    })

    return created(res, quotation, 'Quotation proposal created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/quotations
const getQuotations = async (req, res, next) => {
  try {
    const { Quotation } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.status) filter.status = req.query.status

    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
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
    const { Quotation } = req.tenant.models
    const quotation = await Quotation.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).lean()
    if (!quotation) return notFound(res, 'Quotation not found')
    return success(res, quotation, 'Quotation details fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/quotations/:id
const updateQuotation = async (req, res, next) => {
  try {
    const { Quotation } = req.tenant.models
    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()

    if (!quotation) return notFound(res, 'Quotation not found')
    return success(res, quotation, 'Quotation updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/quotations/:id
const deleteQuotation = async (req, res, next) => {
  try {
    const { Quotation } = req.tenant.models
    const quotation = await Quotation.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!quotation) return notFound(res, 'Quotation not found')
    return success(res, null, 'Quotation deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createQuotation, getQuotations, getQuotationById, updateQuotation, deleteQuotation }
