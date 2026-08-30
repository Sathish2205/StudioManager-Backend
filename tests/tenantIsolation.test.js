'use strict'

const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')
const Tenant = require('../src/models/master/Tenant')
const MasterUser = require('../src/models/master/User')
const { getTenantDatabase, clearConnectionCache } = require('../src/services/tenantDatabase')
const { mongoUri } = require('../src/config/env')

describe('🔒 Multi-Tenant Authentication & Data Isolation Test Suite', () => {
  let tokenA, tokenB, userA, userB, tenantA, tenantB
  let clientA_Id, clientB_Id

  const runId = Date.now().toString().slice(-5)
  const tenantIdA = `TENANT_T1_${runId}`
  const tenantIdB = `TENANT_T2_${runId}`
  const emailA = `testA_${runId}@companya.com`
  const emailB = `testB_${runId}@companyb.com`

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri)
    }

    await clearConnectionCache()

    // Create Master Tenants
    tenantA = await Tenant.create({
      tenantId: tenantIdA,
      companyName: 'Company A Studios',
      slug: `company-a-${runId}`,
      databaseName: `tenant_t1_${runId}`,
      status: 'active',
      contactEmail: emailA,
    })

    tenantB = await Tenant.create({
      tenantId: tenantIdB,
      companyName: 'Company B Studios',
      slug: `company-b-${runId}`,
      databaseName: `tenant_t2_${runId}`,
      status: 'active',
      contactEmail: emailB,
    })

    // Create Master Users
    userA = await MasterUser.create({
      userId: `USER_T1_${runId}`,
      tenantId: tenantIdA,
      name: 'Alice Owner A',
      username: emailA,
      email: emailA,
      passwordHash: 'password123',
      role: 'owner',
      status: 'active',
    })

    userB = await MasterUser.create({
      userId: `USER_T2_${runId}`,
      tenantId: tenantIdB,
      name: 'Bob Owner B',
      username: emailB,
      email: emailB,
      passwordHash: 'password123',
      role: 'owner',
      status: 'active',
    })

    // Initialize tenant test databases
    const ctxA = await getTenantDatabase(tenantIdA)
    const ctxB = await getTenantDatabase(tenantIdB)
    await ctxA.models.Client.deleteMany({})
    await ctxB.models.Client.deleteMany({})

    // Login User A
    const resA = await request(app)
      .post('/api/auth/login')
      .send({ username: emailA, password: 'password123' })
    expect(resA.status).toBe(200)
    expect(resA.body.data.token).toBeDefined()
    tokenA = resA.body.data.token

    // Login User B
    const resB = await request(app)
      .post('/api/auth/login')
      .send({ username: emailB, password: 'password123' })
    expect(resB.status).toBe(200)
    expect(resB.body.data.token).toBeDefined()
    tokenB = resB.body.data.token
  })

  afterAll(async () => {
    await clearConnectionCache()
    await mongoose.connection.close()
  })

  test('1. User A can create Customer A in Tenant A database', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        firstName: 'CustomerA_Secret',
        lastName: 'CompanyA',
        phone: '+91 99000 11111',
        email: `customera_${runId}@companya.com`,
      })

    expect(res.status).toBe(201)
    expect(res.body.data._id).toBeDefined()
    clientA_Id = res.body.data._id
  })

  test('2. User B can create Customer B in Tenant B database', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        firstName: 'CustomerB_Secret',
        lastName: 'CompanyB',
        phone: '+91 99000 22222',
        email: `customerb_${runId}@companyb.com`,
      })

    expect(res.status).toBe(201)
    expect(res.body.data._id).toBeDefined()
    clientB_Id = res.body.data._id
  })

  test('3. User A can ONLY see Customer A and CANNOT see Customer B', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokenA}`)

    expect(res.status).toBe(200)
    const clients = res.body.data
    const names = clients.map((c) => c.firstName)

    expect(names).toContain('CustomerA_Secret')
    expect(names).not.toContain('CustomerB_Secret')
  })

  test('4. User B can ONLY see Customer B and CANNOT see Customer A', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${tokenB}`)

    expect(res.status).toBe(200)
    const clients = res.body.data
    const names = clients.map((c) => c.firstName)

    expect(names).toContain('CustomerB_Secret')
    expect(names).not.toContain('CustomerA_Secret')
  })

  test('5. SECURITY: Forging tenantId in headers/query/body is IGNORED by backend', async () => {
    // User A attempts to pass tenantIdB in headers and query string
    const res = await request(app)
      .get(`/api/clients?tenantId=${tenantIdB}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('tenantId', tenantIdB)
      .set('X-Tenant-Id', tenantIdB)

    expect(res.status).toBe(200)
    const clients = res.body.data
    const names = clients.map((c) => c.firstName)

    // Backend derived tenant strictly from User A's token -> returns CustomerA only
    expect(names).toContain('CustomerA_Secret')
    expect(names).not.toContain('CustomerB_Secret')
  })

  test('6. SECURITY: Direct cross-tenant resource access attempt returns 404', async () => {
    // User A attempts to fetch Customer B's record using Customer B's ID
    const res = await request(app)
      .get(`/api/clients/${clientB_Id}`)
      .set('Authorization', `Bearer ${tokenA}`)

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})
