'use strict'

/**
 * Standardised API response helpers.
 * All controllers should use these to guarantee a consistent response envelope.
 */

const success = (res, data = null, message = 'Success', statusCode = 200, pagination = null) => {
  const response = { success: true, message, data }
  if (pagination) response.pagination = pagination
  return res.status(statusCode).json(response)
}

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = { success: false, message, data: null }
  if (errors) response.errors = errors
  return res.status(statusCode).json(response)
}

const created = (res, data = null, message = 'Created successfully') =>
  success(res, data, message, 201)

const notFound = (res, message = 'Resource not found') =>
  error(res, message, 404)

const unauthorized = (res, message = 'Unauthorized') =>
  error(res, message, 401)

const forbidden = (res, message = 'Forbidden') =>
  error(res, message, 403)

const badRequest = (res, message = 'Bad request', errors = null) =>
  error(res, message, 400, errors)

const validationError = (res, errors) =>
  res.status(422).json({
    success: false,
    message: 'Validation failed',
    data: null,
    errors,
  })

module.exports = { success, error, created, notFound, unauthorized, forbidden, badRequest, validationError }
