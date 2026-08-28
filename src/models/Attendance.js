'use strict'

const mongoose = require('mongoose')

const ATTENDANCE_STATUSES = [
  'Present', 'Late', 'Absent', 'On Leave', 'Half Day',
  'Early Checkout', 'Holiday', 'Weekend',
]

const breakSchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
  },
  { _id: true }
)

const adjustmentSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String, trim: true, default: null },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modifiedAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null,
    },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    breaks: [breakSchema],
    workingMinutes: { type: Number, default: 0, min: 0 },
    overtimeMinutes: { type: Number, default: 0, min: 0 },
    lateMinutes: { type: Number, default: 0, min: 0 },
    totalBreakMinutes: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: { values: ATTENDANCE_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Absent',
    },
    notes: { type: String, trim: true, default: null },
    isOnBreak: { type: Boolean, default: false },
    manualAdjustments: [adjustmentSchema],
  },
  { timestamps: true }
)

// Compound unique index: one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true })
attendanceSchema.index({ date: 1 })
attendanceSchema.index({ status: 1 })
attendanceSchema.index({ employeeId: 1 })

attendanceSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Attendance', attendanceSchema)
