'use strict'

const mongoose = require('mongoose')

const EMPLOYEE_ROLES = [
  'Photographer', 'Videographer', 'Photo Editor', 'Video Editor',
  'Album Designer', 'Editor', 'Designer', 'Manager', 'Assistant',
  'Driver', 'Accountant', 'Drone Pilot', 'Staff', 'Other',
]

const EMPLOYMENT_TYPES = ['Full Time', 'Part Time', 'Freelancer', 'Contract']

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
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
    employmentType: {
      type: String,
      enum: { values: EMPLOYMENT_TYPES, message: '{VALUE} is not a valid employment type' },
      default: 'Full Time',
    },
    specialization: { type: String, trim: true, default: null },
    joiningDate: { type: Date, default: null },
    salary: { type: Number, default: 0, min: 0 },
    workingHours: { type: String, trim: true, default: '09:00 AM - 06:00 PM' },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null,
    },
    address: { type: String, trim: true, default: null },
    emergencyContact: {
      name: { type: String, trim: true, default: null },
      phone: { type: String, trim: true, default: null },
      relation: { type: String, trim: true, default: null },
    },
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

// Auto-generate employeeId before save
employeeSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments()
    this.employeeId = `EMP-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

employeeSchema.index({ role: 1 })
employeeSchema.index({ status: 1 })
employeeSchema.index({ employmentType: 1 })
employeeSchema.index({ name: 'text' })
employeeSchema.index({ employeeId: 1 })

employeeSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Employee', employeeSchema)
