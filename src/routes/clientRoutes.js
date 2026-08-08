'use strict'

const express = require('express')
const router = express.Router()
const { createClient, getClients, getClientById, updateClient, deleteClient, getClientsDropdown } = require('../controllers/clientController')
const { protect } = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/roleMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { createClientRules, updateClientRules } = require('../validators/clientValidator')

router.use(protect)

router.get('/dropdown', getClientsDropdown)
router.route('/')
  .get(getClients)
  .post(createClientRules, validate, createClient)

router.route('/:id')
  .get(getClientById)
  .put(updateClientRules, validate, updateClient)
  .delete(requireRole('admin', 'manager'), deleteClient)

module.exports = router
