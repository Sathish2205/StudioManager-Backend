'use strict'

const Employee = require('../models/Employee')
const Event = require('../models/Event')
const Task = require('../models/Task')
const Equipment = require('../models/Equipment')
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
    const filter = buildFilter(req.query, ['name', 'email', 'specialization'])

    if (req.query.role) filter.role = req.query.role

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort(sort).skip(skip).limit(limit).lean(),
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
    const employee = await Employee.findById(req.params.id).lean()
    if (!employee) return notFound(res, 'Employee not found')

    // Fetch assigned tasks and upcoming events
    const [tasks, assignedEvents, equipment] = await Promise.all([
      Task.find({ assignedTo: req.params.id, status: { $ne: 'Cancelled' } }).populate('eventId', 'eventName eventDate').lean(),
      Event.find({
        $or: [{ assignedPhotographers: req.params.id }, { assignedEditors: req.params.id }],
        eventDate: { $gte: new Date() },
      }).select('eventName eventDate venue status').sort({ eventDate: 1 }).limit(10).lean(),
      Equipment.find({ assignedTo: req.params.id }).lean(),
    ])

    return success(res, { ...employee, tasks, assignedEvents, equipment }, 'Employee details fetched successfully')
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
      .select('name role specialization avatar')
      .sort({ role: 1, name: 1 })
      .lean()

    const photographers = employees.filter(e => ['Photographer', 'Drone Pilot'].includes(e.role))
      .map(e => ({ id: e._id, name: `${e.name} (${e.specialization || e.role})` }))
    const videographers = employees.filter(e => e.role === 'Videographer')
      .map(e => ({ id: e._id, name: `${e.name} (${e.specialization || e.role})` }))
    const editors = employees.filter(e => ['Editor', 'Designer', 'Album Designer'].includes(e.role))
      .map(e => ({ id: e._id, name: e.name }))

    return success(res, { photographers, videographers, editors, all: employees }, 'Employee dropdown fetched')
  } catch (err) {
    next(err)
  }
}

module.exports = { createEmployee, getEmployees, getEmployeeById, updateEmployee, deleteEmployee, getEmployeesDropdown }
