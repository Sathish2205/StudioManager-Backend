'use strict'

const mongoose = require('mongoose')

const NOTIFICATION_TYPES = [
  'upcoming_event',
  'payment_received',
  'payment_pending',
  'task_assigned',
  'task_due',
  'workflow_deadline',
  'new_client',
  'general',
]

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: { values: NOTIFICATION_TYPES, message: '{VALUE} is not a valid notification type' },
      default: 'general',
    },
    isRead: { type: Boolean, default: false },
    relatedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
  },
  { timestamps: true }
)

notificationSchema.index({ userId: 1, isRead: 1 })
notificationSchema.index({ userId: 1, createdAt: -1 })

notificationSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Notification', notificationSchema)
