'use strict'

const express = require('express')
const router = express.Router()
const { createEquipment, getEquipment, updateEquipment, deleteEquipment } = require('../controllers/equipmentController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.route('/')
  .get(getEquipment)
  .post(createEquipment)

router.route('/:id')
  .put(updateEquipment)
  .delete(authorize('owner', 'admin'), deleteEquipment)

module.exports = router
