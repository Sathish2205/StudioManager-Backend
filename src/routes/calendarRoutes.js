'use strict'

const express = require('express')
const router = express.Router()
const { getCalendarEvents } = require('../controllers/calendarController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')

router.use(authenticate, tenant)
router.get('/', getCalendarEvents)

module.exports = router
