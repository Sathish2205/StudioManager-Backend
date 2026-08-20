'use strict'

const mongoose = require('mongoose')

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const TASK_STATUSES = [
  'To Do',
  'Culling',
  'Editing & Album Design',
  'Quality Check',
  'Final Approval',
  'Production',
  'Ready for Delivery',
  'Delivered',
  'Todo',
  'In Progress',
  'Completed',
  'Cancelled',
  'New',
  'Shoot Completed',
  'Editing Completed',
  'Review',
  'On Hold'
]

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, trim: true, default: null },
    eventName: { type: String, trim: true, default: null },
    clientName: { type: String, trim: true, default: null },
    deliverableType: { type: String, trim: true, default: 'Edited Photos' },
    assignedEditor: { type: String, trim: true, default: 'Deepa (Lead Editor)' },
    progress: { type: Number, default: 0 },
    notes: { type: String, trim: true, default: null },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    priority: {
      type: String,
      default: 'Medium',
    },
    status: {
      type: String,
      default: 'To Do',
    },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
)

taskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date()
  }
  next()
})

taskSchema.index({ assignedTo: 1 })
taskSchema.index({ eventId: 1 })
taskSchema.index({ status: 1 })
taskSchema.index({ dueDate: 1 })
taskSchema.index({ priority: 1 })

taskSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Task', taskSchema)
