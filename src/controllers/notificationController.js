'use strict'

const Notification = require('../models/Notification')
const { success, notFound } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination({ ...req.query, sortBy: 'createdAt', sortOrder: 'desc' })
    const filter = { userId: req.user._id }

    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true'
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('relatedEventId', 'eventName eventDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ])

    return success(res, { notifications, unreadCount }, 'Notifications fetched', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    ).lean()

    if (!notification) return notFound(res, 'Notification not found')
    return success(res, notification, 'Notification marked as read')
  } catch (err) {
    next(err)
  }
}

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true })
    return success(res, null, 'All notifications marked as read')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    })
    if (!notification) return notFound(res, 'Notification not found')
    return success(res, null, 'Notification deleted')
  } catch (err) {
    next(err)
  }
}

// Utility: Create notification for a user (called from other controllers)
const createNotification = async ({ userId, title, message, type, relatedEventId }) => {
  try {
    await Notification.create({ userId, title, message, type: type || 'general', relatedEventId: relatedEventId || null })
  } catch (err) {
    console.error('Failed to create notification:', err.message)
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification }
