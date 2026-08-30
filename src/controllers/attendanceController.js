'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const getTodayAttendance = async (req, res, next) => {
  try {
    const { Attendance, Employee } = req.tenant.models
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const attendances = await Attendance.find({
      tenantId: req.user.tenantId,
      date: { $gte: today, $lt: tomorrow },
    })
      .populate('employeeId', 'name role email avatar')
      .sort({ checkIn: -1 })
      .lean()

    const totalStaff = await Employee.countDocuments({ tenantId: req.user.tenantId, status: 'Active' })
    const presentCount = attendances.filter(a => ['Present', 'Late'].includes(a.status)).length

    return success(res, {
      summary: {
        totalStaff,
        presentCount,
        absentCount: Math.max(0, totalStaff - presentCount),
      },
      attendances,
    }, 'Today attendance retrieved')
  } catch (err) {
    next(err)
  }
}

const getAttendanceLog = async (req, res, next) => {
  try {
    const { Attendance } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.employeeId) filter.employeeId = req.query.employeeId
    if (req.query.status) filter.status = req.query.status

    const [attendances, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employeeId', 'name role email')
        .sort(sort || { date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter),
    ])

    return success(res, attendances, 'Attendance logs fetched', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

const checkIn = async (req, res, next) => {
  try {
    const { Attendance } = req.tenant.models
    const { employeeId } = req.body

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let att = await Attendance.findOne({
      employeeId,
      tenantId: req.user.tenantId,
      date: { $gte: today },
    })

    if (att) {
      att.checkIn = new Date()
      att.status = 'Present'
      await att.save()
    } else {
      att = await Attendance.create({
        tenantId: req.user.tenantId,
        employeeId,
        date: new Date(),
        checkIn: new Date(),
        status: 'Present',
      })
    }

    return success(res, att, 'Checked in successfully')
  } catch (err) {
    next(err)
  }
}

const checkOut = async (req, res, next) => {
  try {
    const { Attendance } = req.tenant.models
    const { employeeId } = req.body

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const att = await Attendance.findOne({
      employeeId,
      tenantId: req.user.tenantId,
      date: { $gte: today },
    })

    if (!att) return notFound(res, 'No check-in record found for today')

    att.checkOut = new Date()
    if (att.checkIn) {
      const diffMs = att.checkOut - att.checkIn
      att.workingMinutes = Math.round(diffMs / 60000)
    }

    await att.save()
    return success(res, att, 'Checked out successfully')
  } catch (err) {
    next(err)
  }
}

const adjustAttendance = async (req, res, next) => {
  try {
    const { Attendance } = req.tenant.models
    const att = await Attendance.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true }
    ).lean()

    if (!att) return notFound(res, 'Attendance record not found')
    return success(res, att, 'Attendance record adjusted')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getTodayAttendance,
  getAttendanceLog,
  checkIn,
  checkOut,
  adjustAttendance,
}
