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

const deleteWorkflow = async (req, res, next) => {
  try {
    const { Workflow } = req.tenant.models
    const workflow = await Workflow.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!workflow) return notFound(res, 'Workflow not found')
    return success(res, null, 'Workflow deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { getWorkflows, getWorkflowById, createWorkflow, updateWorkflow, deleteWorkflow }
