'use strict'

const mongoose = require('mongoose')

const PAYMENT_TYPES = ['Advance', 'Installment', 'Final Payment', 'Refund']
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque', 'Online']

const paymentSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: { values: PAYMENT_METHODS, message: '{VALUE} is not a valid payment method' },
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
    },
    paymentType: {
      type: String,
      required: [true, 'Payment type is required'],
      enum: { values: PAYMENT_TYPES, message: '{VALUE} is not a valid payment type' },
    },
    notes: { type: String, trim: true, default: null },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
)

paymentSchema.index({ eventId: 1 })
paymentSchema.index({ clientId: 1 })
paymentSchema.index({ paymentDate: -1 })
paymentSchema.index({ paymentType: 1 })

paymentSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Payment', paymentSchema)
