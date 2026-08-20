'use strict'

const Task = require('../models/Task')
const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const createdBy = req.user ? req.user._id : undefined
    const task = await Task.create({ ...req.body, ...(createdBy ? { createdBy } : {}) })

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name role avatar')
      .populate('eventId', 'eventName eventDate')
      .lean()

    return created(res, populated, 'Task created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['title', 'description'])

    if (req.query.priority) filter.priority = req.query.priority
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo
    if (req.query.eventId) filter.eventId = req.query.eventId
    if (req.query.dueDate) {
      const due = new Date(req.query.dueDate)
      filter.dueDate = { $lte: due }
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name role avatar')
        .populate('eventId', 'eventName eventDate')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ])

    return success(res, tasks, 'Tasks fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name role avatar phone email')
      .populate('eventId', 'eventName eventDate venue status')
      .populate('createdBy', 'name email')
      .lean()

    if (!task) return notFound(res, 'Task not found')
    return success(res, task, 'Task fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) return notFound(res, 'Task not found')

    Object.assign(task, req.body)
    await task.save() // triggers pre-save hook for completedAt

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name role avatar')
      .populate('eventId', 'eventName eventDate')
      .lean()

    return success(res, updated, 'Task updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id)
    if (!task) return notFound(res, 'Task not found')
    return success(res, null, 'Task deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask }
