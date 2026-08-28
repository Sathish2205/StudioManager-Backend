'use strict'

const Shift = require('../models/Shift')
const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

// POST /api/shifts
const createShift = async (req, res, next) => {
  try {
    const shift = await Shift.create(req.body)
    return created(res, shift, 'Shift created successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/shifts
const getShifts = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = {}
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true'
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' }
    }

    const [shifts, total] = await Promise.all([
      Shift.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Shift.countDocuments(filter),
    ])

    return success(res, shifts, 'Shifts fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/shifts/active — dropdown-friendly list
const getActiveShifts = async (req, res, next) => {
  try {
    const shifts = await Shift.find({ isActive: true })
      .select('name startTime endTime requiredMinutes')
      .sort({ name: 1 })
      .lean()
    return success(res, shifts, 'Active shifts fetched')
  } catch (err) {
    next(err)
  }
}

// GET /api/shifts/:id
const getShiftById = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id).lean()
    if (!shift) return notFound(res, 'Shift not found')
    return success(res, shift, 'Shift fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/shifts/:id
const updateShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean()
    if (!shift) return notFound(res, 'Shift not found')
    return success(res, shift, 'Shift updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/shifts/:id
const deleteShift = async (req, res, next) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id)
    if (!shift) return notFound(res, 'Shift not found')
    return success(res, null, 'Shift deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createShift, getShifts, getActiveShifts, getShiftById, updateShift, deleteShift }
