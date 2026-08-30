'use strict'

const express = require('express')
const router = express.Router()
const { getPackages, createPackage, updatePackage, deletePackage } = require('../controllers/packageController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getPackages)
  .post(createPackage)

router.route('/:id')
  .put(authorize('owner', 'admin', 'manager'), updatePackage)
  .delete(authorize('owner', 'admin', 'manager'), deletePackage)

module.exports = router
