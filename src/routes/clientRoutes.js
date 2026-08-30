'use strict'

const express = require('express')
const router = express.Router()
const { createClient, getClients, getClientById, updateClient, deleteClient, getClientsDropdown } = require('../controllers/clientController')
const { authenticate } = require('../middleware/authenticate')
const { tenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')

router.use(authenticate, tenant)

router.get('/dropdown', getClientsDropdown)
router.route('/')
  .get(getClients)
  .post(createClient)

router.route('/:id')
  .get(getClientById)
  .put(updateClient)
  .delete(authorize('owner', 'admin', 'manager'), deleteClient)

module.exports = router
