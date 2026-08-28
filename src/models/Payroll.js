'use strict'

const mongoose = require('mongoose')

const PAYROLL_STATUSES = ['Draft', 'Generated', 'Approved', 'Paid']

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    baseSalary: { type: Number, default: 0, min: 0 },
    workingDays: { type: Number, default: 0, min: 0 },
    presentDays: { type: Number, default: 0, min: 0 },
    absentDays: { type: Number, default: 0, min: 0 },
    paidLeaveDays: { type: Number, default: 0, min: 0 },
    unpaidLeaveDays: { type: Number, default: 0, min: 0 },
    lateDays: { type: Number, default: 0, min: 0 },
    totalWorkingMinutes: { type: Number, default: 0, min: 0 },
    overtimeMinutes: { type: Number, default: 0, min: 0 },
    overtimeAmount: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    netSalary: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: { values: PAYROLL_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Draft',
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: { type: String, trim: true, default: null },
  },
  { timestamps: true }
)

// One payroll per employee per month
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true })
payrollSchema.index({ month: 1, year: 1 })
payrollSchema.index({ status: 1 })

payrollSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Payroll', payrollSchema)
