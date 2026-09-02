'use strict'

const { success, created, notFound } = require('../utils/apiResponse')

const getWorkflows = async (req, res, next) => {
  try {
    const { Workflow } = req.tenant.models
    const workflows = await Workflow.find({ tenantId: req.user.tenantId })
      .sort({ createdAt: -1 })
      .lean()

    return success(res, workflows, 'Workflows fetched successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/workflows/summaries
 * Returns enriched workflow data joined with Event + Client for the Workflow Management table.
 */
const getWorkflowSummaries = async (req, res, next) => {
  try {
    const { Workflow, Event, Client } = req.tenant.models
    const workflows = await Workflow.find({ tenantId: req.user.tenantId })
      .sort({ createdAt: -1 })
      .lean()

    // Collect unique eventIds to batch-fetch events
    const eventIds = [...new Set(workflows.map((w) => String(w.eventId)).filter(Boolean))]

    const events = await Event.find({ _id: { $in: eventIds }, tenantId: req.user.tenantId })
      .populate('clientId', 'firstName lastName phone email')
      .populate('assignedPhotographers', 'name')
      .populate('assignedEditors', 'name')
      .lean()

    const eventMap = {}
    events.forEach((e) => { eventMap[String(e._id)] = e })

    const summaries = workflows.map((wf) => {
      const event = eventMap[String(wf.eventId)] || {}
      const client = event.clientId || {}
      const clientName = wf.clientName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client'
      const photographer = event.assignedPhotographers && event.assignedPhotographers.length > 0
        ? event.assignedPhotographers.map((p) => p.name).join(', ')
        : (event.photographer || 'Unassigned')

      const totalAmount = event.packageAmount || 0
      const advancePaid = event.totalPaid || event.advanceAmount || 0
      const balanceDue = Math.max(0, totalAmount - advancePaid)
      let paymentStatus = 'Pending'
      if (balanceDue === 0 && totalAmount > 0) paymentStatus = 'Fully Paid'
      else if (advancePaid > 0) paymentStatus = 'Advance Received'

      return {
        _id: wf._id,
        workflowId: wf._id,
        eventId: wf.eventId,
        eventName: wf.eventName || event.eventName || 'Event',
        eventType: event.eventType || 'Wedding',
        eventDate: event.eventDate || null,
        clientName,
        clientPhone: client.phone || '',
        clientEmail: client.email || '',
        venue: event.venue || '',
        photographer,
        assignedEditor: wf.assignedEditor || 'Unassigned',
        currentStageIndex: wf.currentStageIndex || 0,
        overallStatus: wf.overallStatus || 'Booking',
        paymentSummary: {
          totalAmount,
          advancePaid,
          balanceDue,
          paymentStatus,
        },
      }
    })

    return success(res, summaries, 'Workflow summaries fetched successfully')
  } catch (err) {
    next(err)
  }
}

const getWorkflowById = async (req, res, next) => {
  try {
    const { Workflow } = req.tenant.models
    const workflow = await Workflow.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).lean()
    if (!workflow) return notFound(res, 'Workflow not found')
    return success(res, workflow, 'Workflow details fetched successfully')
  } catch (err) {
    next(err)
  }
}

const createWorkflow = async (req, res, next) => {
  try {
    const { Workflow } = req.tenant.models
    const workflow = await Workflow.create({
      ...req.body,
      tenantId: req.user.tenantId,
    })
    return created(res, workflow, 'Workflow created successfully')
  } catch (err) {
    next(err)
  }
}

const updateWorkflow = async (req, res, next) => {
  try {
    const { Workflow } = req.tenant.models
    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()

    if (!workflow) return notFound(res, 'Workflow not found')
    return success(res, workflow, 'Workflow updated successfully')
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/workflows/event/:eventId
 * Update a workflow by its eventId (used by the frontend Workflow Management dialog).
 */
const updateWorkflowByEvent = async (req, res, next) => {
  try {
    const { Workflow } = req.tenant.models
    const workflow = await Workflow.findOneAndUpdate(
      { eventId: req.params.eventId, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()

    if (!workflow) return notFound(res, 'Workflow not found for this event')
    return success(res, workflow, 'Workflow updated successfully')
  } catch (err) {
    next(err)
  }
}

const deleteWorkflow = async (req, res, next) => {
  try {
    const { Workflow } = req.tenant.models
    const workflow = await Workflow.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!workflow) return notFound(res, 'Workflow deleted successfully')
    return success(res, null, 'Workflow deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { getWorkflows, getWorkflowSummaries, getWorkflowById, createWorkflow, updateWorkflow, updateWorkflowByEvent, deleteWorkflow }

