'use strict'

const Workflow = require('../models/Workflow')
const Event = require('../models/Event')
const { success, created, notFound, badRequest } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// GET /api/workflows
const getWorkflows = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, [])

    if (req.query.stage) filter.stage = req.query.stage
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo

    const [workflows, total] = await Promise.all([
      Workflow.find(filter)
        .populate('eventId', 'eventName eventDate status clientId')
        .populate('assignedTo', 'name role avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Workflow.countDocuments(filter),
    ])

    return success(res, workflows, 'Workflows fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/workflows/:eventId — get all stages for one event
const getWorkflowByEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).lean()
    if (!event) return notFound(res, 'Event not found')

    const workflows = await Workflow.find({ eventId: req.params.eventId })
      .populate('assignedTo', 'name role avatar')
      .sort({ order: 1 })
      .lean()

    return success(res, { event, workflows }, 'Workflow fetched successfully')
  } catch (err) {
    next(err)
  }
}

// POST /api/workflows
const createWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.create(req.body)
    return created(res, workflow, 'Workflow stage created successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/workflows/:id
const updateWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name role').lean()

    if (!workflow) return notFound(res, 'Workflow stage not found')
    return success(res, workflow, 'Workflow updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/workflows/:id
const deleteWorkflow = async (req, res, next) => {
  try {
    const workflow = await Workflow.findByIdAndDelete(req.params.id)
    if (!workflow) return notFound(res, 'Workflow stage not found')
    return success(res, null, 'Workflow stage deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { getWorkflows, getWorkflowByEvent, createWorkflow, updateWorkflow, deleteWorkflow }
