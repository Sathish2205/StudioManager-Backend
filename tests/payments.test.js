'use strict'

const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')
const User = require('../src/models/User')
const Client = require('../src/models/Client')
const Event = require('../src/models/Event')
const Payment = require('../src/models/Payment')

let token, testClientId, testEventId

beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/photostudiopro_test'
  await mongoose.connect(mongoUri)

  let admin = await User.findOne({ email: 'test_pay_admin@photostudiopro.com' })
  if (!admin) {
    admin = await User.create({ name: 'Test Pay Admin', email: 'test_pay_admin@photostudiopro.com', password: 'test123', role: 'admin' })
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email: 'test_pay_admin@photostudiopro.com', password: 'test123' })
  token = loginRes.body.data.token

  let client = await Client.findOne({ email: 'test_pay_client@example.com' })
  if (!client) {
    client = await Client.create({ firstName: 'PayTest', lastName: 'Client', phone: '+91 00000 88888', email: 'test_pay_client@example.com', createdBy: admin._id })
  }
  testClientId = client._id

  let event = await Event.findOne({ eventName: 'Payment Test Event' })
  if (!event) {
    event = await Event.create({
      clientId: testClientId, eventType: 'Wedding', eventName: 'Payment Test Event',
      eventDate: new Date('2026-10-01'), packageAmount: 500000, advanceAmount: 0,
      totalPaid: 0, remainingAmount: 500000, status: 'Confirmed', createdBy: admin._id,
    })
  }
  testEventId = event._id
})

afterAll(async () => {
  await Payment.deleteMany({ eventId: testEventId })
  await Event.deleteOne({ _id: testEventId })
  await Client.deleteMany({ email: 'test_pay_client@example.com' })
  await User.deleteMany({ email: 'test_pay_admin@photostudiopro.com' })
  await mongoose.connection.close()
})

describe('Payment API & Balance Calculation', () => {
  let paymentId

  it('should create first payment and update event balance', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: testEventId,
        clientId: testClientId,
        amount: 150000,
        paymentType: 'Advance',
        paymentMethod: 'UPI',
        paymentDate: '2026-09-01',
      })
    expect(res.status).toBe(201)
    paymentId = res.body.data._id

    // Verify event balance was recalculated
    const event = await Event.findById(testEventId)
    expect(event.totalPaid).toBe(150000)
    expect(event.remainingAmount).toBe(350000)
  })

  it('should create second payment and update balance cumulatively', async () => {
    await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: testEventId,
        clientId: testClientId,
        amount: 200000,
        paymentType: 'Installment',
        paymentMethod: 'Bank Transfer',
        paymentDate: '2026-09-15',
      })

    const event = await Event.findById(testEventId)
    expect(event.totalPaid).toBe(350000)
    expect(event.remainingAmount).toBe(150000)
  })

  it('should delete first payment and recalculate balance', async () => {
    await request(app)
      .delete(`/api/payments/${paymentId}`)
      .set('Authorization', `Bearer ${token}`)

    const event = await Event.findById(testEventId)
    expect(event.totalPaid).toBe(200000)
    expect(event.remainingAmount).toBe(300000)
  })

  it('should return paginated payments', async () => {
    const res = await request(app).get('/api/payments').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.pagination).toBeDefined()
  })

  it('should filter payments by event', async () => {
    const res = await request(app).get(`/api/payments?eventId=${testEventId}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)
  })
})
