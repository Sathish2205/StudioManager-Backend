'use strict'

const express = require('express')
const router = express.Router()
const { createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice } = require('../controllers/invoiceController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getInvoices)
  .post(createInvoice)

router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(authorize('owner', 'admin'), deleteInvoice)

module.exports = router
