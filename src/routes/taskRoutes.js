'use strict'

const express = require('express')
const router = express.Router()
const { createTask, getTasks, getTaskById, updateTask, deleteTask } = require('../controllers/taskController')
const { protect } = require('../middleware/authMiddleware')
const { validate } = require('../middleware/validationMiddleware')
const { createTaskRules, updateTaskRules } = require('../validators/taskValidator')

router.use(protect)

router.route('/')
  .get(getTasks)
  .post(createTaskRules, validate, createTask)

router.route('/:id')
  .get(getTaskById)
  .put(updateTaskRules, validate, updateTask)
  .delete(deleteTask)

module.exports = router
