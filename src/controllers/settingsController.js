'use strict'

const Settings = require('../models/Settings')
const { success } = require('../utils/apiResponse')

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings()
    return success(res, settings, 'Settings fetched successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne()
    if (!settings) settings = new Settings()

    Object.assign(settings, req.body)
    settings.updatedBy = req.user._id
    await settings.save()

    return success(res, settings, 'Settings updated successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/settings/packages — packages dropdown for frontend forms
const getPackages = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings()
    const packages = (settings.packages || []).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description || '',
      features: p.features || [],
      label: `${p.name} (₹${p.price?.toLocaleString('en-IN') || 0})`,
    }))
    return success(res, packages, 'Packages fetched successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = { getSettings, updateSettings, getPackages }
