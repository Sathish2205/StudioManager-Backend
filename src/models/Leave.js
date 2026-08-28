'use strict'

const mongoose = require('mongoose')

const LEAVE_TYPES = [
  'Casual Leave', 'Sick Leave', 'Paid Leave',
  'Unpaid Leave', 'Emergency Leave', 'Other',
]
const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled']

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
    leaveType: {
      type: String,
      required: [true, 'Leave type is required'],
      enum: { values: LEAVE_TYPES, message: '{VALUE} is not a valid leave type' },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    reason: {
      type: String,
      trim: true,
      required: [true, 'Reason is required'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    attachment: { type: String, default: null },
    status: {
      type: String,
      enum: { values: LEAVE_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approverNotes: { type: String, trim: true, default: null },
    approvedAt: { type: Date, default: null },
    totalDays: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
)

// Auto-calculate totalDays
leaveSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diffMs = this.endDate.getTime() - this.startDate.getTime()
    this.totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1)
  }
  next()
})

leaveSchema.index({ employeeId: 1 })
leaveSchema.index({ status: 1 })
leaveSchema.index({ startDate: 1, endDate: 1 })

leaveSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Leave', leaveSchema)
