'use strict'

const express = require('express')
const router = express.Router()
const { getSettings, updateSettings, getPackages } = require('../controllers/settingsController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

router.use(protect)

router.get('/', getSettings)
router.put('/', requireRole('admin', 'manager'), updateSettings)
router.get('/packages', getPackages)

module.exports = router
