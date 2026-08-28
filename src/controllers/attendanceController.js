'use strict'

const Attendance = require('../models/Attendance')
const Employee = require('../models/Employee')
const Shift = require('../models/Shift')
const { success, created, notFound, badRequest } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

/**
 * Helper: get today's date (start of day in local timezone)
 */
const getToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Helper: parse time string "09:00 AM" to { hours, minutes } in 24h
 */
const parseTimeStr = (timeStr) => {
  if (!timeStr) return null
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const ampm = match[3]
  if (ampm) {
    if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0
  }
  return { hours, minutes }
}

/**
 * Helper: calculate working minutes from attendance record
 */
const calculateWorkingMinutes = (attendance, shift) => {
  if (!attendance.checkIn || !attendance.checkOut) return { workingMinutes: 0, overtimeMinutes: 0, lateMinutes: 0, totalBreakMinutes: 0 }

  const checkInMs = attendance.checkIn.getTime()
  const checkOutMs = attendance.checkOut.getTime()

  // Total break minutes
  let totalBreakMinutes = 0
  if (attendance.breaks && attendance.breaks.length > 0) {
    for (const b of attendance.breaks) {
      if (b.startTime && b.endTime) {
        totalBreakMinutes += Math.round((b.endTime.getTime() - b.startTime.getTime()) / 60000)
      }
    }
  }

  // Working = checkout - checkin - breaks
  const totalPresenceMinutes = Math.round((checkOutMs - checkInMs) / 60000)
  const workingMinutes = Math.max(0, totalPresenceMinutes - totalBreakMinutes)

  // Overtime
  const requiredMinutes = shift ? shift.requiredMinutes : 480
  const overtimeEnabled = shift ? shift.overtimeEnabled : true
  let overtimeMinutes = 0
  if (overtimeEnabled && workingMinutes > requiredMinutes) {
    overtimeMinutes = workingMinutes - requiredMinutes
  }

  // Late detection
  let lateMinutes = 0
  if (shift) {
    const shiftStart = parseTimeStr(shift.startTime)
    if (shiftStart) {
      const today = getToday()
      const shiftStartMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), shiftStart.hours, shiftStart.minutes).getTime()
      const gracePeriod = (shift.gracePeriod || 0) * 60000
      if (checkInMs > shiftStartMs + gracePeriod) {
        lateMinutes = Math.round((checkInMs - shiftStartMs) / 60000)
      }
    }
  }

  return { workingMinutes, overtimeMinutes, lateMinutes, totalBreakMinutes }
}

// POST /api/attendance/check-in
const checkIn = async (req, res, next) => {
  try {
    const { employeeId } = req.body
    if (!employeeId) return badRequest(res, 'Employee ID is required')

    const employee = await Employee.findById(employeeId).populate('shiftId').lean()
    if (!employee) return notFound(res, 'Employee not found')

    const today = getToday()
    let attendance = await Attendance.findOne({ employeeId, date: today })

    // Rule: cannot check in twice without checking out
    if (attendance && attendance.checkIn && !attendance.checkOut) {
      return badRequest(res, 'Already checked in. Please check out first.')
    }
    if (attendance && attendance.checkIn && attendance.checkOut) {
      return badRequest(res, 'Already checked in and out for today.')
    }

    const now = new Date()
    const shift = employee.shiftId || null

    // Determine late status
    let status = 'Present'
    let lateMinutes = 0
    if (shift) {
      const shiftStart = parseTimeStr(shift.startTime)
      if (shiftStart) {
        const shiftStartMs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), shiftStart.hours, shiftStart.minutes).getTime()
        const gracePeriod = (shift.gracePeriod || 0) * 60000
        if (now.getTime() > shiftStartMs + gracePeriod) {
          status = 'Late'
          lateMinutes = Math.round((now.getTime() - shiftStartMs) / 60000)
        }
      }
    }

    if (attendance) {
      attendance.checkIn = now
      attendance.status = status
      attendance.lateMinutes = lateMinutes
      attendance.shiftId = shift ? shift._id : null
      await attendance.save()
    } else {
      attendance = await Attendance.create({
        employeeId,
        date: today,
        shiftId: shift ? shift._id : null,
        checkIn: now,
        status,
        lateMinutes,
      })
    }

    return success(res, attendance, `Checked in successfully${status === 'Late' ? ` (${lateMinutes} min late)` : ''}`)
  } catch (err) {
    next(err)
  }
}

