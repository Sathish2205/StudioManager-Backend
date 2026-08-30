'use strict'

const express = require('express')
const router = express.Router()
const { createEvent, getEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getEvents)
  .post(createEvent)

router.route('/:id')
  .get(getEventById)
  .put(updateEvent)
  .delete(authorize('owner', 'admin', 'manager'), deleteEvent)

module.exports = router
