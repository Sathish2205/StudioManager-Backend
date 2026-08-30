'use strict'

const { success } = require('../utils/apiResponse')

const getSettings = async (req, res, next) => {
  try {
    const { Settings } = req.tenant.models
    let settings = await Settings.findOne({ tenantId: req.user.tenantId }).lean()
    if (!settings) {
      settings = await Settings.create({
        tenantId: req.user.tenantId,
        studioName: req.tenant.companyName,
      })
    }
    return success(res, settings, 'Settings retrieved')
  } catch (err) {
    next(err)
  }
}

const updateSettings = async (req, res, next) => {
  try {
    const { Settings } = req.tenant.models
    let settings = await Settings.findOneAndUpdate(
      { tenantId: req.user.tenantId },
      req.body,
      { new: true, upsert: true }
    ).lean()

    return success(res, settings, 'Settings updated successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { getSettings, updateSettings }
