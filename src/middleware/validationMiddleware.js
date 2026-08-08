'use strict'

const { validationResult } = require('express-validator')
const { validationError } = require('../utils/apiResponse')

/**
 * Run after express-validator chains.
 * If there are errors, formats them and returns 422 immediately.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }))
    return validationError(res, formatted)
  }
  next()
}

module.exports = { validate }
