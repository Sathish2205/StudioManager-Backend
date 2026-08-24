'use strict'

const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} = require('../controllers/invoiceController')

router.use(protect)

router.route('/').get(getInvoices).post(createInvoice)
router.route('/:id').get(getInvoiceById).put(updateInvoice).delete(deleteInvoice)
router.put('/:id/status', updateInvoiceStatus)

module.exports = router
