'use strict'

const { success } = require('../utils/apiResponse')

const getCalendarEvents = async (req, res, next) => {
  try {
    const { Event } = req.tenant.models
    const events = await Event.find({ tenantId: req.user.tenantId })
      .select('eventName eventType eventDate endDate venue status packageAmount totalPaid remainingAmount assignedPhotographers assignedEditors')
      .populate('clientId', 'firstName lastName phone')
      .sort({ eventDate: 1 })
      .lean()

    return success(res, events, 'Calendar events fetched')
  } catch (err) {
    next(err)
  }
}

module.exports = { getCalendarEvents }
