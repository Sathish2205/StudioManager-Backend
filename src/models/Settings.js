'use strict'

const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema(
  {
    studioName: { type: String, default: 'PhotoStudio Pro' },
    studioEmail: { type: String, default: null },
    studioPhone: { type: String, default: null },
    studioAddress: { type: String, default: null },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    gstEnabled: { type: Boolean, default: true },
    gstNumber: { type: String, default: null },
    gstRate: { type: Number, default: 18 },
    defaultAdvancePercent: { type: Number, default: 30 },
    packages: [
      {
        id: String,
        name: String,
        price: Number,
        description: String,
        features: [String],
      },
    ],
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '20:00' },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
)

// Singleton pattern: only one settings doc
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({
      packages: [
        { id: 'PKG-01', name: 'Royal Cinematic 4K', price: 850000, description: 'Premium 4K cinematic wedding coverage', features: ['4K Video', '2 Photographers', 'Drone Shots', 'Highlight Reel'] },
        { id: 'PKG-02', name: 'Heritage Multi-Day Gold', price: 620000, description: 'Multi-day event coverage package', features: ['Multi-Day', 'Photo + Video', 'Same Day Edit', 'Drone'] },
        { id: 'PKG-03', name: 'Destination Luxe Film', price: 1200000, description: 'Luxury destination wedding package', features: ['International Travel', '4K Film', 'Pre-Wedding', 'Aerial Shots'] },
        { id: 'PKG-04', name: 'Classic Memories Package', price: 350000, description: 'Essential photography for special moments', features: ['Photography', '1 Photographer', 'Edited Album', 'USB Drive'] },
        { id: 'PKG-05', name: 'Signature Cinema + Album', price: 580000, description: 'Cinema quality film with luxury album', features: ['Cinematic Video', 'Luxury Album', 'Photo Gallery', 'Online Gallery'] },
      ],
    })
  }
  return settings
}

module.exports = mongoose.model('Settings', settingsSchema)
