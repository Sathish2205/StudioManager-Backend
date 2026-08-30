'use strict'

const express = require('express')
const router = express.Router()
const { getNotifications, markAsRead } = require('../controllers/notificationController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')

router.use(authenticate, tenant)
router.get('/', getNotifications)
router.patch('/:id/read', markAsRead)

module.exports = router
