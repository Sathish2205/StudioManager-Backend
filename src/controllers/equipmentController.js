'use strict'

const Equipment = require('../models/Equipment')
const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildFilter, buildPaginationMeta } = require('../utils/pagination')

// POST /api/equipment
const createEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.create(req.body)
    return created(res, equipment, 'Equipment added successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/equipment
const getEquipment = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = buildFilter(req.query, ['name', 'brand', 'model', 'serialNumber'])

    if (req.query.category) filter.category = req.query.category
    if (req.query.availability) filter.availability = req.query.availability
    if (req.query.condition) filter.condition = req.query.condition
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo

    const [equipment, total] = await Promise.all([
      Equipment.find(filter)
        .populate('assignedTo', 'name role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Equipment.countDocuments(filter),
    ])

    return success(res, equipment, 'Equipment fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/equipment/:id
const getEquipmentById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('assignedTo', 'name role phone email')
      .lean()
    if (!equipment) return notFound(res, 'Equipment not found')
    return success(res, equipment, 'Equipment fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/equipment/:id
const updateEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name role').lean()

    if (!equipment) return notFound(res, 'Equipment not found')
    return success(res, equipment, 'Equipment updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/equipment/:id
const deleteEquipment = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id)
    if (!equipment) return notFound(res, 'Equipment not found')
    return success(res, null, 'Equipment deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createEquipment, getEquipment, getEquipmentById, updateEquipment, deleteEquipment }
