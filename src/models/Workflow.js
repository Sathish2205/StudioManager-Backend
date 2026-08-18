'use strict'

const mongoose = require('mongoose')

const WORKFLOW_STAGES = [
  'Booking', 'Advance Payment', 'Event Assigned', 'Event Completed',
  'Photo Backup', 'Photo Selection', 'Photo Editing', 'Client Review',
  'Revision (Optional)', 'Final Approval', 'Album Design', 'Album Approval',
  'Album Printing', 'Frame Printing (Optional)', 'Video Editing',
  'Video Rendering', 'Deliverables Ready', 'Balance Payment', 'Delivered', 'Completed',
]
const WORKFLOW_STATUSES = ['Pending', 'In Progress', 'Completed', 'On Hold']
const OVERALL_STATUSES = ['Booking', 'Editing', 'Delivered', 'Completed']

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
    overallStatus: {
      type: String,
      enum: { values: OVERALL_STATUSES, message: '{VALUE} is not a valid overall status' },
      default: 'Booking',
    },
    currentStageIndex: {
      type: Number,
      default: 0,
      min: 0,
      max: 19,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    assignedEditor: {
      type: String,
      trim: true,
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