// POST /api/attendance/check-out
const checkOut = async (req, res, next) => {
  try {
    const { employeeId } = req.body
    if (!employeeId) return badRequest(res, 'Employee ID is required')

    const today = getToday()
    const attendance = await Attendance.findOne({ employeeId, date: today })

    if (!attendance || !attendance.checkIn) {
      return badRequest(res, 'Cannot check out without checking in first.')
    }
    if (attendance.checkOut) {
      return badRequest(res, 'Already checked out for today.')
    }
    // Rule: cannot check out while on break
    if (attendance.isOnBreak) {
      return badRequest(res, 'Please end your break before checking out.')
    }

    const now = new Date()
    attendance.checkOut = now

    // Fetch shift for calculations
    const shift = attendance.shiftId ? await Shift.findById(attendance.shiftId).lean() : null
    const calc = calculateWorkingMinutes({ ...attendance.toObject(), checkOut: now }, shift)

    attendance.workingMinutes = calc.workingMinutes
    attendance.overtimeMinutes = calc.overtimeMinutes
    attendance.totalBreakMinutes = calc.totalBreakMinutes

    // Early checkout detection
    const requiredMinutes = shift ? shift.requiredMinutes : 480
    if (calc.workingMinutes < requiredMinutes && attendance.status !== 'Late') {
      attendance.status = 'Early Checkout'
    } else if (attendance.status === 'Late') {
      // keep Late status
    } else {
      attendance.status = 'Present'
    }

    await attendance.save()
    return success(res, attendance, 'Checked out successfully')
  } catch (err) {
    next(err)
  }
}

// POST /api/attendance/break/start
const startBreak = async (req, res, next) => {
  try {
    const { employeeId } = req.body
    if (!employeeId) return badRequest(res, 'Employee ID is required')

    const today = getToday()
    const attendance = await Attendance.findOne({ employeeId, date: today })

    if (!attendance || !attendance.checkIn) {
      return badRequest(res, 'Cannot start break without checking in first.')
    }
    if (attendance.checkOut) {
      return badRequest(res, 'Cannot start break after checking out.')
    }
    if (attendance.isOnBreak) {
      return badRequest(res, 'Already on break. End current break first.')
    }

    attendance.breaks.push({ startTime: new Date() })
    attendance.isOnBreak = true
    await attendance.save()

    return success(res, attendance, 'Break started')
  } catch (err) {
    next(err)
  }
}

// POST /api/attendance/break/end
const endBreak = async (req, res, next) => {
  try {
    const { employeeId } = req.body
    if (!employeeId) return badRequest(res, 'Employee ID is required')

    const today = getToday()
    const attendance = await Attendance.findOne({ employeeId, date: today })

    if (!attendance || !attendance.isOnBreak) {
      return badRequest(res, 'Not currently on break.')
    }

    // End the last break
    const lastBreak = attendance.breaks[attendance.breaks.length - 1]
    if (lastBreak && !lastBreak.endTime) {
      lastBreak.endTime = new Date()
    }
    attendance.isOnBreak = false
    await attendance.save()

    return success(res, attendance, 'Break ended')
  } catch (err) {
    next(err)
  }
}

// GET /api/attendance/today
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = getToday()
    const attendances = await Attendance.find({ date: today })
      .populate('employeeId', 'name role employeeId avatar phone shiftId')
      .populate('shiftId', 'name startTime endTime')
      .sort({ checkIn: -1 })
      .lean()

    const totalEmployees = await Employee.countDocuments({ status: 'Active' })
    const present = attendances.filter(a => ['Present', 'Late', 'Early Checkout', 'Half Day'].includes(a.status)).length
    const absent = totalEmployees - present - attendances.filter(a => a.status === 'On Leave').length
    const onLeave = attendances.filter(a => a.status === 'On Leave').length
    const currentlyWorking = attendances.filter(a => a.checkIn && !a.checkOut && !a.isOnBreak).length
    const onBreak = attendances.filter(a => a.isOnBreak).length
    const late = attendances.filter(a => a.status === 'Late').length

    const summary = {
      date: today,
      totalEmployees,
      present,
      absent: Math.max(0, absent),
      onLeave,
      currentlyWorking,
      onBreak,
      late,
    }

    return success(res, { summary, attendances }, "Today's attendance fetched")
  } catch (err) {
    next(err)
  }
}

