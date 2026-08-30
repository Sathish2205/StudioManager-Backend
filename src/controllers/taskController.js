'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const createTask = async (req, res, next) => {
  try {
    const { Task } = req.tenant.models
    const task = await Task.create({
      ...req.body,
      tenantId: req.user.tenantId,
    })
    return created(res, task, 'Task created successfully')
  } catch (err) {
    next(err)
  }
}

const getTasks = async (req, res, next) => {
  try {
    const { Task } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.status) filter.status = req.query.status
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sort || { dueDate: 1 })
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

const updateTask = async (req, res, next) => {
  try {
    const { Task } = req.tenant.models
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()

    if (!task) return notFound(res, 'Task not found')
    return success(res, task, 'Task updated successfully')
  } catch (err) {
    next(err)
  }
}

const deleteTask = async (req, res, next) => {
  try {
    const { Task } = req.tenant.models
    const task = await Task.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!task) return notFound(res, 'Task not found')
    return success(res, null, 'Task deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createTask, getTasks, updateTask, deleteTask }
