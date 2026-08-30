'use strict'

const { success, created, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

const createEquipment = async (req, res, next) => {
  try {
    const { Equipment } = req.tenant.models
    const equipment = await Equipment.create({
      ...req.body,
      tenantId: req.user.tenantId,
    })
    return created(res, equipment, 'Equipment created successfully')
  } catch (err) {
    next(err)
  }
}

const getEquipment = async (req, res, next) => {
  try {
    const { Equipment } = req.tenant.models
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = { tenantId: req.user.tenantId }

    if (req.query.category) filter.category = req.query.category
    if (req.query.availability) filter.availability = req.query.availability

    const [equipment, total] = await Promise.all([
      Equipment.find(filter)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Equipment.countDocuments(filter),
    ])

    return success(res, equipment, 'Equipment list fetched', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

const updateEquipment = async (req, res, next) => {
  try {
    const { Equipment } = req.tenant.models
    const equipment = await Equipment.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()

    if (!equipment) return notFound(res, 'Equipment not found')
    return success(res, equipment, 'Equipment updated successfully')
  } catch (err) {
    next(err)
  }
}

const deleteEquipment = async (req, res, next) => {
  try {
    const { Equipment } = req.tenant.models
    const equipment = await Equipment.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!equipment) return notFound(res, 'Equipment not found')
    return success(res, null, 'Equipment deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createEquipment, getEquipment, updateEquipment, deleteEquipment }
