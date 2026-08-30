'use strict'

/**
 * Multi-Tenant Seed Script
 * Run: node src/seedMultiTenant.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const Tenant = require('./models/master/Tenant')
const MasterUser = require('./models/master/User')
const { getTenantDatabase } = require('./services/tenantDatabase')
const { mongoUri } = require('./config/env')

const seedMultiTenant = async () => {
  try {
    console.log('🌱 Starting Multi-Tenant Database Seeding…')

    // 1. Connect to Master DB
    console.log(`   Connecting to Master Database: ${mongoUri}`)
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to Master Database\n')

    // 2. Clear Master Tenant & User Collections
    await Tenant.deleteMany({})
    await MasterUser.deleteMany({})

    // 3. Create Tenant A (ABC Photography) & Tenant B (XYZ Studio)
    console.log('🏢 Creating Master Tenant Accounts…')
    const tenantA = await Tenant.create({
      tenantId: 'TENANT_001',
      companyName: 'ABC Photography',
      slug: 'abc-photography',
      databaseName: 'tenant_001',
      status: 'active',
      contactEmail: 'admin@abcstudio.com',
      contactPhone: '+91 98765 43210',
    })

    const tenantB = await Tenant.create({
      tenantId: 'TENANT_002',
      companyName: 'XYZ Studio',
      slug: 'xyz-studio',
      databaseName: 'tenant_002',
      status: 'active',
      contactEmail: 'admin@xyzstudio.com',
      contactPhone: '+91 91122 33445',
    })

    console.log(`   + Created Master Tenant: ${tenantA.companyName} (${tenantA.tenantId})`)
    console.log(`   + Created Master Tenant: ${tenantB.companyName} (${tenantB.tenantId})\n`)

    // 4. Create Master Users
    console.log('👤 Creating Master Users…')
    const userA = await MasterUser.create({
      userId: 'USER_ABC_001',
      tenantId: 'TENANT_001',
      name: 'ABC Studio Owner',
      username: 'admin@abcstudio.com',
      email: 'admin@abcstudio.com',
      passwordHash: 'admin123',
      role: 'owner',
      status: 'active',
    })

    const userA2 = await MasterUser.create({
      userId: 'USER_ABC_002',
      tenantId: 'TENANT_001',
      name: 'Priya Manager (ABC)',
      username: 'priya@abcstudio.com',
      email: 'priya@abcstudio.com',
      passwordHash: 'admin123',
      role: 'manager',
      status: 'active',
    })

    const userB = await MasterUser.create({
      userId: 'USER_XYZ_001',
      tenantId: 'TENANT_002',
      name: 'XYZ Studio Owner',
      username: 'admin@xyzstudio.com',
      email: 'admin@xyzstudio.com',
      passwordHash: 'admin123',
      role: 'owner',
      status: 'active',
    })

    console.log(`   + Created User: ${userA.email} -> ${tenantA.companyName}`)
    console.log(`   + Created User: ${userA2.email} -> ${tenantA.companyName}`)
    console.log(`   + Created User: ${userB.email} -> ${tenantB.companyName}\n`)

    // 5. Seed Tenant A Database (tenant_001)
    console.log(`📂 Seeding Tenant A Database (${tenantA.databaseName})…`)
    const ctxA = await getTenantDatabase('TENANT_001')
    
    // Clear existing collections in tenant_001
    await Promise.all([
      ctxA.models.Client.deleteMany({}),
      ctxA.models.Event.deleteMany({}),
      ctxA.models.Employee.deleteMany({}),
      ctxA.models.Invoice.deleteMany({}),
      ctxA.models.Payment.deleteMany({}),
      ctxA.models.Task.deleteMany({}),
      ctxA.models.Workflow.deleteMany({}),
      ctxA.models.Equipment.deleteMany({}),
      ctxA.models.Settings.deleteMany({}),
    ])

    await ctxA.models.Settings.create({
      tenantId: 'TENANT_001',
      studioName: 'ABC Photography',
      tagline: 'Premier Luxury Wedding & Commercial Studio',
      email: 'contact@abcstudio.com',
      phone: '+91 98765 43210',
      address: 'MG Road, Indiranagar, Bengaluru',
    })

    const empA1 = await ctxA.models.Employee.create({
      tenantId: 'TENANT_001',
      name: 'Alex Vance',
      email: 'alex@abcstudio.com',
      phone: '+91 98111 00001',
      role: 'Photographer',
      specialization: 'Lead Cinematic Photographer',
      salary: 85000,
    })

    const empA2 = await ctxA.models.Employee.create({
      tenantId: 'TENANT_001',
      name: 'Deepa Editor',
      email: 'deepa@abcstudio.com',
      phone: '+91 98111 00002',
      role: 'Editor',
      specialization: 'Senior Photo Retoucher',
      salary: 65000,
    })

    const clientA1 = await ctxA.models.Client.create({
      tenantId: 'TENANT_001',
      firstName: 'Ananya',
      lastName: 'Sharma',
      email: 'ananya@gmail.com',
      phone: '+91 98765 11111',
      city: 'Bengaluru',
      status: 'active',
    })

    const clientA2 = await ctxA.models.Client.create({
      tenantId: 'TENANT_001',
      firstName: 'Harish',
      lastName: 'Patel',
      email: 'harish@gmail.com',
      phone: '+91 98765 22222',
      city: 'Mumbai',
      status: 'active',
    })

    const eventA1 = await ctxA.models.Event.create({
      tenantId: 'TENANT_001',
      eventName: 'Ananya & Vikram Wedding',
      clientId: clientA1._id,
      eventType: 'Wedding Shoot',
      eventDate: new Date('2026-09-15'),
      venue: 'The Leela Palace, Bengaluru',
      package: 'Royal Heritage Package',
      packageAmount: 250000,
      totalPaid: 100000,
      remainingAmount: 150000,
      assignedPhotographers: [empA1._id],
      assignedEditors: [empA2._id],
      status: 'Confirmed',
    })

    await ctxA.models.Invoice.create({
      tenantId: 'TENANT_001',
      invoiceNumber: 'INV-2026-001',
      clientId: clientA1._id,
      clientName: 'Ananya Sharma',
      eventName: 'Ananya & Vikram Wedding',
      eventId: eventA1._id,
      items: [{ description: 'Royal Heritage Package', quantity: 1, rate: 250000, amount: 250000 }],
      subtotal: 250000,
      tax: 0,
      grandTotal: 250000,
      totalPaid: 100000,
      balance: 150000,
      dueDate: new Date('2026-09-10'),
      status: 'Partially Paid',
    })

    await ctxA.models.Payment.create({
      tenantId: 'TENANT_001',
      eventId: eventA1._id,
      clientName: 'Ananya Sharma',
      eventName: 'Ananya & Vikram Wedding',
      amount: 100000,
      paymentDate: new Date('2026-08-01'),
      paymentMethod: 'UPI',
      paymentType: 'Advance',
      transactionRef: 'UPI_ABC_998877',
    })

    console.log(`   ✅ Tenant A Database seeded successfully with Clients, Events, Invoices, Employees.\n`)

    // 6. Seed Tenant B Database (tenant_002)
    console.log(`📂 Seeding Tenant B Database (${tenantB.databaseName})…`)
    const ctxB = await getTenantDatabase('TENANT_002')

    await Promise.all([
      ctxB.models.Client.deleteMany({}),
      ctxB.models.Event.deleteMany({}),
      ctxB.models.Employee.deleteMany({}),
      ctxB.models.Invoice.deleteMany({}),
      ctxB.models.Payment.deleteMany({}),
      ctxB.models.Task.deleteMany({}),
      ctxB.models.Workflow.deleteMany({}),
      ctxB.models.Equipment.deleteMany({}),
      ctxB.models.Settings.deleteMany({}),
    ])

    await ctxB.models.Settings.create({
      tenantId: 'TENANT_002',
      studioName: 'XYZ Studio',
      tagline: 'High Fashion & Commercial Media Production',
      email: 'hello@xyzstudio.com',
      phone: '+91 91122 33445',
      address: 'Bandra West, Mumbai',
    })

    const empB1 = await ctxB.models.Employee.create({
      tenantId: 'TENANT_002',
      name: 'Vikram Director (XYZ)',
      email: 'vikram@xyzstudio.com',
      phone: '+91 99000 88801',
      role: 'Photographer',
      specialization: 'Fashion Director',
      salary: 120000,
    })

    const clientB1 = await ctxB.models.Client.create({
      tenantId: 'TENANT_002',
      firstName: 'David',
      lastName: 'Beckham',
      email: 'david@beckham.com',
      phone: '+44 7700 900001',
      city: 'London',
      status: 'active',
    })

    const eventB1 = await ctxB.models.Event.create({
      tenantId: 'TENANT_002',
      eventName: 'Beckham Gala Night',
      clientId: clientB1._id,
      eventType: 'Fashion Shoot',
      eventDate: new Date('2026-10-05'),
      venue: 'Taj Mahal Palace, Mumbai',
      package: 'VIP Fashion Package',
      packageAmount: 500000,
      totalPaid: 500000,
      remainingAmount: 0,
      assignedPhotographers: [empB1._id],
      status: 'Confirmed',
    })

    await ctxB.models.Invoice.create({
      tenantId: 'TENANT_002',
      invoiceNumber: 'INV-XYZ-001',
      clientId: clientB1._id,
      clientName: 'David Beckham',
      eventName: 'Beckham Gala Night',
      eventId: eventB1._id,
      items: [{ description: 'VIP Fashion Shoot Package', quantity: 1, rate: 500000, amount: 500000 }],
      subtotal: 500000,
      tax: 0,
      grandTotal: 500000,
      totalPaid: 500000,
      balance: 0,
      dueDate: new Date('2026-10-01'),
      status: 'Paid',
    })

    console.log(`   ✅ Tenant B Database seeded successfully with distinct Clients, Events, Invoices.\n`)

    console.log('🎉 Multi-Tenant Database Seeding Completed Successfully!')
    console.log('--------------------------------------------------')
    console.log('Master Login Credentials:')
    console.log('  Company 1: ABC Photography (tenant_001)')
    console.log('    Email: admin@abcstudio.com')
    console.log('    Password: admin123')
    console.log('')
    console.log('  Company 2: XYZ Studio (tenant_002)')
    console.log('    Email: admin@xyzstudio.com')
    console.log('    Password: admin123')
    console.log('--------------------------------------------------')

    await mongoose.connection.close()
    process.exit(0)
  } catch (err) {
    console.error('❌ Multi-Tenant Seed Error:', err)
    process.exit(1)
  }
}

seedMultiTenant()
