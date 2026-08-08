'use strict'

const Event = require('../models/Event')
const { success } = require('../utils/apiResponse')

// GET /api/calendar/events
const getCalendarEvents = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query

    const filter = {}
    if (startDate || endDate) {
      filter.eventDate = {}
      if (startDate) filter.eventDate.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filter.eventDate.$lte = end
      }
    }

    const events = await Event.find(filter)
      .populate('clientId', 'firstName lastName phone')
      .populate('assignedPhotographers', 'name role avatar')
      .sort({ eventDate: 1 })
      .lean()

    // Map to calendar-friendly format
    const calendarEvents = events.map(evt => {
      const start = new Date(evt.eventDate)
      const end = evt.endDate ? new Date(evt.endDate) : new Date(evt.eventDate)

      // Set start time if available
      if (evt.startTime) {
        const [time, period] = evt.startTime.split(' ')
        const [h, m] = time.split(':')
        let hours = parseInt(h)
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        start.setHours(hours, parseInt(m || 0))
      }

      if (evt.endTime) {
        const [time, period] = evt.endTime.split(' ')
        const [h, m] = time.split(':')
        let hours = parseInt(h)
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        end.setHours(hours, parseInt(m || 0))
      }

      return {
        id: evt._id,
        title: evt.eventName,
        start: start.toISOString(),
        end: end.toISOString(),
        eventType: evt.eventType,
        status: evt.status,
        clientId: evt.clientId?._id,
        clientName: evt.clientId ? `${evt.clientId.firstName} ${evt.clientId.lastName}` : null,
        venue: evt.venue,
        package: evt.package,
        packageAmount: evt.packageAmount,
        remainingAmount: evt.remainingAmount,
        crew: evt.assignedPhotographers,
        notes: evt.notes,
        progress: evt.status === 'Completed' ? 100 : evt.status === 'In Progress' ? 50 : 0,
        // Extra fields frontend uses
        date: evt.eventDate,
        startDate: evt.eventDate,
        endDate: evt.endDate,
        startTime: evt.startTime,
        endTime: evt.endTime,
        couple: evt.clientId ? `${evt.clientId.firstName} ${evt.clientId.lastName}` : null,
      }
    })

    return success(res, calendarEvents, 'Calendar events fetched successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/calendar/events/:id — full event detail for calendar click
const getCalendarEventDetail = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('clientId', 'firstName lastName phone email')
      .populate('assignedPhotographers', 'name role avatar')
      .populate('assignedEditors', 'name role avatar')
      .lean()

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found', data: null })
    }

    return success(res, event, 'Event detail fetched successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/calendar/check-conflicts
// Query: date, photographerIds (comma-separated)
const checkConflicts = async (req, res, next) => {
  try {
    const { date, photographerIds, excludeEventId } = req.query
    if (!date) return success(res, { hasConflict: false, conflicts: [] }, 'No date provided')

    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    const filter = {
      eventDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled'] },
    }
    if (excludeEventId) filter._id = { $ne: excludeEventId }

    const eventsOnDay = await Event.find(filter)
      .populate('assignedPhotographers', 'name')
      .lean()

    if (!photographerIds) {
      return success(res, { hasConflict: false, conflicts: [], eventsOnDay }, 'Conflict check complete')
    }

    const reqIds = photographerIds.split(',').map(id => id.trim())
    const conflicts = eventsOnDay.filter(e =>
      e.assignedPhotographers.some(p => reqIds.includes(String(p._id)))
    )

    return success(res, {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.map(e => ({ id: e._id, eventName: e.eventName, venue: e.venue })),
      eventsOnDay,
    }, 'Conflict check complete')
  } catch (err) {
    next(err)
  }
}

module.exports = { getCalendarEvents, getCalendarEventDetail, checkConflicts }
