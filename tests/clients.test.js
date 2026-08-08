'use strict'

const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/User')
const Client = require('../src/models/Client')

let token
let adminUserId
let createdClientId

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/photostudiopro_test'
  await mongoose.connect(mongoUri)

  // Create or find admin user
  let admin = await User.findOne({ email: 'test_client_admin@photostudiopro.com' })
  if (!admin) {
    admin = await User.create({
      name: 'Test Client Admin',
      email: 'test_client_admin@photostudiopro.com',
      password: 'testadmin123',
      role: 'admin',
    })
  }
  adminUserId = admin._id

  const loginRes = await request(app).post('/api/auth/login').send({ email: 'test_client_admin@photostudiopro.com', password: 'testadmin123' })
  token = loginRes.body.data.token
})

afterAll(async () => {
  await Client.deleteMany({ email: /^test_client_/i })
  await User.deleteMany({ email: 'test_client_admin@photostudiopro.com' })
  await mongoose.connection.close()
})

describe('Client API', () => {
  describe('POST /api/clients', () => {
    it('should create a client', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Test',
          lastName: 'ClientOne',
          phone: '+91 00000 11111',
          email: 'test_client_one@example.com',
          city: 'Bengaluru',
          state: 'Karnataka',
          status: 'lead',
          source: 'Direct',
        })
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.firstName).toBe('Test')
      createdClientId = res.body.data._id
    })

    it('should reject missing first name', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '+91 00000 22222' })
      expect(res.status).toBe(422)
    })

    it('should reject without auth', async () => {
      const res = await request(app).post('/api/clients').send({ firstName: 'NoAuth', phone: '1234' })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/clients', () => {
    it('should return paginated clients', async () => {
      const res = await request(app).get('/api/clients').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.pagination).toBeDefined()
      expect(res.body.pagination.page).toBe(1)
    })

    it('should filter by search', async () => {
      const res = await request(app).get('/api/clients?search=Test').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter by status', async () => {
      const res = await request(app).get('/api/clients?status=lead').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/clients/:id', () => {
    it('should return client with history', async () => {
      const res = await request(app).get(`/api/clients/${createdClientId}`).set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body.data.events).toBeDefined()
      expect(res.body.data.payments).toBeDefined()
      expect(res.body.data.totalSpent).toBeDefined()
    })

    it('should return 404 for invalid id', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app).get(`/api/clients/${fakeId}`).set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/clients/:id', () => {
    it('should update client', async () => {
      const res = await request(app)
        .put(`/api/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'active', city: 'Mumbai' })
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('active')
    })
  })

  describe('DELETE /api/clients/:id', () => {
    it('should delete client', async () => {
      const res = await request(app)
        .delete(`/api/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/clients/dropdown', () => {
    it('should return dropdown-formatted list', async () => {
      const res = await request(app).get('/api/clients/dropdown').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })
})
