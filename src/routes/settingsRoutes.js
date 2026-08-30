'use strict'

const express = require('express')
const router = express.Router()
const { getSettings, updateSettings } = require('../controllers/settingsController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.get('/', getSettings)
router.put('/', authorize('owner', 'admin'), updateSettings)

module.exports = router
