'use strict'

const express = require('express')
const router = express.Router()
const { getCalendarEvents, getCalendarEventDetail, checkConflicts } = require('../controllers/calendarController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)

router.get('/events', getCalendarEvents)
router.get('/events/:id', getCalendarEventDetail)
router.get('/check-conflicts', checkConflicts)

module.exports = router
