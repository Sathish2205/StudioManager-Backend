'use strict'

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const ROLES = ['admin', 'manager', 'photographer', 'editor', 'staff']

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: { values: ROLES, message: '{VALUE} is not a valid role' },
      default: 'staff',
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare plain text with hashed password
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password)
}

// Sanitise output — remove __v
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.__v
    delete ret.password
    return ret
  },
})

userSchema.index({ role: 1 })

module.exports = mongoose.model('User', userSchema)
