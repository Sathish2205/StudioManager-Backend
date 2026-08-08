'use strict'

const { body } = require('express-validator')

const EVENT_TYPES = [
  'Wedding', 'Reception', 'Engagement', 'Pre Wedding', 'Birthday',
  'Baby Shower', 'Corporate', 'Sangeet', 'Mehendi', 'Haldi',
  'Destination Wedding', 'Gala Dinner', 'Other',
]

const createEventRules = [
  body('clientId').notEmpty().withMessage('Client ID is required').isMongoId().withMessage('Invalid client ID'),
  body('eventType').notEmpty().withMessage('Event type is required').isIn(EVENT_TYPES).withMessage('Invalid event type'),
  body('eventName').trim().notEmpty().withMessage('Event name is required').isLength({ max: 200 }),
  body('eventDate').notEmpty().withMessage('Event date is required').isISO8601().withMessage('Invalid event date format'),
  body('packageAmount').notEmpty().withMessage('Package amount is required').isNumeric().withMessage('Package amount must be a number').custom(v => v >= 0).withMessage('Package amount cannot be negative'),
  body('advanceAmount').optional().isNumeric().withMessage('Advance amount must be a number'),
  body('status').optional().isIn(['Inquiry', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  body('guestCount').optional().isInt({ min: 0 }).withMessage('Guest count must be a non-negative integer'),
]

const updateEventRules = [
  body('eventType').optional().isIn(EVENT_TYPES).withMessage('Invalid event type'),
  body('eventName').optional().trim().isLength({ max: 200 }),
  body('eventDate').optional().isISO8601().withMessage('Invalid event date format'),
  body('packageAmount').optional().isNumeric().withMessage('Package amount must be a number').custom(v => v >= 0).withMessage('Package amount cannot be negative'),
  body('status').optional().isIn(['Inquiry', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status'),
]

module.exports = { createEventRules, updateEventRules }
