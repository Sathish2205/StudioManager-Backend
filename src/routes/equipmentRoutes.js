'use strict'

const express = require('express')
const router = express.Router()
const { createEquipment, getEquipment, getEquipmentById, updateEquipment, deleteEquipment } = require('../controllers/equipmentController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')

router.use(protect)

router.route('/')
  .get(getEquipment)
  .post(requireRole('admin', 'manager'), createEquipment)

router.route('/:id')
  .get(getEquipmentById)
  .put(requireRole('admin', 'manager'), updateEquipment)
  .delete(requireRole('admin', 'manager'), deleteEquipment)

module.exports = router
