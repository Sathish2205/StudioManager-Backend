'use strict'

const mongoose = require('mongoose')

const INVOICE_STATUSES = ['Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue']

const serviceItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  qty: { type: Number, required: true, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
}, { _id: false })

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
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
    totalPaid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: { values: INVOICE_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Draft',
    },
    paymentTerms: { type: String, trim: true, default: '• 50% advance required upon booking.\n• Balance payment before album printing & final delivery.\n• All payments via Bank Transfer, UPI, or Cheque.' },
    bankDetails: { type: String, trim: true, default: 'Bank: State Bank of India\nA/C: 1234567890\nIFSC: SBIN0001234\nUPI: photostudiopro@sbi' },
    notes: { type: String, trim: true, default: '' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

invoiceSchema.index({ clientId: 1 })
invoiceSchema.index({ eventId: 1 })
invoiceSchema.index({ quotationId: 1 })
invoiceSchema.index({ status: 1 })
invoiceSchema.index({ date: -1 })
invoiceSchema.index({ invoiceNumber: 1 })

invoiceSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Invoice', invoiceSchema)
