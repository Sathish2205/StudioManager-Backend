'use strict'

const mongoose = require('mongoose')
const { mongoUri, isDev } = require('./env')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })

    console.log(`✅  MongoDB connected: ${conn.connection.host} — DB: ${conn.connection.name}`)

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected')
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌  MongoDB error:', err.message)
    })

    if (isDev) {
      mongoose.set('debug', false) // set true to log queries in dev
    }
  } catch (err) {
    console.error(`❌  MongoDB connection failed: ${err.message}`)
    process.exit(1)
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
