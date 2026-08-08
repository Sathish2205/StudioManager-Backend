'use strict'

const mongoose = require('mongoose')

const EMPLOYEE_ROLES = [
  'Photographer', 'Videographer', 'Editor', 'Designer',
  'Album Designer', 'Staff', 'Manager', 'Drone Pilot',
]

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: { values: EMPLOYEE_ROLES, message: '{VALUE} is not a valid role' },
    },
    specialization: { type: String, trim: true, default: null },
    joiningDate: { type: Date, default: null },
    salary: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active',
    },
    avatar: { type: String, default: null },
    notes: { type: String, trim: true, default: null },
  },
  { timestamps: true }
)

employeeSchema.index({ role: 1 })
employeeSchema.index({ status: 1 })
employeeSchema.index({ name: 'text' })

employeeSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Employee', employeeSchema)
