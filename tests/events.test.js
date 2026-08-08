'use strict'

const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/User')
const Client = require('../src/models/Client')
const Event = require('../src/models/Event')
const Workflow = require('../src/models/Workflow')

let token, testClientId, createdEventId

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/photostudiopro_test'
  await mongoose.connect(mongoUri)

  let admin = await User.findOne({ email: 'test_event_admin@photostudiopro.com' })
  if (!admin) {
    admin = await User.create({ name: 'Test Event Admin', email: 'test_event_admin@photostudiopro.com', password: 'test123', role: 'admin' })
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email: 'test_event_admin@photostudiopro.com', password: 'test123' })
  token = loginRes.body.data.token

  let client = await Client.findOne({ email: 'test_event_client@example.com' })
  if (!client) {
    client = await Client.create({ firstName: 'EventTest', lastName: 'Client', phone: '+91 00000 99999', email: 'test_event_client@example.com', createdBy: admin._id })
  }
  testClientId = client._id
})

afterAll(async () => {
  if (createdEventId) {
    await Event.deleteOne({ _id: createdEventId })
    await Workflow.deleteMany({ eventId: createdEventId })
  }
  await Client.deleteMany({ email: 'test_event_client@example.com' })
  await User.deleteMany({ email: 'test_event_admin@photostudiopro.com' })
  await mongoose.connection.close()
})

describe('Event API', () => {
  describe('POST /api/events', () => {
    it('should create an event and auto-generate workflow', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: testClientId,
          eventType: 'Wedding',
          eventName: 'Jest Test Wedding',
          eventDate: '2026-09-15',
          venue: 'Test Venue',
          package: 'Classic Memories Package',
          packageAmount: 350000,
          advanceAmount: 100000,
        })
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBeDefined()
      createdEventId = res.body.data.id

      // Check workflows were auto-created
      const workflows = await Workflow.find({ eventId: createdEventId })
      expect(workflows.length).toBe(10) // 10 stages
    })

    it('should calculate remaining amount correctly', async () => {
      const evt = await Event.findById(createdEventId)
      expect(evt.packageAmount).toBe(350000)
      expect(evt.totalPaid).toBe(100000)
      expect(evt.remainingAmount).toBe(250000)
    })

    it('should reject invalid client ID', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ clientId: new mongoose.Types.ObjectId(), eventType: 'Wedding', eventName: 'Bad Client', eventDate: '2026-09-20', packageAmount: 100000 })
      expect(res.status).toBe(400)
    })

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ eventType: 'Wedding' })
      expect(res.status).toBe(422)
    })
  })

  describe('GET /api/events', () => {
    it('should return paginated events', async () => {
      const res = await request(app).get('/api/events').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.pagination).toBeDefined()
    })

    it('should filter by status', async () => {
      const res = await request(app).get('/api/events?status=Inquiry').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/events/:id', () => {
    it('should return event with payments, workflows, and tasks', async () => {
      const res = await request(app).get(`/api/events/${createdEventId}`).set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body.data.workflows).toBeDefined()
      expect(res.body.data.payments).toBeDefined()
      expect(res.body.data.tasks).toBeDefined()
    })
  })

  describe('PUT /api/events/:id', () => {
    it('should update event status', async () => {
      const res = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Confirmed' })
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('Confirmed')
    })
  })
})
