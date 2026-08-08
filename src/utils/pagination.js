'use strict'

/**
 * Parse query parameters into a pagination/filtering object.
 * Supports: page, limit, sortBy, sortOrder, search, status, startDate, endDate
 */
const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  const limit = Math.min(parseInt(query.limit, 10) || 10, 100)
  const skip = (page - 1) * limit
  const sortBy = query.sortBy || 'createdAt'
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1
  const sort = { [sortBy]: sortOrder }

  return { page, limit, skip, sort }
}

/**
 * Build a MongoDB filter object from common query params.
 */
const buildFilter = (query, searchFields = []) => {
  const filter = {}

  // Text search across multiple fields
  if (query.search && searchFields.length > 0) {
    filter.$or = searchFields.map((field) => ({
      [field]: { $regex: query.search, $options: 'i' },
    }))
  }

  // Status filter
  if (query.status) {
    filter.status = query.status
  }

  // Date range filter on a specified field (default: createdAt)
  const dateField = query.dateField || 'createdAt'
  if (query.startDate || query.endDate) {
    filter[dateField] = {}
    if (query.startDate) filter[dateField].$gte = new Date(query.startDate)
    if (query.endDate) {
      const end = new Date(query.endDate)
      end.setHours(23, 59, 59, 999)
      filter[dateField].$lte = end
    }
  }

  return filter
}

/**
 * Build the pagination metadata object for the response envelope.
 */
const buildPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
})

module.exports = { parsePagination, buildFilter, buildPaginationMeta }
