'use strict'

/**
 * Database Seed Script — Idempotent
 * Run: npm run seed
 *
 * Populates all collections with sample data matching the frontend mock data.
 * Safe to run multiple times — checks for existing data before inserting.
 */

require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { mongoUri } = require('./config/env')

// Models
const User = require('./models/User')
const Client = require('./models/Client')
const Event = require('./models/Event')
const Payment = require('./models/Payment')
const Expense = require('./models/Expense')
const Employee = require('./models/Employee')
const Task = require('./models/Task')
const Workflow = require('./models/Workflow')
const Equipment = require('./models/Equipment')
const Notification = require('./models/Notification')
const Settings = require('./models/Settings')

const seed = async () => {
  try {
    console.log('🌱 Connecting to MongoDB…')
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB\n')

    // ─────────────────── USERS ───────────────────
    console.log('👤 Seeding Users…')
    let adminUser = await User.findOne({ email: 'admin@photostudiopro.com' })
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Sathish',
        email: 'admin@photostudiopro.com',
        password: 'admin123',
        phone: '+91 98765 43210',
        role: 'admin',
        isActive: true,
      })
      console.log('  ✅ Admin user created: admin@photostudiopro.com / admin123')
    } else {
      console.log('  ⏭️  Admin user already exists')
    }

    let managerUser = await User.findOne({ email: 'manager@photostudiopro.com' })
    if (!managerUser) {
      managerUser = await User.create({
        name: 'Priya Manager',
        email: 'manager@photostudiopro.com',
        password: 'manager123',
        phone: '+91 99887 76655',
        role: 'manager',
        isActive: true,
      })
      console.log('  ✅ Manager user created: manager@photostudiopro.com / manager123')
    } else {
      console.log('  ⏭️  Manager user already exists')
    }

    // ─────────────────── EMPLOYEES (Crew) ───────────────────
    console.log('\n🎥 Seeding Employees/Crew…')
    const employeeSeedData = [
      { name: 'Alex Vance', email: 'alex@photostudiopro.com', phone: '+91 90001 10001', role: 'Photographer', specialization: 'Lead Photographer', salary: 75000, avatar: 'https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png' },
      { name: 'Elena Rostova', email: 'elena@photostudiopro.com', phone: '+91 90001 10002', role: 'Photographer', specialization: 'Senior Photographer', salary: 65000, avatar: 'https://primefaces.org/cdn/primereact/images/avatar/asiyahjamil.png' },
      { name: 'Maya S.', email: 'maya@photostudiopro.com', phone: '+91 90001 10003', role: 'Photographer', specialization: 'Traditional Photographer', salary: 55000, avatar: 'https://primefaces.org/cdn/primereact/images/avatar/onyamalimba.png' },
      { name: 'David P.', email: 'david@photostudiopro.com', phone: '+91 90001 10004', role: 'Videographer', specialization: 'Cinematic Videographer', salary: 60000 },
      { name: 'Marco K.', email: 'marco@photostudiopro.com', phone: '+91 90001 10005', role: 'Drone Pilot', specialization: 'Drone & Video Specialist', salary: 55000, avatar: 'https://primefaces.org/cdn/primereact/images/avatar/xuxuefeng.png' },
      { name: 'Sarah L.', email: 'sarah@photostudiopro.com', phone: '+91 90001 10006', role: 'Videographer', specialization: 'Traditional Videographer', salary: 50000 },
      { name: 'Karthik K.', email: 'karthik@photostudiopro.com', phone: '+91 90001 10007', role: 'Photographer', specialization: 'Wedding Photographer', salary: 50000 },
      { name: 'Ravi Sharma', email: 'ravi@photostudiopro.com', phone: '+91 90001 10008', role: 'Editor', specialization: 'Photo Editor', salary: 45000 },
      { name: 'Anita Desai', email: 'anita@photostudiopro.com', phone: '+91 90001 10009', role: 'Album Designer', specialization: 'Luxury Album Design', salary: 40000 },
    ]

    const employees = []
    for (const empData of employeeSeedData) {
      let emp = await Employee.findOne({ email: empData.email })
      if (!emp) {
        emp = await Employee.create({ ...empData, status: 'Active', joiningDate: new Date('2024-01-15') })
      }
      employees.push(emp)
    }
    console.log(`  ✅ ${employees.length} employees seeded`)

    // ─────────────────── CLIENTS ───────────────────
    console.log('\n👥 Seeding Clients…')
    const clientSeedData = [
      { firstName: 'Sathish', lastName: 'Kumar', phone: '+91 98765 43210', email: 'sathish@example.com', city: 'Bengaluru', state: 'Karnataka', status: 'active', source: 'Direct' },
      { firstName: 'Sophia', lastName: 'Sterling', phone: '+1 (555) 234-5678', email: 'sophia@example.com', city: 'Napa Valley', state: 'California', status: 'active', source: 'Referral' },
      { firstName: 'Priya', lastName: 'Sharma', phone: '+91 99887 76655', email: 'priya.sharma@example.com', city: 'Mumbai', state: 'Maharashtra', status: 'active', source: 'Instagram' },
      { firstName: 'Olivia', lastName: 'Vance', phone: '+1 (555) 345-6789', email: 'olivia@example.com', city: 'Miami', state: 'Florida', status: 'active', source: 'Website' },
      { firstName: 'Emma', lastName: 'Hayes', phone: '+1 (555) 456-7890', email: 'emma@example.com', city: 'London', state: 'UK', status: 'completed', source: 'Google' },
      { firstName: 'Chloe', lastName: 'Dupont', phone: '+33 6 12 34 56 78', email: 'chloe@example.com', city: 'Florence', state: 'Italy', status: 'lead', source: 'Social Media' },
      { firstName: 'Aarav', lastName: 'Mehta', phone: '+91 91234 56789', email: 'aarav.mehta@example.com', city: 'Jodhpur', state: 'Rajasthan', status: 'active', source: 'Referral' },
      { firstName: 'Rahul', lastName: 'Verma', phone: '+91 98123 45678', email: 'rahul.verma@example.com', city: 'Bengaluru', state: 'Karnataka', status: 'active', source: 'Walk-in' },
      { firstName: 'Karthik', lastName: 'R', phone: '+91 97654 32100', email: 'karthik.r@example.com', city: 'Bengaluru', state: 'Karnataka', status: 'active', source: 'Instagram' },
      { firstName: 'Vikram', lastName: 'S', phone: '+91 96543 21000', email: 'vikram.s@example.com', city: 'Bengaluru', state: 'Karnataka', status: 'active', source: 'Direct' },
    ]

    const clients = []
    for (const cliData of clientSeedData) {
      let cli = await Client.findOne({ phone: cliData.phone })
      if (!cli) {
        cli = await Client.create({ ...cliData, createdBy: adminUser._id })
      }
      clients.push(cli)
    }
    console.log(`  ✅ ${clients.length} clients seeded`)

    // ─────────────────── EVENTS ───────────────────
    console.log('\n📅 Seeding Events…')
    const eventSeedData = [
      {
        clientIdx: 1, eventType: 'Wedding', eventName: 'Sophia & James Wedding & Reception',
        eventDate: '2026-08-12', endDate: '2026-08-13', startTime: '08:00 AM', endTime: '11:00 PM',
        venue: 'The Grand Chateau, Napa Valley', package: 'Royal Cinematic 4K',
        packageAmount: 850000, advanceAmount: 850000, status: 'In Progress',
        photographers: [0, 4, 2],
      },
      {
        clientIdx: 2, eventType: 'Sangeet', eventName: 'Priya & Rohan Sangeet & Mehendi',
        eventDate: '2026-08-15', startTime: '04:00 PM', endTime: '01:00 AM',
        venue: 'The Ritz Carlton Ballroom, Mumbai', package: 'Heritage Multi-Day Gold',
        packageAmount: 620000, advanceAmount: 310000, status: 'Confirmed',
        photographers: [1, 3],
      },
      {
        clientIdx: 3, eventType: 'Destination Wedding', eventName: 'Olivia & Liam Destination Wedding',
        eventDate: '2026-08-04', endDate: '2026-08-06', startTime: '10:00 AM', endTime: '10:00 PM',
        venue: 'Sunset Cove Resort, Miami', package: 'Destination Luxe Film',
        packageAmount: 1200000, advanceAmount: 1200000, status: 'Completed',
        photographers: [0, 5],
      },
      {
        clientIdx: 4, eventType: 'Pre Wedding', eventName: 'Emma & Benjamin Sunset Pre-Wedding',
        eventDate: '2026-07-28', startTime: '06:00 AM', endTime: '02:00 PM',
        venue: 'Royal Botanical Gardens', package: 'Classic Memories Package',
        packageAmount: 350000, advanceAmount: 350000, status: 'Completed',
        photographers: [2],
      },
      {
        clientIdx: 5, eventType: 'Gala Dinner', eventName: 'Chloe & Nathaniel Gala Dinner',
        eventDate: '2026-08-22', startTime: '06:00 PM', endTime: '12:00 AM',
        venue: 'Belmond Villa San Michele', package: 'Signature Cinema + Album',
        packageAmount: 580000, advanceAmount: 0, status: 'Inquiry',
        photographers: [1, 4],
      },
      {
        clientIdx: 6, eventType: 'Wedding', eventName: 'Aarav & Ananya Royal Wedding',
        eventDate: '2026-08-18', endDate: '2026-08-20', startTime: '07:00 AM', endTime: '09:00 PM',
        venue: 'Umaid Bhawan Palace, Jodhpur', package: 'Royal Cinematic 4K',
        packageAmount: 1450000, advanceAmount: 870000, status: 'Confirmed',
        photographers: [0, 3, 4],
      },
      {
        clientIdx: 7, eventType: 'Engagement', eventName: 'Rahul & Anu Engagement',
        eventDate: '2026-08-18', startTime: '02:00 PM', endTime: '07:00 PM',
        venue: 'Leela Palace Ballroom, Bengaluru', package: 'Classic Memories Package',
        packageAmount: 400000, advanceAmount: 400000, status: 'Confirmed',
        photographers: [2],
      },
      {
        clientIdx: 8, eventType: 'Pre Wedding', eventName: 'Karthik & Divya Pre-Wedding',
        eventDate: '2026-08-18', startTime: '05:00 PM', endTime: '09:00 PM',
        venue: 'Nandi Hills Sunrise Point', package: 'Signature Cinema + Album',
        packageAmount: 150000, advanceAmount: 150000, status: 'Confirmed',
        photographers: [3],
      },
      {
        clientIdx: 9, eventType: 'Reception', eventName: 'Vikram & Ananya Reception',
        eventDate: '2026-08-18', startTime: '07:00 PM', endTime: '11:30 PM',
        venue: 'Taj West End, Bengaluru', package: 'Royal Cinematic 4K',
        packageAmount: 380000, advanceAmount: 190000, status: 'Confirmed',
        photographers: [6],
      },
    ]

    const events = []
    for (const evtData of eventSeedData) {
      const client = clients[evtData.clientIdx]
      let evt = await Event.findOne({ eventName: evtData.eventName })
      if (!evt) {
        const photographers = (evtData.photographers || []).map(i => employees[i]._id)
        evt = await Event.create({
          clientId: client._id,
          eventType: evtData.eventType,
          eventName: evtData.eventName,
          eventDate: new Date(evtData.eventDate),
          endDate: evtData.endDate ? new Date(evtData.endDate) : null,
          startTime: evtData.startTime,
          endTime: evtData.endTime,
          venue: evtData.venue,
          package: evtData.package,
          packageAmount: evtData.packageAmount,
          advanceAmount: evtData.advanceAmount || 0,
          totalPaid: evtData.advanceAmount || 0,
          remainingAmount: evtData.packageAmount - (evtData.advanceAmount || 0),
          status: evtData.status,
          assignedPhotographers: photographers,
          createdBy: adminUser._id,
        })
      }
      events.push(evt)
    }
    console.log(`  ✅ ${events.length} events seeded`)

    // ─────────────────── PAYMENTS ───────────────────
    console.log('\n💰 Seeding Payments…')
    const existingPayments = await Payment.countDocuments()
    if (existingPayments === 0) {
      const paymentData = [
        { eventIdx: 0, amount: 425000, paymentType: 'Advance', paymentMethod: 'Bank Transfer', paymentDate: '2026-07-01' },
        { eventIdx: 0, amount: 425000, paymentType: 'Final Payment', paymentMethod: 'UPI', paymentDate: '2026-08-10' },
        { eventIdx: 1, amount: 310000, paymentType: 'Advance', paymentMethod: 'UPI', paymentDate: '2026-07-15' },
        { eventIdx: 2, amount: 600000, paymentType: 'Advance', paymentMethod: 'Bank Transfer', paymentDate: '2026-06-01' },
        { eventIdx: 2, amount: 600000, paymentType: 'Final Payment', paymentMethod: 'Bank Transfer', paymentDate: '2026-08-01' },
        { eventIdx: 3, amount: 350000, paymentType: 'Advance', paymentMethod: 'Cash', paymentDate: '2026-07-10' },
        { eventIdx: 5, amount: 500000, paymentType: 'Advance', paymentMethod: 'Bank Transfer', paymentDate: '2026-07-20' },
        { eventIdx: 5, amount: 370000, paymentType: 'Installment', paymentMethod: 'UPI', paymentDate: '2026-08-05' },
        { eventIdx: 6, amount: 400000, paymentType: 'Advance', paymentMethod: 'UPI', paymentDate: '2026-08-01' },
        { eventIdx: 7, amount: 150000, paymentType: 'Advance', paymentMethod: 'Cash', paymentDate: '2026-08-05' },
        { eventIdx: 8, amount: 190000, paymentType: 'Advance', paymentMethod: 'UPI', paymentDate: '2026-08-06' },
      ]

      for (const pd of paymentData) {
        const evt = events[pd.eventIdx]
        await Payment.create({
          eventId: evt._id,
          clientId: evt.clientId,
          amount: pd.amount,
          paymentType: pd.paymentType,
          paymentMethod: pd.paymentMethod,
          paymentDate: new Date(pd.paymentDate),
          receivedBy: adminUser._id,
        })
      }
      console.log(`  ✅ ${paymentData.length} payments seeded`)
    } else {
      console.log('  ⏭️  Payments already exist')
    }

    // ─────────────────── EXPENSES ───────────────────
    console.log('\n💸 Seeding Expenses…')
    const existingExpenses = await Expense.countDocuments()
    if (existingExpenses === 0) {
      const expenseData = [
        { title: 'Canon R5 Mark II Camera', category: 'Equipment', amount: 350000, expenseDate: '2026-01-15', paymentMethod: 'Bank Transfer' },
        { title: 'Wedding Season Print Order', category: 'Album Printing', amount: 85000, expenseDate: '2026-06-20', paymentMethod: 'Bank Transfer' },
        { title: 'Instagram Ad Campaign - July', category: 'Marketing', amount: 25000, expenseDate: '2026-07-01', paymentMethod: 'UPI' },
        { title: 'Mumbai Shoot Travel', category: 'Travel', amount: 45000, expenseDate: '2026-07-12', paymentMethod: 'UPI' },
        { title: 'Studio Rent - July', category: 'Office', amount: 60000, expenseDate: '2026-07-01', paymentMethod: 'Bank Transfer' },
        { title: 'Monthly Staff Salaries - July', category: 'Salary', amount: 395000, expenseDate: '2026-07-31', paymentMethod: 'Bank Transfer' },
        { title: 'DJI Mavic 3 Pro Drone', category: 'Equipment', amount: 180000, expenseDate: '2026-03-10', paymentMethod: 'Credit Card' },
        { title: 'Lightroom & Premiere Pro Subscription', category: 'Editing', amount: 12000, expenseDate: '2026-07-15', paymentMethod: 'Credit Card' },
        { title: 'Studio Rent - August', category: 'Office', amount: 60000, expenseDate: '2026-08-01', paymentMethod: 'Bank Transfer' },
        { title: 'Jodhpur Wedding Travel', category: 'Travel', amount: 75000, expenseDate: '2026-08-05', paymentMethod: 'UPI' },
      ]

      for (const ed of expenseData) {
        await Expense.create({ ...ed, expenseDate: new Date(ed.expenseDate), createdBy: adminUser._id })
      }
      console.log(`  ✅ ${expenseData.length} expenses seeded`)
    } else {
      console.log('  ⏭️  Expenses already exist')
    }

    // ─────────────────── WORKFLOWS ───────────────────
    console.log('\n🔄 Seeding Workflows…')
    const existingWorkflows = await Workflow.countDocuments()
    if (existingWorkflows === 0) {
      const STAGES = ['Inquiry', 'Booking', 'Pre-Wedding', 'Photography', 'Editing', 'Review', 'Album Design', 'Printing', 'Delivery', 'Completed']

      for (let i = 0; i < events.length; i++) {
        const evt = events[i]
        let completedUpTo = 1 // default: Inquiry completed
        if (evt.status === 'Completed') completedUpTo = 10
        else if (evt.status === 'In Progress') completedUpTo = 3
        else if (evt.status === 'Confirmed') completedUpTo = 2

        for (let s = 0; s < STAGES.length; s++) {
          let status = 'Pending'
          if (s < completedUpTo) status = 'Completed'
          else if (s === completedUpTo) status = 'In Progress'

          await Workflow.create({
            eventId: evt._id,
            stage: STAGES[s],
            status,
            order: s,
            assignedTo: s >= 4 && s <= 6 ? employees[7]._id : null, // assign editor to editing stages
          })
        }
      }
      console.log(`  ✅ ${events.length * 10} workflow stages seeded`)
    } else {
      console.log('  ⏭️  Workflows already exist')
    }

    // ─────────────────── TASKS ───────────────────
    console.log('\n📋 Seeding Tasks…')
    const existingTasks = await Task.countDocuments()
    if (existingTasks === 0) {
      const taskData = [
        { title: 'Edit Sophia Wedding RAW files', eventIdx: 0, assignedTo: employees[7]._id, priority: 'High', status: 'In Progress', dueDate: '2026-08-20' },
        { title: 'Design Olivia & Liam Album Layout', eventIdx: 2, assignedTo: employees[8]._id, priority: 'Medium', status: 'Todo', dueDate: '2026-08-25' },
        { title: 'Color Grade Priya Sangeet Video', eventIdx: 1, assignedTo: employees[7]._id, priority: 'High', status: 'Todo', dueDate: '2026-08-22' },
        { title: 'Prepare Jodhpur Wedding Gear Checklist', eventIdx: 5, assignedTo: employees[0]._id, priority: 'Urgent', status: 'In Progress', dueDate: '2026-08-16' },
        { title: 'Upload Emma Pre-Wedding to Gallery', eventIdx: 3, assignedTo: employees[7]._id, priority: 'Low', status: 'Completed', dueDate: '2026-08-05' },
        { title: 'Calibrate Drone before Jodhpur trip', eventIdx: 5, assignedTo: employees[4]._id, priority: 'High', status: 'Todo', dueDate: '2026-08-17' },
        { title: 'Create Aarav Wedding Highlight Reel', eventIdx: 5, assignedTo: employees[3]._id, priority: 'Medium', status: 'Todo', dueDate: '2026-08-28' },
        { title: 'Print Vikram Reception Test Album', eventIdx: 8, assignedTo: employees[8]._id, priority: 'Medium', status: 'Todo', dueDate: '2026-08-30' },
      ]

      for (const td of taskData) {
        await Task.create({
          title: td.title,
          eventId: events[td.eventIdx]._id,
          assignedTo: td.assignedTo,
          priority: td.priority,
          status: td.status,
          dueDate: new Date(td.dueDate),
          createdBy: adminUser._id,
        })
      }
      console.log(`  ✅ ${taskData.length} tasks seeded`)
    } else {
      console.log('  ⏭️  Tasks already exist')
    }

    // ─────────────────── EQUIPMENT ───────────────────
    console.log('\n📷 Seeding Equipment…')
    const existingEquip = await Equipment.countDocuments()
    if (existingEquip === 0) {
      const equipData = [
        { name: 'Canon EOS R5 Mark II', category: 'Camera', brand: 'Canon', model: 'R5 Mark II', serialNumber: 'CR5M2-001', purchasePrice: 350000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[0]._id },
        { name: 'Canon EOS R6 Mark III', category: 'Camera', brand: 'Canon', model: 'R6 Mark III', serialNumber: 'CR6M3-002', purchasePrice: 185000, condition: 'Good', availability: 'Assigned', assignedTo: employees[1]._id },
        { name: 'Sony A7 IV', category: 'Camera', brand: 'Sony', model: 'A7 IV', serialNumber: 'SA7IV-003', purchasePrice: 220000, condition: 'Good', availability: 'Available' },
        { name: 'Canon RF 70-200mm f/2.8L', category: 'Lens', brand: 'Canon', model: 'RF 70-200mm f/2.8L IS USM', serialNumber: 'CL70200-001', purchasePrice: 195000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[0]._id },
        { name: 'Canon RF 24-70mm f/2.8L', category: 'Lens', brand: 'Canon', model: 'RF 24-70mm f/2.8L IS USM', serialNumber: 'CL2470-002', purchasePrice: 170000, condition: 'Good', availability: 'Available' },
        { name: 'Godox AD600 Pro Flash', category: 'Flash', brand: 'Godox', model: 'AD600 Pro', serialNumber: 'GF600-001', purchasePrice: 55000, condition: 'Good', availability: 'Available' },
        { name: 'DJI Mavic 3 Pro', category: 'Drone', brand: 'DJI', model: 'Mavic 3 Pro', serialNumber: 'DJM3P-001', purchasePrice: 180000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[4]._id },
        { name: 'DJI RS 3 Pro Gimbal', category: 'Stabilizer', brand: 'DJI', model: 'RS 3 Pro', serialNumber: 'DJRS3-001', purchasePrice: 45000, condition: 'Good', availability: 'Available' },
        { name: 'Manfrotto 055 Tripod', category: 'Tripod', brand: 'Manfrotto', model: '055XPRO3', serialNumber: 'MT055-001', purchasePrice: 25000, condition: 'Fair', availability: 'Available' },
        { name: 'Godox SL150III Bi-Color LED', category: 'Lighting', brand: 'Godox', model: 'SL150III', serialNumber: 'GSL150-001', purchasePrice: 32000, condition: 'Good', availability: 'Available' },
        { name: 'Rode Wireless Pro Mic', category: 'Audio', brand: 'Rode', model: 'Wireless Pro', serialNumber: 'RWP-001', purchasePrice: 35000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[3]._id },
      ]

      for (const eq of equipData) {
        await Equipment.create({ ...eq, purchaseDate: new Date('2024-06-01') })
      }
      console.log(`  ✅ ${equipData.length} equipment items seeded`)
    } else {
      console.log('  ⏭️  Equipment already exists')
    }

    // ─────────────────── NOTIFICATIONS ───────────────────
    console.log('\n🔔 Seeding Notifications…')
    const existingNotifs = await Notification.countDocuments()
    if (existingNotifs === 0) {
      const notifData = [
        { title: 'Upcoming: Sophia Wedding', message: 'Sophia & James Wedding is in 4 days. Prepare equipment.', type: 'upcoming_event', relatedEventId: events[0]._id },
        { title: 'Payment Received', message: '₹3,10,000 advance received for Priya Sangeet.', type: 'payment_received', relatedEventId: events[1]._id },
        { title: 'Payment Pending', message: 'Chloe Gala Dinner - deposit not yet received.', type: 'payment_pending', relatedEventId: events[4]._id },
        { title: 'Task Assigned', message: 'You have been assigned to edit Sophia Wedding RAW files.', type: 'task_assigned' },
        { title: 'Jodhpur Wedding Prep', message: 'Aarav Royal Wedding starts Aug 18 — gear check required.', type: 'upcoming_event', relatedEventId: events[5]._id },
        { title: 'Album Delivery Ready', message: 'Emma Pre-Wedding album is ready for delivery.', type: 'workflow_deadline', relatedEventId: events[3]._id },
      ]

      for (const nd of notifData) {
        await Notification.create({ ...nd, userId: adminUser._id })
      }
      console.log(`  ✅ ${notifData.length} notifications seeded`)
    } else {
      console.log('  ⏭️  Notifications already exist')
    }

    // ─────────────────── SETTINGS ───────────────────
    console.log('\n⚙️  Seeding Settings…')
    await Settings.getSettings() // auto-creates if not exists
    console.log('  ✅ Settings initialized')

    // ─────────────────── DONE ───────────────────
    console.log('\n' + '═'.repeat(50))
    console.log('🎉 Database seeding completed successfully!')
    console.log('═'.repeat(50))
    console.log('\n📊 Summary:')
    console.log(`  Users:         ${await User.countDocuments()}`)
    console.log(`  Employees:     ${await Employee.countDocuments()}`)
    console.log(`  Clients:       ${await Client.countDocuments()}`)
    console.log(`  Events:        ${await Event.countDocuments()}`)
    console.log(`  Payments:      ${await Payment.countDocuments()}`)
    console.log(`  Expenses:      ${await Expense.countDocuments()}`)
    console.log(`  Workflows:     ${await Workflow.countDocuments()}`)
    console.log(`  Tasks:         ${await Task.countDocuments()}`)
    console.log(`  Equipment:     ${await Equipment.countDocuments()}`)
    console.log(`  Notifications: ${await Notification.countDocuments()}`)
    console.log('')
    console.log('🔑 Login credentials:')
    console.log('  Admin:   admin@photostudiopro.com / admin123')
    console.log('  Manager: manager@photostudiopro.com / manager123')
    console.log('')

    await mongoose.connection.close()
    process.exit(0)
  } catch (err) {
    console.error('\n❌  Seed failed:', err)
    await mongoose.connection.close()
    process.exit(1)
  }
}

seed()
