'use strict'

const { body } = require('express-validator')

const createClientRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 60 }),
  body('lastName').optional().trim(),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional().trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('status').optional().isIn(['lead', 'active', 'completed', 'inactive']).withMessage('Invalid status'),
  body('source').optional().trim(),
]

const updateClientRules = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty').isLength({ max: 60 }),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('status').optional().isIn(['lead', 'active', 'completed', 'inactive']).withMessage('Invalid status'),
]

module.exports = { createClientRules, updateClientRules }
