'use strict'

const Employee = require('../models/Employee')
const Event = require('../models/Event')
const Task = require('../models/Task')
const Equipment = require('../models/Equipment')
const Attendance = require('../models/Attendance')
const Leave = require('../models/Leave')
const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// POST /api/employees
const createEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body)
    return created(res, employee, 'Employee created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/employees
const getEmployees = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['name', 'email', 'phone', 'employeeId', 'role', 'specialization'])

    if (req.query.role) filter.role = req.query.role
    if (req.query.employmentType) filter.employmentType = req.query.employmentType
    if (req.query.status) filter.status = req.query.status

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('shiftId', 'name startTime endTime requiredMinutes')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
    ])

    return success(res, employees, 'Employees fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/employees/:id
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('shiftId', 'name startTime endTime requiredMinutes gracePeriod breakDuration')
      .lean()

    if (!employee) return notFound(res, 'Employee not found')

    // Fetch assigned tasks, upcoming events, equipment, attendance summary, leave summary
    const [tasks, assignedEvents, equipment, attendances, leaves] = await Promise.all([
      Task.find({ assignedTo: req.params.id, status: { $ne: 'Cancelled' } }).populate('eventId', 'eventName eventDate').lean(),
      Event.find({
        $or: [{ assignedPhotographers: req.params.id }, { assignedEditors: req.params.id }],
        eventDate: { $gte: new Date() },
      }).select('eventName eventDate venue status').sort({ eventDate: 1 }).limit(10).lean(),
      Equipment.find({ assignedTo: req.params.id }).lean(),
      Attendance.find({ employeeId: req.params.id }).lean(),
      Leave.find({ employeeId: req.params.id }).lean(),
    ])

    // Compute stats
    const totalWorkingDays = attendances.length
    const presentDays = attendances.filter(a => ['Present', 'Late', 'Early Checkout', 'Half Day'].includes(a.status)).length
    const absentDays = attendances.filter(a => a.status === 'Absent').length
    const leaveDays = attendances.filter(a => a.status === 'On Leave').length
    const totalWorkingMinutes = attendances.reduce((sum, a) => sum + (a.workingMinutes || 0), 0)
    const overtimeMinutes = attendances.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0)
    const completedTasksCount = tasks.filter(t => t.status === 'Completed').length

    const stats = {
      totalWorkingDays,
      presentDays,
      absentDays,
      leaveDays,
      totalWorkingHours: (totalWorkingMinutes / 60).toFixed(1),
      overtimeHours: (overtimeMinutes / 60).toFixed(1),
      assignedEventsCount: assignedEvents.length,
      completedTasksCount,
    }

    return success(
      res,
      { ...employee, tasks, assignedEvents, equipment, attendances, leaves, stats },
      'Employee details fetched successfully'
    )
  } catch (err) {
    next(err)
  }
}

// PUT /api/employees/:id
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean()
    if (!employee) return notFound(res, 'Employee not found')
    return success(res, employee, 'Employee updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/employees/:id
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id)
    if (!employee) return notFound(res, 'Employee not found')
    return success(res, null, 'Employee deleted successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/employees/dropdown — for form selects, grouped by role
const getEmployeesDropdown = async (req, res, next) => {
  try {
    const employees = await Employee.find({ status: 'Active' })
      .select('name role specialization avatar employeeId')
      .sort({ role: 1, name: 1 })
      .lean()

    const photographers = employees.filter(e => ['Photographer', 'Drone Pilot'].includes(e.role))
      .map(e => ({ id: e._id, name: `${e.name} (${e.specialization || e.role})` }))
    const videographers = employees.filter(e => e.role === 'Videographer')
      .map(e => ({ id: e._id, name: `${e.name} (${e.specialization || e.role})` }))
    const editors = employees.filter(e => ['Editor', 'Photo Editor', 'Video Editor', 'Designer', 'Album Designer'].includes(e.role))
      .map(e => ({ id: e._id, name: e.name }))

    return success(res, { photographers, videographers, editors, all: employees }, 'Employee dropdown fetched')
  } catch (err) {
    next(err)
  }
}

// GET /api/employees/dashboard/stats — Employee module dashboard metrics
const getEmployeeDashboardStats = async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalEmployees, attendances, leaves] = await Promise.all([
      Employee.countDocuments({ status: 'Active' }),
      Attendance.find({ date: today }).lean(),
      Leave.find({ status: 'Approved', startDate: { $lte: today }, endDate: { $gte: today } }).lean(),
    ])

    const present = attendances.filter(a => ['Present', 'Late', 'Early Checkout', 'Half Day'].includes(a.status)).length
    const absent = Math.max(0, totalEmployees - present - leaves.length)
    const onLeave = leaves.length
    const currentlyWorking = attendances.filter(a => a.checkIn && !a.checkOut && !a.isOnBreak).length
    const lateToday = attendances.filter(a => a.status === 'Late').length

    // Current month aggregate hours
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthAttendances = await Attendance.find({ date: { $gte: firstDayOfMonth } }).lean()
    const monthWorkingMinutes = monthAttendances.reduce((sum, a) => sum + (a.workingMinutes || 0), 0)
    const monthOvertimeMinutes = monthAttendances.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0)

    return success(
      res,
      {
        totalEmployees,
        presentToday: present,
        absentToday: absent,
        onLeaveToday: onLeave,
        currentlyWorking,
        lateToday,
        monthWorkingHours: Math.round(monthWorkingMinutes / 60),
        monthOvertimeHours: Math.round(monthOvertimeMinutes / 60),
      },
      'Employee dashboard stats fetched'
    )
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesDropdown,
  getEmployeeDashboardStats,
}
