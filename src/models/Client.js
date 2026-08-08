'use strict'

const mongoose = require('mongoose')

const CLIENT_STATUSES = ['lead', 'active', 'completed', 'inactive']
const SOURCES = ['Direct', 'Referral', 'Social Media', 'Website', 'Instagram', 'Google', 'Walk-in', 'Other']
const PHOTOGRAPHY_STYLES = ['Traditional', 'Cinematic', 'Candid', 'Documentary', 'Fine Art', 'Editorial', 'Lifestyle', 'Other']

const clientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [60, 'First name cannot exceed 60 characters'],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [60, 'Last name cannot exceed 60 characters'],
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      default: null,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: null,
    },
    address: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    pincode: { type: String, trim: true, default: null },
    dateOfBirth: { type: Date, default: null },
    anniversaryDate: { type: Date, default: null },
    source: {
      type: String,
      enum: { values: SOURCES, message: '{VALUE} is not a valid source' },
      default: 'Direct',
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    notes: { type: String, trim: true, default: null },
    favoritePhotographyStyle: {
      type: String,
      enum: { values: PHOTOGRAPHY_STYLES, message: '{VALUE} is not a valid style' },
      default: 'Traditional',
    },
    status: {
      type: String,
      enum: { values: CLIENT_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'lead',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

// Virtual: full name
clientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim()
})

clientSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })
clientSchema.set('toObject', { virtuals: true })

// Indexes
clientSchema.index({ phone: 1 })
clientSchema.index({ email: 1 })
clientSchema.index({ status: 1 })
clientSchema.index({ firstName: 'text', lastName: 'text', phone: 'text' })

module.exports = mongoose.model('Client', clientSchema)
