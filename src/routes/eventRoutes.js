'use strict'

const express = require('express')
const router = express.Router()
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { createEventRules, updateEventRules } = require('../validators/eventValidator')

router.use(protect)

router.route('/')
  .get(getEvents)
  .post(createEventRules, validate, createEvent)

router.route('/:id')
  .get(getEventById)
  .put(updateEventRules, validate, updateEvent)
  .delete(requireRole('admin', 'manager'), deleteEvent)

module.exports = router
