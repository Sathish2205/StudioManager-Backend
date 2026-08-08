'use strict'

const mongoose = require('mongoose')

const WORKFLOW_STAGES = [
  'Inquiry', 'Booking', 'Pre-Wedding', 'Photography',
  'Editing', 'Review', 'Album Design', 'Printing', 'Delivery', 'Completed',
]
const WORKFLOW_STATUSES = ['Pending', 'In Progress', 'Completed', 'On Hold']

const workflowSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    stage: {
      type: String,
      required: [true, 'Stage is required'],
      enum: { values: WORKFLOW_STAGES, message: '{VALUE} is not a valid stage' },
    },
    status: {
      type: String,
      enum: { values: WORKFLOW_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Pending',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    completedDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: null },
    order: { type: Number, default: 0 }, // display order within event pipeline
  },
  { timestamps: true }
)

workflowSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedDate) {
    this.completedDate = new Date()
  }
  next()
})

workflowSchema.index({ eventId: 1 })
workflowSchema.index({ eventId: 1, stage: 1 }, { unique: true })
workflowSchema.index({ status: 1 })
workflowSchema.index({ assignedTo: 1 })

workflowSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Workflow', workflowSchema)