// GET /api/attendance/employee/:id
const getEmployeeAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { employeeId: req.params.id }

    if (req.query.status) filter.status = req.query.status
    if (req.query.startDate || req.query.endDate) {
      filter.date = {}
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate)
      if (req.query.endDate) {
        const end = new Date(req.query.endDate)
        end.setHours(23, 59, 59, 999)
        filter.date.$lte = end
      }
    }

    const [attendances, total] = await Promise.all([
      Attendance.find(filter).populate('shiftId', 'name startTime endTime requiredMinutes').sort(sort).skip(skip).limit(limit).lean(),
      Attendance.countDocuments(filter),
    ])

    return success(res, attendances, 'Employee attendance fetched', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/attendance/employee/:id/monthly/:year/:month
const getMonthlyAttendance = async (req, res, next) => {
  try {
    const { id, year, month } = req.params
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

    const attendances = await Attendance.find({
      employeeId: id,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('shiftId', 'name startTime endTime')
      .sort({ date: 1 })
      .lean()

    // Build calendar map
    const calendarMap = {}
    attendances.forEach(a => {
      const day = new Date(a.date).getDate()
      calendarMap[day] = a
    })

    // Summary stats
    const present = attendances.filter(a => ['Present', 'Late', 'Early Checkout'].includes(a.status)).length
    const absent = attendances.filter(a => a.status === 'Absent').length
    const onLeave = attendances.filter(a => a.status === 'On Leave').length
    const late = attendances.filter(a => a.status === 'Late').length
    const totalWorkingMinutes = attendances.reduce((sum, a) => sum + (a.workingMinutes || 0), 0)
    const totalOvertimeMinutes = attendances.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0)

    return success(res, {
      calendar: calendarMap,
      summary: { present, absent, onLeave, late, totalWorkingMinutes, totalOvertimeMinutes },
    }, 'Monthly attendance fetched')
  } catch (err) {
    next(err)
  }
}

// PUT /api/attendance/:id/adjust — manual adjustment (admin/manager)
const adjustAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
    if (!attendance) return notFound(res, 'Attendance record not found')

    const { checkIn, checkOut, status, notes, reason } = req.body
    const adjustments = []

    if (checkIn !== undefined) {
      adjustments.push({ field: 'checkIn', oldValue: attendance.checkIn, newValue: checkIn, reason, modifiedBy: req.user._id })
      attendance.checkIn = new Date(checkIn)
    }
    if (checkOut !== undefined) {
      adjustments.push({ field: 'checkOut', oldValue: attendance.checkOut, newValue: checkOut, reason, modifiedBy: req.user._id })
      attendance.checkOut = new Date(checkOut)
    }
    if (status !== undefined) {
      adjustments.push({ field: 'status', oldValue: attendance.status, newValue: status, reason, modifiedBy: req.user._id })
      attendance.status = status
    }
    if (notes !== undefined) {
      attendance.notes = notes
    }

    attendance.manualAdjustments.push(...adjustments)

    // Recalculate working minutes if check-in and check-out are set
    if (attendance.checkIn && attendance.checkOut) {
      const shift = attendance.shiftId ? await Shift.findById(attendance.shiftId).lean() : null
      const calc = calculateWorkingMinutes(attendance.toObject(), shift)
      attendance.workingMinutes = calc.workingMinutes
      attendance.overtimeMinutes = calc.overtimeMinutes
      attendance.totalBreakMinutes = calc.totalBreakMinutes
    }

    await attendance.save()
    return success(res, attendance, 'Attendance adjusted successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/attendance/employee/:id/status — current status for check-in widget
const getEmployeeCurrentStatus = async (req, res, next) => {
  try {
    const today = getToday()
    const attendance = await Attendance.findOne({ employeeId: req.params.id, date: today })
      .populate('shiftId', 'name startTime endTime requiredMinutes breakDuration')
      .lean()

    const employee = await Employee.findById(req.params.id)
      .populate('shiftId', 'name startTime endTime requiredMinutes breakDuration gracePeriod')
      .select('name role employeeId shiftId')
      .lean()

    return success(res, { attendance, employee }, 'Current status fetched')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  checkIn, checkOut, startBreak, endBreak,
  getTodayAttendance, getEmployeeAttendance, getMonthlyAttendance,
  adjustAttendance, getEmployeeCurrentStatus,
}
