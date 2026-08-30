'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const applyLeave = async (req, res, next) => {
  try {
    const { Leave } = req.tenant.models
    const leave = await Leave.create({
      ...req.body,
      tenantId: req.user.tenantId,
    })
    return created(res, leave, 'Leave request applied successfully')
  } catch (err) {
    next(err)
  }
}

const getLeaves = async (req, res, next) => {
  try {
    const { Leave } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.status) filter.status = req.query.status
    if (req.query.employeeId) filter.employeeId = req.query.employeeId

    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate('employeeId', 'name role email')
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Leave.countDocuments(filter),
    ])

    return success(res, leaves, 'Leaves fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

const approveLeave = async (req, res, next) => {
  try {
    const { Leave } = req.tenant.models
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { status: 'Approved', approvedBy: req.user.userId },
      { new: true }
    ).lean()

    if (!leave) return notFound(res, 'Leave request not found')
    return success(res, leave, 'Leave request approved')
  } catch (err) {
    next(err)
  }
}

const rejectLeave = async (req, res, next) => {
  try {
    const { Leave } = req.tenant.models
    const leave = await Leave.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { status: 'Rejected' },
      { new: true }
    ).lean()

    if (!leave) return notFound(res, 'Leave request not found')
    return success(res, leave, 'Leave request rejected')
  } catch (err) {
    next(err)
  }
}

module.exports = { applyLeave, getLeaves, approveLeave, rejectLeave }
