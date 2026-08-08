'use strict'

const mongoose = require('mongoose')

const EXPENSE_CATEGORIES = [
  'Equipment', 'Travel', 'Salary', 'Office', 'Marketing',
  'Album Printing', 'Editing', 'Meals', 'Utilities', 'Other',
]
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque']

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: EXPENSE_CATEGORIES, message: '{VALUE} is not a valid category' },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: { values: PAYMENT_METHODS, message: '{VALUE} is not a valid payment method' },
      default: 'Cash',
    },
    description: { type: String, trim: true, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

expenseSchema.index({ category: 1 })
expenseSchema.index({ expenseDate: -1 })
expenseSchema.index({ createdBy: 1 })

expenseSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Expense', expenseSchema)
