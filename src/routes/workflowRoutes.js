'use strict'

const express = require('express')
const router = express.Router()
const { getWorkflows, getWorkflowById, createWorkflow, updateWorkflow, deleteWorkflow } = require('../controllers/workflowController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getWorkflows)
  .post(createWorkflow)

router.route('/:id')
  .get(getWorkflowById)
  .put(updateWorkflow)
  .delete(authorize('owner', 'admin'), deleteWorkflow)

module.exports = router
