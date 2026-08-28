'use strict'

const mongoose = require('mongoose')

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
      maxlength: [100, 'Shift name cannot exceed 100 characters'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    breakDuration: {
      type: Number,
      default: 60,
      min: 0,
      // in minutes
    },
    requiredMinutes: {
      type: Number,
      default: 480,
      min: 0,
      // 8 hours = 480 minutes
    },
    gracePeriod: {
      type: Number,
      default: 15,
      min: 0,
      // in minutes
    },
    overtimeEnabled: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: { type: String, trim: true, default: null },
  },
  { timestamps: true }
)

shiftSchema.index({ name: 1 })
shiftSchema.index({ isActive: 1 })

shiftSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Shift', shiftSchema)
