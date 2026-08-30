'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const generatePayroll = async (req, res, next) => {
  try {
    const { Payroll } = req.tenant.models
    const payroll = await Payroll.create({
      ...req.body,
      tenantId: req.user.tenantId,
    })
    return created(res, payroll, 'Payroll record generated successfully')
  } catch (err) {
    next(err)
  }
}

const getPayrolls = async (req, res, next) => {
  try {
    const { Payroll } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.employeeId) filter.employeeId = req.query.employeeId
    if (req.query.month) filter.month = parseInt(req.query.month)
    if (req.query.year) filter.year = parseInt(req.query.year)

    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .populate('employeeId', 'name role email')
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payroll.countDocuments(filter),
    ])

    return success(res, payrolls, 'Payroll records fetched', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

const updatePayrollStatus = async (req, res, next) => {
  try {
    const { Payroll } = req.tenant.models
    const payroll = await Payroll.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { status: req.body.status || 'Paid' },
      { new: true }
    ).lean()

    if (!payroll) return notFound(res, 'Payroll record not found')
    return success(res, payroll, 'Payroll status updated')
  } catch (err) {
    next(err)
  }
}

module.exports = { generatePayroll, getPayrolls, updatePayrollStatus }
