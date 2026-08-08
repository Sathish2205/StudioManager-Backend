'use strict'

const express = require('express')
const router = express.Router()
const { getWorkflows, getWorkflowByEvent, createWorkflow, updateWorkflow, deleteWorkflow } = require('../controllers/workflowController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.route('/').get(getWorkflows).post(createWorkflow)
router.get('/:eventId', getWorkflowByEvent)
router.route('/stage/:id').put(updateWorkflow).delete(deleteWorkflow)

module.exports = router
