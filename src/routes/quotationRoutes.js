'use strict'

const express = require('express')
const router = express.Router()
const { createQuotation, getQuotations, getQuotationById, updateQuotation, deleteQuotation } = require('../controllers/quotationController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getQuotations)
  .post(createQuotation)

router.route('/:id')
  .get(getQuotationById)
  .put(updateQuotation)
  .delete(authorize('owner', 'admin'), deleteQuotation)

module.exports = router
