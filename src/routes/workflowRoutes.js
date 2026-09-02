'use strict'

const express = require('express')
const router = express.Router()
const { getWorkflows, getWorkflowSummaries, getWorkflowById, createWorkflow, updateWorkflow, updateWorkflowByEvent, deleteWorkflow } = require('../controllers/workflowController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getWorkflows)
  .post(createWorkflow)

// Named routes MUST come before /:id to avoid being caught as an id param
router.get('/summaries', getWorkflowSummaries)
router.put('/event/:eventId', updateWorkflowByEvent)

router.route('/:id')
  .get(getWorkflowById)
  .put(updateWorkflow)
  .delete(authorize('owner', 'admin'), deleteWorkflow)

module.exports = router
