'use strict'

const { success, created, notFound } = require('../utils/apiResponse')

const createShift = async (req, res, next) => {
  try {
    const { Shift } = req.tenant.models
    const shift = await Shift.create({
      ...req.body,
      tenantId: req.user.tenantId,
    })
    return created(res, shift, 'Shift template created successfully')
  } catch (err) {
    next(err)
  }
}

const getShifts = async (req, res, next) => {
  try {
    const { Shift } = req.tenant.models
    const shifts = await Shift.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 }).lean()
    return success(res, shifts, 'Shifts fetched successfully')
  } catch (err) {
    next(err)
  }
}

const updateShift = async (req, res, next) => {
  try {
    const { Shift } = req.tenant.models
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true }
    ).lean()

    if (!shift) return notFound(res, 'Shift template not found')
    return success(res, shift, 'Shift updated successfully')
  } catch (err) {
    next(err)
  }
}

const deleteShift = async (req, res, next) => {
  try {
    const { Shift } = req.tenant.models
    const shift = await Shift.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!shift) return notFound(res, 'Shift template not found')
    return success(res, null, 'Shift deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { createShift, getShifts, updateShift, deleteShift }
