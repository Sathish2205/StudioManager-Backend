'use strict'

const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/User')

let token

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/photostudiopro_test'
  await mongoose.connect(mongoUri)

  let admin = await User.findOne({ email: 'test_dash_admin@photostudiopro.com' })
  if (!admin) {
    admin = await User.create({ name: 'Test Dash Admin', email: 'test_dash_admin@photostudiopro.com', password: 'test123', role: 'admin' })
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email: 'test_dash_admin@photostudiopro.com', password: 'test123' })
  token = loginRes.body.data.token
})

afterAll(async () => {
  await User.deleteMany({ email: 'test_dash_admin@photostudiopro.com' })
  await mongoose.connection.close()
})

describe('Dashboard API', () => {
  it('should return dashboard data with all KPIs', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const data = res.body.data
    expect(typeof data.totalClients).toBe('number')
    expect(typeof data.totalEvents).toBe('number')
    expect(typeof data.totalRevenue).toBe('number')
    expect(typeof data.totalExpenses).toBe('number')
    expect(typeof data.netProfit).toBe('number')
    expect(typeof data.pendingPayments).toBe('number')
    expect(typeof data.upcomingEvents).toBe('number')
    expect(typeof data.completedEvents).toBe('number')
    expect(Array.isArray(data.monthlyChart)).toBe(true)
    expect(data.monthlyChart.length).toBe(12)
    expect(Array.isArray(data.recentClients)).toBe(true)
    expect(Array.isArray(data.recentPayments)).toBe(true)
    expect(Array.isArray(data.eventStatusCounts)).toBe(true)
  })

  it('should reject without authentication', async () => {
    const res = await request(app).get('/api/dashboard')
    expect(res.status).toBe(401)
  })
})

describe('Health Check', () => {
  it('should return server health status', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toContain('running')
  })
})

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})
