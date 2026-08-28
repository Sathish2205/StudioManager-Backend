'use strict'

const Leave = require('../models/Leave')
const Attendance = require('../models/Attendance')
const { success, created, notFound, badRequest } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

// POST /api/leaves - Apply for leave
const applyLeave = async (req, res, next) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason, attachment } = req.body
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return badRequest(res, 'Missing required fields: employeeId, leaveType, startDate, endDate, reason')
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      return badRequest(res, 'End date cannot be earlier than start date')
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      attachment: attachment || null,
      status: 'Pending',
    })

    return created(res, leave, 'Leave application submitted successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/leaves - List leaves with filtering
const getLeaves = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = {}

    if (req.query.employeeId) filter.employeeId = req.query.employeeId
    if (req.query.status) filter.status = req.query.status
    if (req.query.leaveType) filter.leaveType = req.query.leaveType

    if (req.query.startDate || req.query.endDate) {
      filter.startDate = {}
      if (req.query.startDate) filter.startDate.$gte = new Date(req.query.startDate)
      if (req.query.endDate) filter.startDate.$lte = new Date(req.query.endDate)
    }

    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate('employeeId', 'name role employeeId avatar')
        .populate('approvedBy', 'name email')
        .sort(sort)
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

// GET /api/leaves/:id
const getLeaveById = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'name role employeeId avatar department')
      .populate('approvedBy', 'name email')
      .lean()

    if (!leave) return notFound(res, 'Leave request not found')
    return success(res, leave, 'Leave request details fetched')
  } catch (err) {
    next(err)
  }
}

// PUT /api/leaves/:id/approve
const approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
    if (!leave) return notFound(res, 'Leave request not found')

    if (leave.status !== 'Pending') {
      return badRequest(res, `Cannot approve leave that is already ${leave.status}`)
    }

    leave.status = 'Approved'
    leave.approvedBy = req.user?._id || null
    leave.approvedAt = new Date()
    leave.approverNotes = req.body.approverNotes || null
    await leave.save()

    // Auto-mark attendance as 'On Leave' for dates in range
    const curDate = new Date(leave.startDate)
    const endDate = new Date(leave.endDate)

    while (curDate <= endDate) {
      const dateOnly = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate())
      await Attendance.findOneAndUpdate(
        { employeeId: leave.employeeId, date: dateOnly },
        {
          employeeId: leave.employeeId,
          date: dateOnly,
          status: 'On Leave',
          notes: `Approved leave: ${leave.leaveType}`,
        },
        { upsert: true, new: true }
      )
      curDate.setDate(curDate.getDate() + 1)
    }

    return success(res, leave, 'Leave request approved and attendance updated')
  } catch (err) {
    next(err)
  }
}

// PUT /api/leaves/:id/reject
const rejectLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
    if (!leave) return notFound(res, 'Leave request not found')

    if (leave.status !== 'Pending') {
      return badRequest(res, `Cannot reject leave that is already ${leave.status}`)
    }

    leave.status = 'Rejected'
    leave.approvedBy = req.user?._id || null
    leave.approvedAt = new Date()
    leave.approverNotes = req.body.approverNotes || 'Rejected by manager'
    await leave.save()

    return success(res, leave, 'Leave request rejected')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/leaves/:id
const deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id)
    if (!leave) return notFound(res, 'Leave request not found')
    return success(res, null, 'Leave request deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  applyLeave,
  getLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  deleteLeave,
}
