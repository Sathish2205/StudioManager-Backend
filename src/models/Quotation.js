'use strict'

const mongoose = require('mongoose')

const QUOTATION_STATUSES = ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired']

const serviceItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  qty: { type: Number, required: true, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { _id: false })

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      unique: true,
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    services: {
      type: [serviceItemSchema],
      required: true,
      validate: [arr => arr.length > 0, 'At least one service is required'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 18, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: { values: QUOTATION_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Draft',
    },
    notes: { type: String, trim: true, default: '' },
    terms: { type: String, trim: true, default: '• 50% advance required upon booking.\n• Balance payment before album printing & final delivery.\n• All payments via Bank Transfer, UPI, or Cheque.' },
    convertedToInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

quotationSchema.index({ clientId: 1 })
quotationSchema.index({ eventId: 1 })
quotationSchema.index({ status: 1 })
quotationSchema.index({ date: -1 })
quotationSchema.index({ quotationNumber: 1 })

quotationSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Quotation', quotationSchema)
