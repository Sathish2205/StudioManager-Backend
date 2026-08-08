'use strict'

const mongoose = require('mongoose')

const EVENT_TYPES = [
  'Wedding',
  'Reception',
  'Engagement',
  'Pre Wedding',
  'Birthday',
  'Baby Shower',
  'Corporate',
  'Sangeet',
  'Mehendi',
  'Haldi',
  'Destination Wedding',
  'Gala Dinner',
  'Other',
]

const EVENT_STATUSES = ['Inquiry', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']

const eventSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: { values: EVENT_TYPES, message: '{VALUE} is not a valid event type' },
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    startTime: { type: String, trim: true, default: null },
    endTime: { type: String, trim: true, default: null },
    venue: { type: String, trim: true, default: null },
    venueAddress: { type: String, trim: true, default: null },
    guestCount: { type: Number, default: 0, min: 0 },
    package: { type: String, trim: true, default: null },
    packageAmount: {
      type: Number,
      required: [true, 'Package amount is required'],
      min: [0, 'Package amount cannot be negative'],
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: [0, 'Advance amount cannot be negative'],
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: function () {
        return this.packageAmount
      },
    },
    status: {
      type: String,
      enum: { values: EVENT_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Inquiry',
    },
    assignedPhotographers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    assignedEditors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    notes: { type: String, trim: true, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

// Indexes for common query patterns
eventSchema.index({ clientId: 1 })
eventSchema.index({ eventDate: 1 })
eventSchema.index({ status: 1 })
eventSchema.index({ eventType: 1 })
eventSchema.index({ eventDate: 1, status: 1 })
eventSchema.index({ eventName: 'text' })

eventSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Event', eventSchema)
