'use strict'

const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationStatus,
  convertToInvoice,
  deleteQuotation,
} = require('../controllers/quotationController')

router.use(protect)

router.route('/').get(getQuotations).post(createQuotation)
router.route('/:id').get(getQuotationById).put(updateQuotation).delete(deleteQuotation)
router.put('/:id/status', updateQuotationStatus)
router.post('/:id/convert', convertToInvoice)

module.exports = router
