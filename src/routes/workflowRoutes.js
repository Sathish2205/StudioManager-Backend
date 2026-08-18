'use strict'

const express = require('express')
const router = express.Router()
const { getWorkflows, getWorkflowSummaries, getWorkflowByEvent, createWorkflow, updateWorkflow, updateWorkflowByEvent, deleteWorkflow } = require('../controllers/workflowController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.route('/').get(getWorkflows).post(createWorkflow)
router.get('/summaries', getWorkflowSummaries)
router.get('/:eventId', getWorkflowByEvent)
router.route('/stage/:id').put(updateWorkflow).delete(deleteWorkflow)
router.put('/event/:eventId', updateWorkflowByEvent)

module.exports = router
