'use strict'

require('dotenv').config()

/**
 * Centralised environment variable exports.
 * All modules should import from here — never from process.env directly.
 */
module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/photostudiopro_master',
  masterDbName: process.env.MASTER_DB_NAME || 'photostudiopro_master',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_master_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshSecret: process.env.REFRESH_SECRET || 'super_secret_refresh_jwt_key_2026',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '30d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
}
