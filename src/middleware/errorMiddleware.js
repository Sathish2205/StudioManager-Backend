'use strict'

const mongoose = require('mongoose')
const { isProd } = require('../config/env')

/**
 * Global error handler middleware.
 * Must be the last app.use() in app.js.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || err.status || 500
  let message = err.message || 'Internal Server Error'
  let errors = null

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422
    message = 'Validation failed'
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    const value = err.keyValue?.[field]
    message = `Duplicate value: ${field} '${value}' already exists.`
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400
    message = `Invalid ID format: '${err.value}'`
  }

  // JWT errors (in case they bubble up)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token has expired'
  }

  // Mongoose disconnected
  if (err instanceof mongoose.Error.MongooseServerSelectionError) {
    statusCode = 503
    message = 'Database unavailable. Please try again later.'
  }

  const response = {
    success: false,
    message,
    data: null,
  }

  if (errors) response.errors = errors

  // Only include stack trace in development
  if (!isProd && err.stack) {
    response.stack = err.stack
  }

  if (statusCode >= 500) {
    console.error(`❌  [${req.method}] ${req.path} →`, err)
  }

  res.status(statusCode).json(response)
}

/**
 * 404 handler — mount before errorHandler.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: [${req.method}] ${req.originalUrl}`,
    data: null,
  })
}

module.exports = { errorHandler, notFoundHandler }
