'use strict'

const { body } = require('express-validator')

const createTaskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 }),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status'),
  body('eventId').optional().isMongoId().withMessage('Invalid event ID'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid employee ID'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
]

const updateTaskRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
]

module.exports = { createTaskRules, updateTaskRules }
