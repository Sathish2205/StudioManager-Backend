'use strict'

const { success } = require('../utils/apiResponse')

const getNotifications = async (req, res, next) => {
  try {
    const { Notification } = req.tenant.models
    const notifications = await Notification.find({ tenantId: req.user.tenantId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return success(res, notifications, 'Notifications fetched')
  } catch (err) {
    next(err)
  }
}

const markAsRead = async (req, res, next) => {
  try {
    const { Notification } = req.tenant.models
    await Notification.updateOne({ _id: req.params.id, tenantId: req.user.tenantId }, { isRead: true })
    return success(res, null, 'Notification marked as read')
  } catch (err) {
    next(err)
  }
}

module.exports = { getNotifications, markAsRead }
