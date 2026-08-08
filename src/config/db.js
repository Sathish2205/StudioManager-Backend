'use strict'

const mongoose = require('mongoose')
const { mongoUri, isDev } = require('./env')

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB database…')
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log(`✅  MongoDB connected: ${conn.connection.host} — DB: ${conn.connection.name}`)
  } catch (primaryErr) {
    console.warn(`⚠️  Primary MongoDB connection failed: ${primaryErr.message}`)
    
    // Local fallback if Atlas fails (e.g. IP whitelist / network issue)
    const localUri = 'mongodb://127.0.0.1:27017/photostudiopro'
    console.log(`🔄 Attempting fallback connection to local MongoDB (${localUri})…`)
    
    try {
      const conn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000,
      })
      console.log(`✅  MongoDB Local Fallback connected: ${conn.connection.host} — DB: ${conn.connection.name}`)
    } catch (fallbackErr) {
      console.error(`❌  MongoDB connection failed completely:`)
      console.error(`   Primary: ${primaryErr.message}`)
      console.error(`   Fallback: ${fallbackErr.message}`)
      console.error(`👉 Note: If using MongoDB Atlas, make sure your IP is whitelisted at https://cloud.mongodb.com`)
      process.exit(1)
    }
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected')
  })

  mongoose.connection.on('error', (err) => {
    console.error('❌  MongoDB error:', err.message)
  })

  if (isDev) {
    mongoose.set('debug', false)
  }
}

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑  ${signal} received — closing MongoDB connection…`)
  await mongoose.connection.close()
  console.log('✅  MongoDB connection closed.')
  process.exit(0)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

module.exports = connectDB
