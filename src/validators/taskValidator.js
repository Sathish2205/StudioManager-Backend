'use strict'

const { body } = require('express-validator')

const createTaskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 }),
  body('priority').optional(),
  body('status').optional(),
  body('eventId').optional(),
  body('assignedTo').optional(),
  body('dueDate').optional(),
]

const updateTaskRules = [
  body('title').optional(),
  body('priority').optional(),
  body('status').optional(),
  body('dueDate').optional(),
]

module.exports = { createTaskRules, updateTaskRules }
