'use strict'

const app = require('./app')
const connectDB = require('./config/db')
const { port, nodeEnv } = require('./config/env')

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB()

    // Start Express server
    app.listen(port, () => {
      console.log('')
      console.log('╔══════════════════════════════════════════════════╗')
      console.log('║       📸 PhotoStudio Pro API Server             ║')
      console.log('╠══════════════════════════════════════════════════╣')
      console.log(`║  🌐  http://localhost:${port}                      ║`)
      console.log(`║  📋  Environment: ${nodeEnv.padEnd(28)}  ║`)
      console.log(`║  🔑  API Base: /api                              ║`)
      console.log(`║  💚  Health: http://localhost:${port}/api/health     ║`)
      console.log('╚══════════════════════════════════════════════════╝')
      console.log('')
    })
  } catch (err) {
    console.error('❌  Failed to start server:', err.message)
    process.exit(1)
  }
}

startServer()
