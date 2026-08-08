'use strict'

const mongoose = require('mongoose')

const EQUIPMENT_CATEGORIES = [
  'Camera', 'Lens', 'Flash', 'Tripod', 'Lighting',
  'Drone', 'Audio', 'Stabilizer', 'Bag', 'Other',
]
const AVAILABILITY_STATUSES = ['Available', 'Assigned', 'Maintenance', 'Unavailable']
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged']

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Equipment name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: EQUIPMENT_CATEGORIES, message: '{VALUE} is not a valid category' },
    },
    brand: { type: String, trim: true, default: null },
    model: { type: String, trim: true, default: null },
    serialNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: null,
    },
    purchaseDate: { type: Date, default: null },
    purchasePrice: { type: Number, default: 0, min: 0 },
    condition: {
      type: String,
      enum: { values: CONDITIONS, message: '{VALUE} is not a valid condition' },
      default: 'Good',
    },
    availability: {
      type: String,
      enum: { values: AVAILABILITY_STATUSES, message: '{VALUE} is not a valid availability status' },
      default: 'Available',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    notes: { type: String, trim: true, default: null },
    lastMaintenanceDate: { type: Date, default: null },
  },
  { timestamps: true }
)

equipmentSchema.index({ category: 1 })
equipmentSchema.index({ availability: 1 })
equipmentSchema.index({ assignedTo: 1 })
equipmentSchema.index({ name: 'text' })

equipmentSchema.set('toJSON', { virtuals: true, transform(doc, ret) { delete ret.__v; return ret } })

module.exports = mongoose.model('Equipment', equipmentSchema)
