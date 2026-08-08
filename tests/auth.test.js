'use strict'

const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/User')

// Connect before all tests, disconnect after
beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/photostudiopro_test'
  await mongoose.connect(mongoUri)
})

afterAll(async () => {
  // Clean up test users
  await User.deleteMany({ email: /^test_auth_/i })
  await mongoose.connection.close()
})

describe('Auth API', () => {
  const testUser = {
    name: 'Test Auth User',
    email: 'test_auth_jest@photostudiopro.com',
    password: 'testpass123',
    phone: '+91 99999 00001',
    role: 'staff',
  }

  let token

  // ── REGISTER ──
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser)
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()
      expect(res.body.data.user.email).toBe(testUser.email)
      expect(res.body.data.user.password).toBeUndefined()
      token = res.body.data.token
    })

    it('should reject duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser)
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('should reject missing email', async () => {
      const res = await request(app).post('/api/auth/register').send({ name: 'No Email', password: '123456' })
      expect(res.status).toBe(422)
      expect(res.body.success).toBe(false)
    })

    it('should reject short password', async () => {
      const res = await request(app).post('/api/auth/register').send({ name: 'Short', email: 'test_auth_short@photostudiopro.com', password: '123' })
      expect(res.status).toBe(422)
      expect(res.body.errors).toBeDefined()
    })
  })

  // ── LOGIN ──
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()
      token = res.body.data.token
    })

    it('should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'wrongpassword' })
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'noone@example.com', password: '123456' })
      expect(res.status).toBe(401)
    })
  })

  // ── PROTECTED ROUTES ──
  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body.data.email).toBe(testUser.email)
      expect(res.body.data.password).toBeUndefined()
    })

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
    })

    it('should reject invalid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken123')
      expect(res.status).toBe(401)
    })
  })

  // ── CHANGE PASSWORD ──
  describe('PUT /api/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: testUser.password, newPassword: 'newpass123' })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('should login with new password', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'newpass123' })
      expect(res.status).toBe(200)
    })

    it('should reject wrong current password', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'newpass123' })
      const newToken = loginRes.body.data.token
      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${newToken}`)
        .send({ currentPassword: 'wrongcurrent', newPassword: 'another123' })
      expect(res.status).toBe(400)
    })
  })
})
