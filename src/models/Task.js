'use strict'

const mongoose = require('mongoose')

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled']

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, trim: true, default: null },
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
      enum: { values: TASK_PRIORITIES, message: '{VALUE} is not a valid priority' },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: { values: TASK_STATUSES, message: '{VALUE} is not a valid status' },
      default: 'Todo',
    },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
