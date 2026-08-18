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

// GET /api/workflows/summaries — aggregated event-level workflow summaries for the frontend table
const getWorkflowSummaries = async (req, res, next) => {
  try {
    // Fetch all workflows, grouped by eventId
    const workflows = await Workflow.find({})
      .populate({
        path: 'eventId',
        select: 'eventName eventDate eventType status venue packageAmount advanceAmount totalPaid remainingAmount clientId assignedPhotographers assignedEditors',
        populate: [
          { path: 'clientId', select: 'firstName lastName phone email' },
          { path: 'assignedPhotographers', select: 'name role' },
          { path: 'assignedEditors', select: 'name role' },
        ],
      })
      .populate('assignedTo', 'name role')
      .sort({ order: 1 })
      .lean()

    // Group workflows by eventId and build summary objects
    const eventMap = new Map()

    for (const wf of workflows) {
      if (!wf.eventId) continue
      const eventIdStr = wf.eventId._id.toString()

      if (!eventMap.has(eventIdStr)) {
        const event = wf.eventId
        const client = event.clientId || {}
        const photographers = event.assignedPhotographers || []
        const editors = event.assignedEditors || []

        eventMap.set(eventIdStr, {
          _id: wf._id.toString(),
          workflowId: wf._id.toString(),
          eventId: eventIdStr,
          clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown Client',
          clientPhone: client.phone || '',
          clientEmail: client.email || '',
          eventName: event.eventName || 'Unnamed Event',
          eventType: event.eventType || 'Other',
          eventDate: event.eventDate,
          venue: event.venue || '',
          photographer: photographers.map(p => p.name).join(', ') || 'Unassigned',
          assignedEditor: wf.assignedEditor || editors.map(e => e.name).join(', ') || 'Unassigned',
          overallStatus: wf.overallStatus || 'Booking',
          currentStageIndex: wf.currentStageIndex || 0,
          paymentSummary: {
            totalAmount: event.packageAmount || 0,
            advancePaid: event.totalPaid || event.advanceAmount || 0,
            balanceDue: event.remainingAmount || 0,
            paymentStatus: (event.remainingAmount || 0) === 0 ? 'Fully Paid' : (event.totalPaid || 0) > 0 ? 'Partially Paid' : 'Advance Received',
          },
        })
      }
    }

    const summaries = Array.from(eventMap.values())
    return success(res, summaries, 'Workflow summaries fetched successfully')
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

// PUT /api/workflows/stage/:id
const updateWorkflow = async (req, res, next) => {
  try {
    const updateData = { ...req.body }

    // If status is set to Completed and no completedDate, set it
    if (updateData.status === 'Completed' && !updateData.completedDate) {
      updateData.completedDate = new Date()
    }

    const workflow = await Workflow.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name role').lean()

    if (!workflow) return notFound(res, 'Workflow stage not found')
    return success(res, workflow, 'Workflow updated successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/workflows/event/:eventId — update workflow by eventId (for frontend workflow management)
const updateWorkflowByEvent = async (req, res, next) => {
  try {
    const { overallStatus, currentStageIndex, assignedEditor } = req.body
    const eventId = req.params.eventId

    // Find the first workflow document for this event to update
    const workflow = await Workflow.findOne({ eventId })
    if (!workflow) return notFound(res, 'No workflow found for this event')

    // Update workflow fields
    if (overallStatus !== undefined) workflow.overallStatus = overallStatus
    if (currentStageIndex !== undefined) workflow.currentStageIndex = currentStageIndex
    if (assignedEditor !== undefined) workflow.assignedEditor = assignedEditor

    await workflow.save()

    const updated = await Workflow.findById(workflow._id)
      .populate('assignedTo', 'name role')
      .lean()

    return success(res, updated, 'Workflow updated successfully')
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

module.exports = { getWorkflows, getWorkflowSummaries, getWorkflowByEvent, createWorkflow, updateWorkflow, updateWorkflowByEvent, deleteWorkflow }
