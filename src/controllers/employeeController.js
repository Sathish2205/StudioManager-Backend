'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// POST /api/employees
const createEmployee = async (req, res, next) => {
  try {
    const { Employee } = req.tenant.models
    const employee = await Employee.create({
      ...req.body,
      tenantId: req.user.tenantId,
    })
    return created(res, employee, 'Employee created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/employees
const getEmployees = async (req, res, next) => {
  try {
    const { Employee } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['name', 'email', 'phone', 'employeeId', 'role', 'specialization'])
    filter.tenantId = req.user.tenantId

    if (req.query.role) filter.role = req.query.role
    if (req.query.employmentType) filter.employmentType = req.query.employmentType
    if (req.query.status) filter.status = req.query.status

    const [employees, total] = await Promise.all([
      Employee.find(filter)
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
    const { Employee, Event, Task, Equipment, Attendance, Leave } = req.tenant.models
    const employee = await Employee.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).lean()

    if (!employee) return notFound(res, 'Employee not found')

    const [tasks, assignedEvents, equipment, attendances, leaves] = await Promise.all([
      Task.find({ assignedTo: req.params.id, tenantId: req.user.tenantId, status: { $ne: 'Cancelled' } }).lean(),
      Event.find({
        tenantId: req.user.tenantId,
        $or: [{ assignedPhotographers: req.params.id }, { assignedEditors: req.params.id }],
        eventDate: { $gte: new Date() },
      }).select('eventName eventDate venue status').sort({ eventDate: 1 }).limit(10).lean(),
      Equipment.find({ assignedTo: req.params.id, tenantId: req.user.tenantId }).lean(),
      Attendance.find({ employeeId: req.params.id, tenantId: req.user.tenantId }).lean(),
      Leave.find({ employeeId: req.params.id, tenantId: req.user.tenantId }).lean(),
    ])

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
    const { Employee } = req.tenant.models
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()
    if (!employee) return notFound(res, 'Employee not found')
    return success(res, employee, 'Employee updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/employees/:id
const deleteEmployee = async (req, res, next) => {
  try {
    const { Employee } = req.tenant.models
    const employee = await Employee.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!employee) return notFound(res, 'Employee not found')
    return success(res, null, 'Employee deleted successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/employees/dropdown
const getEmployeesDropdown = async (req, res, next) => {
  try {
    const { Employee } = req.tenant.models
    const employees = await Employee.find({ tenantId: req.user.tenantId, status: 'Active' })
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

// GET /api/employees/dashboard/stats
const getEmployeeDashboardStats = async (req, res, next) => {
  try {
    const { Employee, Attendance, Leave } = req.tenant.models
    const totalStaff = await Employee.countDocuments({ tenantId: req.user.tenantId, status: 'Active' })
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayAttendance = await Attendance.find({ tenantId: req.user.tenantId, date: { $gte: today } }).lean()

    const presentCount = todayAttendance.filter(a => ['Present', 'Late'].includes(a.status)).length
    const onLeaveCount = await Leave.countDocuments({
      tenantId: req.user.tenantId,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      status: 'Approved',
    })

    return success(res, {
      totalStaff,
      presentCount,
      onLeaveCount,
      absentCount: Math.max(0, totalStaff - presentCount - onLeaveCount),
    }, 'Employee dashboard stats')
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
