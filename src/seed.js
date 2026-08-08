'use strict'

/**
 * Production Database Seed Script — MongoDB Atlas (25+ records per module)
 * Run: npm run seed
 */

require('dotenv').config()
const mongoose = require('mongoose')
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
    console.log('🌱 Connecting to MongoDB Atlas…')
    console.log(`   URI: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`)
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB Atlas\n')

    // ─────────────────── 1. USERS (5 records) ───────────────────
    console.log('👤 Seeding Users…')
    const userSeeds = [
      { name: 'Sathish Manager', email: 'admin@photostudiopro.com', password: 'admin123', phone: '+91 98765 43210', role: 'admin' },
      { name: 'Priya Manager', email: 'manager@photostudiopro.com', password: 'manager123', phone: '+91 99887 76655', role: 'manager' },
      { name: 'Alex Vance (Lead)', email: 'alex@photostudiopro.com', password: 'staff123', phone: '+91 90001 10001', role: 'photographer' },
      { name: 'Ravi Sharma (Senior Editor)', email: 'ravi@photostudiopro.com', password: 'staff123', phone: '+91 90001 10008', role: 'editor' },
      { name: 'Kavita Assistant', email: 'kavita@photostudiopro.com', password: 'staff123', phone: '+91 90001 10020', role: 'staff' },
    ]

    const users = []
    for (const uData of userSeeds) {
      let u = await User.findOne({ email: uData.email })
      if (!u) {
        u = await User.create({ ...uData, isActive: true })
        console.log(`   + Created user: ${uData.email}`)
      } else {
        console.log(`   • Existing user: ${uData.email}`)
      }
      users.push(u)
    }
    const adminUser = users[0]

    // ─────────────────── 2. EMPLOYEES / CREW (20 records) ───────────────────
    console.log('\n🎥 Seeding Employees / Crew (20 records)…')
    const employeeSeeds = [
      { name: 'Alex Vance', email: 'alex.vance@photostudiopro.com', phone: '+91 98111 00001', role: 'Photographer', specialization: 'Lead Cinematic Photographer', salary: 85000 },
      { name: 'Elena Rostova', email: 'elena.r@photostudiopro.com', phone: '+91 98111 00002', role: 'Photographer', specialization: 'Senior Portrait Photographer', salary: 75000 },
      { name: 'Maya Sundaram', email: 'maya.s@photostudiopro.com', phone: '+91 98111 00003', role: 'Photographer', specialization: 'Traditional & Candid Specialist', salary: 65000 },
      { name: 'David Park', email: 'david.p@photostudiopro.com', phone: '+91 98111 00004', role: 'Videographer', specialization: 'Lead Cinematic Videographer', salary: 75000 },
      { name: 'Marco Kapoor', email: 'marco.k@photostudiopro.com', phone: '+91 98111 00005', role: 'Drone Pilot', specialization: 'Aerial & FPV Specialist', salary: 65000 },
      { name: 'Sarah Lawrence', email: 'sarah.l@photostudiopro.com', phone: '+91 98111 00006', role: 'Videographer', specialization: 'Traditional Videographer', salary: 55000 },
      { name: 'Karthik Kumar', email: 'karthik.k@photostudiopro.com', phone: '+91 98111 00007', role: 'Photographer', specialization: 'Event & Sangeet Specialist', salary: 55000 },
      { name: 'Ravi Sharma', email: 'ravi.s@photostudiopro.com', phone: '+91 98111 00008', role: 'Editor', specialization: 'Lead Colorist & Photo Editor', salary: 60000 },
      { name: 'Anita Desai', email: 'anita.d@photostudiopro.com', phone: '+91 98111 00009', role: 'Album Designer', specialization: 'Flush Mount Luxury Album Specialist', salary: 50000 },
      { name: 'Vikram Joshi', email: 'vikram.j@photostudiopro.com', phone: '+91 98111 00010', role: 'Videographer', specialization: 'Teaser & Highlights Film Editor', salary: 58000 },
      { name: 'Pooja Reddy', email: 'pooja.r@photostudiopro.com', phone: '+91 98111 00011', role: 'Editor', specialization: 'Retouching & Beauty Editor', salary: 52000 },
      { name: 'Rahul Nambiar', email: 'rahul.n@photostudiopro.com', phone: '+91 98111 00012', role: 'Photographer', specialization: 'Second Shooter & Candidate', salary: 45000 },
      { name: 'Siddharth Roy', email: 'siddharth.r@photostudiopro.com', phone: '+91 98111 00013', role: 'Drone Pilot', specialization: '4K Drone Operator', salary: 50000 },
      { name: 'Meera Nair', email: 'meera.n@photostudiopro.com', phone: '+91 98111 00014', role: 'Designer', specialization: 'Pre-Wedding Concept Designer', salary: 48000 },
      { name: 'Arjun Menon', email: 'arjun.m@photostudiopro.com', phone: '+91 98111 00015', role: 'Staff', specialization: 'Lighting & Grip Assistant', salary: 35000 },
      { name: 'Deepak Verma', email: 'deepak.v@photostudiopro.com', phone: '+91 98111 00016', role: 'Staff', specialization: 'Technical Support & DIT', salary: 40000 },
      { name: 'Shreya Ghoshal', email: 'shreya.g@photostudiopro.com', phone: '+91 98111 00017', role: 'Editor', specialization: 'Audio Mastering & Sound Engineer', salary: 50000 },
      { name: 'Varun Dhawan', email: 'varun.d@photostudiopro.com', phone: '+91 98111 00018', role: 'Photographer', specialization: 'Corporate & Haldi Specialist', salary: 48000 },
      { name: 'Kavita Menon', email: 'kavita.m@photostudiopro.com', phone: '+91 98111 00019', role: 'Staff', specialization: 'Client Relationship Coordinator', salary: 42000 },
      { name: 'Nikhil Saxena', email: 'nikhil.s@photostudiopro.com', phone: '+91 98111 00020', role: 'Manager', specialization: 'Studio Production Manager', salary: 90000 },
    ]

    const employees = []
    for (const empData of employeeSeeds) {
      let emp = await Employee.findOne({ phone: empData.phone })
      if (!emp) {
        emp = await Employee.create({ ...empData, status: 'Active', joiningDate: new Date('2024-01-10') })
      }
      employees.push(emp)
    }
    console.log(`   ✅ Total Employees: ${await Employee.countDocuments()}`)

    // ─────────────────── 3. CLIENTS (25 records) ───────────────────
    console.log('\n👥 Seeding Clients (25 records)…')
    const clientSeeds = [
      { firstName: 'Sathish', lastName: 'Kumar', phone: '+91 98765 43210', email: 'sathish.k@example.com', city: 'Bengaluru', state: 'Karnataka', status: 'active', source: 'Direct' },
      { firstName: 'Sophia', lastName: 'Sterling', phone: '+1 555 234 5678', email: 'sophia.s@example.com', city: 'Napa Valley', state: 'California', status: 'active', source: 'Referral' },
      { firstName: 'Priya', lastName: 'Sharma', phone: '+91 99887 76655', email: 'priya.s@example.com', city: 'Mumbai', state: 'Maharashtra', status: 'active', source: 'Instagram' },
      { firstName: 'Olivia', lastName: 'Vance', phone: '+1 555 345 6789', email: 'olivia.v@example.com', city: 'Miami', state: 'Florida', status: 'active', source: 'Website' },
      { firstName: 'Emma', lastName: 'Hayes', phone: '+1 555 456 7890', email: 'emma.h@example.com', city: 'London', state: 'UK', status: 'completed', source: 'Google' },
      { firstName: 'Chloe', lastName: 'Dupont', phone: '+33 6 12 34 56 78', email: 'chloe.d@example.com', city: 'Florence', state: 'Italy', status: 'lead', source: 'Social Media' },
      { firstName: 'Aarav', lastName: 'Mehta', phone: '+91 91234 56789', email: 'aarav.m@example.com', city: 'Jodhpur', state: 'Rajasthan', status: 'active', source: 'Referral' },
      { firstName: 'Rahul', lastName: 'Verma', phone: '+91 98123 45678', email: 'rahul.v@example.com', city: 'Bengaluru', state: 'Karnataka', status: 'active', source: 'Walk-in' },
      { firstName: 'Karthik', lastName: 'Ramachandran', phone: '+91 97654 32100', email: 'karthik.r@example.com', city: 'Chennai', state: 'Tamil Nadu', status: 'active', source: 'Instagram' },
      { firstName: 'Vikram', lastName: 'Sundaram', phone: '+91 96543 21000', email: 'vikram.s@example.com', city: 'Hyderabad', state: 'Telangana', status: 'active', source: 'Direct' },
      { firstName: 'Ananya', lastName: 'Deshmukh', phone: '+91 95432 10987', email: 'ananya.d@example.com', city: 'Pune', state: 'Maharashtra', status: 'active', source: 'Referral' },
      { firstName: 'Rohan', lastName: 'Kapoor', phone: '+91 94321 09876', email: 'rohan.k@example.com', city: 'Delhi', state: 'Delhi', status: 'lead', source: 'Google' },
      { firstName: 'Sneha', lastName: 'Reddy', phone: '+91 93210 98765', email: 'sneha.r@example.com', city: 'Bengaluru', state: 'Karnataka', status: 'active', source: 'Instagram' },
      { firstName: 'Aditya', lastName: 'Singhania', phone: '+91 92109 87654', email: 'aditya.s@example.com', city: 'Kolkata', state: 'West Bengal', status: 'completed', source: 'Direct' },
      { firstName: 'Tanvi', lastName: 'Bhatia', phone: '+91 91098 76543', email: 'tanvi.b@example.com', city: 'Chandigarh', state: 'Punjab', status: 'active', source: 'Website' },
      { firstName: 'Ishaan', lastName: 'Chawla', phone: '+91 90987 65432', email: 'ishaan.c@example.com', city: 'Jaipur', state: 'Rajasthan', status: 'lead', source: 'Social Media' },
      { firstName: 'Rhea', lastName: 'Pillai', phone: '+91 89876 54321', email: 'rhea.p@example.com', city: 'Kochi', state: 'Kerala', status: 'active', source: 'Referral' },
      { firstName: 'Dev', lastName: 'Malhotra', phone: '+91 88765 43210', email: 'dev.m@example.com', city: 'Dehradun', state: 'Uttarakhand', status: 'completed', source: 'Walk-in' },
      { firstName: 'Kavya', lastName: 'Iyer', phone: '+91 87654 32109', email: 'kavya.i@example.com', city: 'Coimbatore', state: 'Tamil Nadu', status: 'active', source: 'Instagram' },
      { firstName: 'Varun', lastName: 'Saxena', phone: '+91 86543 21098', email: 'varun.s@example.com', city: 'Lucknow', state: 'Uttar Pradesh', status: 'lead', source: 'Google' },
      { firstName: 'Meera', lastName: 'Nambiar', phone: '+91 85432 10987', email: 'meera.n@example.com', city: 'Trivandrum', state: 'Kerala', status: 'active', source: 'Direct' },
      { firstName: 'Kabir', lastName: 'Oberoi', phone: '+91 84321 09876', email: 'kabir.o@example.com', city: 'Udaipur', state: 'Rajasthan', status: 'active', source: 'Referral' },
      { firstName: 'Nisha', lastName: 'Agarwal', phone: '+91 83210 98765', email: 'nisha.a@example.com', city: 'Ahmedabad', state: 'Gujarat', status: 'completed', source: 'Website' },
      { firstName: 'Siddharth', lastName: 'Tiwari', phone: '+91 82109 87654', email: 'siddharth.t@example.com', city: 'Indore', state: 'Madhya Pradesh', status: 'active', source: 'Instagram' },
      { firstName: 'Pooja', lastName: 'Hegde', phone: '+91 81098 76543', email: 'pooja.h@example.com', city: 'Mangalore', state: 'Karnataka', status: 'lead', source: 'Walk-in' },
    ]

    const clients = []
    for (const cData of clientSeeds) {
      let c = await Client.findOne({ phone: cData.phone })
      if (!c) {
        c = await Client.create({ ...cData, createdBy: adminUser._id })
      }
      clients.push(c)
    }
    console.log(`   ✅ Total Clients: ${await Client.countDocuments()}`)

    // ─────────────────── 4. EVENTS (25 records) ───────────────────
    console.log('\n📅 Seeding Events (25 records)…')
    const eventTypesList = ['Wedding', 'Reception', 'Engagement', 'Pre Wedding', 'Sangeet', 'Mehendi', 'Haldi', 'Destination Wedding', 'Corporate', 'Birthday', 'Gala Dinner']
    const packagesList = ['Royal Cinematic 4K', 'Heritage Multi-Day Gold', 'Destination Luxe Film', 'Classic Memories Package', 'Signature Cinema + Album']
    const statusesList = ['Inquiry', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']
    const venuesList = [
      'The Grand Chateau, Napa Valley', 'The Ritz Carlton Ballroom, Mumbai', 'Sunset Cove Resort, Miami',
      'Royal Botanical Gardens, Bengaluru', 'Belmond Villa San Michele, Florence', 'Umaid Bhawan Palace, Jodhpur',
      'Leela Palace Ballroom, Bengaluru', 'Nandi Hills Sunrise Point', 'Taj West End, Bengaluru',
      'JW Marriott Golfshire, Bengaluru', 'Taj Lake Palace, Udaipur', 'Kumarakom Lake Resort, Kerala',
      'The Oberoi Udaivilas, Udaipur', 'ITC Grand Chola, Chennai', 'Hyatt Regency, Pune',
      'Raffles Hotel, Udaipur', 'Fort Rajwada, Jaisalmer', 'Grand Hyatt, Goa',
    ]

    const eventSeeds = []
    for (let i = 0; i < 25; i++) {
      const client = clients[i % clients.length]
      const eType = eventTypesList[i % eventTypesList.length]
      const ePkg = packagesList[i % packagesList.length]
      const pkgAmt = 150000 + (i * 45000)
      const advAmt = i % 3 === 0 ? pkgAmt : Math.round(pkgAmt * 0.5)
      const dateOffset = (i - 10) * 4 // mix of past, present, and future dates
      const eDate = new Date()
      eDate.setDate(eDate.getDate() + dateOffset)

      eventSeeds.push({
        clientId: client._id,
        eventType: eType,
        eventName: `${client.firstName} & ${client.lastName} ${eType}`,
        eventDate: eDate,
        startTime: '09:00 AM',
        endTime: '11:00 PM',
        venue: venuesList[i % venuesList.length],
        package: ePkg,
        packageAmount: pkgAmt,
        advanceAmount: advAmt,
        totalPaid: advAmt,
        remainingAmount: pkgAmt - advAmt,
        status: statusesList[i % statusesList.length],
        assignedPhotographers: [employees[i % employees.length]._id, employees[(i + 1) % employees.length]._id],
        assignedEditors: [employees[7]._id, employees[10]._id],
        createdBy: adminUser._id,
      })
    }

    const events = []
    for (const eData of eventSeeds) {
      let e = await Event.findOne({ eventName: eData.eventName })
      if (!e) {
        e = await Event.create(eData)
      }
      events.push(e)
    }
    console.log(`   ✅ Total Events: ${await Event.countDocuments()}`)

    // ─────────────────── 5. WORKFLOWS (250 records - 10 per event) ───────────────────
    console.log('\n🔄 Seeding Workflows (250 stage records)…')
    const STAGES = ['Inquiry', 'Booking', 'Pre-Wedding', 'Photography', 'Editing', 'Review', 'Album Design', 'Printing', 'Delivery', 'Completed']

    let workflowCount = 0
    for (let i = 0; i < events.length; i++) {
      const evt = events[i]
      let completedUpTo = 2
      if (evt.status === 'Completed') completedUpTo = 10
      else if (evt.status === 'In Progress') completedUpTo = 5
      else if (evt.status === 'Confirmed') completedUpTo = 3
      else if (evt.status === 'Inquiry') completedUpTo = 1

      for (let s = 0; s < STAGES.length; s++) {
        const stageName = STAGES[s]
        let status = 'Pending'
        if (s < completedUpTo) status = 'Completed'
        else if (s === completedUpTo) status = 'In Progress'

        let wf = await Workflow.findOne({ eventId: evt._id, stage: stageName })
        if (!wf) {
          wf = await Workflow.create({
            eventId: evt._id,
            stage: stageName,
            status,
            order: s,
            assignedTo: s >= 4 && s <= 7 ? employees[7]._id : employees[0]._id,
          })
          workflowCount++
        }
      }
    }
    console.log(`   ✅ Total Workflow Stages: ${await Workflow.countDocuments()}`)

    // ─────────────────── 6. PAYMENTS (25 records) ───────────────────
    console.log('\n💰 Seeding Payments (25 records)…')
    const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque']
    const paymentTypes = ['Advance', 'Installment', 'Final Payment']

    for (let i = 0; i < 25; i++) {
      const evt = events[i % events.length]
      const pAmt = Math.round(evt.packageAmount * 0.4)
      const pDate = new Date(evt.eventDate)
      pDate.setDate(pDate.getDate() - 10 + i)

      const exists = await Payment.findOne({ eventId: evt._id, amount: pAmt, paymentDate: pDate })
      if (!exists) {
        await Payment.create({
          eventId: evt._id,
          clientId: evt.clientId,
          amount: pAmt,
          paymentDate: pDate,
          paymentMethod: paymentMethods[i % paymentMethods.length],
          paymentType: paymentTypes[i % paymentTypes.length],
          transactionId: `TXN-2026-${1000 + i}`,
          receivedBy: adminUser._id,
        })
      }
    }
    console.log(`   ✅ Total Payments: ${await Payment.countDocuments()}`)

    // ─────────────────── 7. EXPENSES (25 records) ───────────────────
    console.log('\n💸 Seeding Expenses (25 records)…')
    const expenseCategories = ['Equipment', 'Travel', 'Salary', 'Office', 'Marketing', 'Album Printing', 'Editing', 'Meals', 'Utilities', 'Other']
    const expenseTitles = [
      'Canon EOS R5 Camera Purchase', 'Album Printing - Gold Collection', 'Facebook Ad Campaign', 'Flight Tickets to Jodhpur',
      'Studio Monthly Rent', 'Staff Monthly Payroll', 'DJI Mavic Drone Maintenance', 'Adobe Creative Cloud Licenses',
      'Catering for Pre-Wedding Shoot', 'High Speed Fibre Internet', 'Sony FE 70-200mm Lens Purchase', 'Custom USB Flash Drives',
      'Goa Shoot Travel Allowance', 'Godox Lighting Battery Packs', 'Hard Drive Storage (128TB NAS)', 'Studio Office Stationeries',
      'Instagram Influencer Marketing', 'Lightroom Preset Pack Purchase', 'Udaipur Travel Logistics', 'Luxury Box Packaging Order',
      'Camera Sensor Cleaning & Service', 'Videography Stabilizer Vest', 'Sound Recording Mics Set', 'Electricity & Power Utilities', 'Annual Business License Fee',
    ]

    for (let i = 0; i < 25; i++) {
      const eDate = new Date()
      eDate.setDate(eDate.getDate() - (i * 7))

      const title = expenseTitles[i]
      let exp = await Expense.findOne({ title })
      if (!exp) {
        await Expense.create({
          title,
          category: expenseCategories[i % expenseCategories.length],
          amount: 15000 + (i * 8500),
          expenseDate: eDate,
          paymentMethod: paymentMethods[i % paymentMethods.length],
          description: `Operational expense for ${title}`,
          createdBy: adminUser._id,
        })
      }
    }
    console.log(`   ✅ Total Expenses: ${await Expense.countDocuments()}`)

    // ─────────────────── 8. EQUIPMENT (25 records) ───────────────────
    console.log('\n📷 Seeding Equipment (25 records)…')
    const equipSeeds = [
      { name: 'Canon EOS R5 Mark II', category: 'Camera', brand: 'Canon', model: 'R5 Mark II', serialNumber: 'CR5M2-00101', purchasePrice: 350000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[0]._id },
      { name: 'Canon EOS R6 Mark III', category: 'Camera', brand: 'Canon', model: 'R6 Mark III', serialNumber: 'CR6M3-00102', purchasePrice: 220000, condition: 'Good', availability: 'Available' },
      { name: 'Sony A7 IV Body', category: 'Camera', brand: 'Sony', model: 'A7 IV', serialNumber: 'SA7IV-00103', purchasePrice: 210000, condition: 'Good', availability: 'Available' },
      { name: 'Sony FX3 Cinema Camera', category: 'Camera', brand: 'Sony', model: 'FX3', serialNumber: 'SFX3-00104', purchasePrice: 330000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[3]._id },
      { name: 'Nikon Z9 Flagship Camera', category: 'Camera', brand: 'Nikon', model: 'Z9', serialNumber: 'NZ9-00105', purchasePrice: 450000, condition: 'Excellent', availability: 'Available' },
      { name: 'Canon RF 70-200mm f/2.8L', category: 'Lens', brand: 'Canon', model: 'RF 70-200 f/2.8', serialNumber: 'CL70200-00201', purchasePrice: 230000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[0]._id },
      { name: 'Canon RF 24-70mm f/2.8L', category: 'Lens', brand: 'Canon', model: 'RF 24-70 f/2.8', serialNumber: 'CL2470-00202', purchasePrice: 190000, condition: 'Good', availability: 'Available' },
      { name: 'Sony FE 50mm f/1.2 GM', category: 'Lens', brand: 'Sony', model: '50mm f/1.2', serialNumber: 'SL5012-00203', purchasePrice: 185000, condition: 'Excellent', availability: 'Available' },
      { name: 'Sigma 85mm f/1.4 DG DN', category: 'Lens', brand: 'Sigma', model: '85mm f/1.4 Art', serialNumber: 'SL8514-00204', purchasePrice: 95000, condition: 'Good', availability: 'Available' },
      { name: 'Canon RF 15-35mm f/2.8L', category: 'Lens', brand: 'Canon', model: 'RF 15-35 f/2.8', serialNumber: 'CL1535-00205', purchasePrice: 195000, condition: 'Good', availability: 'Available' },
      { name: 'Godox AD600 Pro Strobe', category: 'Flash', brand: 'Godox', model: 'AD600 Pro', serialNumber: 'GF600-00301', purchasePrice: 65000, condition: 'Good', availability: 'Available' },
      { name: 'Godox AD200 Pro Pocket Flash', category: 'Flash', brand: 'Godox', model: 'AD200 Pro', serialNumber: 'GF200-00302', purchasePrice: 28000, condition: 'Good', availability: 'Available' },
      { name: 'Profoto B10X Plus Light', category: 'Lighting', brand: 'Profoto', model: 'B10X Plus', serialNumber: 'PFB10-00303', purchasePrice: 190000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[1]._id },
      { name: 'Aputure LS 600d Pro LED', category: 'Lighting', brand: 'Aputure', model: 'LS 600d', serialNumber: 'AP600-00304', purchasePrice: 175000, condition: 'Excellent', availability: 'Available' },
      { name: 'DJI Mavic 3 Pro Drone Kit', category: 'Drone', brand: 'DJI', model: 'Mavic 3 Pro', serialNumber: 'DJM3P-00401', purchasePrice: 195000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[4]._id },
      { name: 'DJI Avata 2 FPV Drone', category: 'Drone', brand: 'DJI', model: 'Avata 2', serialNumber: 'DJAV2-00402', purchasePrice: 85000, condition: 'Good', availability: 'Available' },
      { name: 'DJI RS 3 Pro Gimbal', category: 'Stabilizer', brand: 'DJI', model: 'RS 3 Pro', serialNumber: 'DJRS3-00501', purchasePrice: 55000, condition: 'Good', availability: 'Assigned', assignedTo: employees[3]._id },
      { name: 'Zhiyun Crane 4 Gimbal', category: 'Stabilizer', brand: 'Zhiyun', model: 'Crane 4', serialNumber: 'ZC4-00502', purchasePrice: 48000, condition: 'Good', availability: 'Available' },
      { name: 'Manfrotto 055 Carbon Tripod', category: 'Tripod', brand: 'Manfrotto', model: '055 CXPRO4', serialNumber: 'MT055-00601', purchasePrice: 38000, condition: 'Good', availability: 'Available' },
      { name: 'Sachtler Flowtech 75 Tripod', category: 'Tripod', brand: 'Sachtler', model: 'Flowtech 75', serialNumber: 'ST75-00602', purchasePrice: 125000, condition: 'Excellent', availability: 'Available' },
      { name: 'Rode Wireless PRO Mic Kit', category: 'Audio', brand: 'Rode', model: 'Wireless PRO', serialNumber: 'RWP-00701', purchasePrice: 38000, condition: 'Excellent', availability: 'Assigned', assignedTo: employees[3]._id },
      { name: 'Sennheiser MKH 416 Shotgun', category: 'Audio', brand: 'Sennheiser', model: 'MKH 416', serialNumber: 'SM416-00702', purchasePrice: 85000, condition: 'Good', availability: 'Available' },
      { name: 'Zoom F6 Field Recorder', category: 'Audio', brand: 'Zoom', model: 'F6', serialNumber: 'ZF6-00703', purchasePrice: 62000, condition: 'Good', availability: 'Available' },
      { name: 'Pelican 1510 Protector Case', category: 'Bag', brand: 'Pelican', model: '1510', serialNumber: 'PEL1510-00801', purchasePrice: 28000, condition: 'Excellent', availability: 'Available' },
      { name: 'Peak Design Everyday Backpack 30L', category: 'Bag', brand: 'Peak Design', model: 'Backpack 30L', serialNumber: 'PDBP30-00802', purchasePrice: 24000, condition: 'Good', availability: 'Available' },
    ]

    for (const eq of equipSeeds) {
      let eItem = await Equipment.findOne({ serialNumber: eq.serialNumber })
      if (!eItem) {
        await Equipment.create({ ...eq, purchaseDate: new Date('2024-05-15') })
      }
    }
    console.log(`   ✅ Total Equipment: ${await Equipment.countDocuments()}`)

    // ─────────────────── 9. TASKS (25 records) ───────────────────
    console.log('\n📋 Seeding Tasks (25 records)…')
    const priorities = ['Low', 'Medium', 'High', 'Urgent']
    const taskStatuses = ['Todo', 'In Progress', 'Completed']

    for (let i = 0; i < 25; i++) {
      const title = `Task #${100 + i}: ${STAGES[i % STAGES.length]} processing for ${events[i % events.length].eventName}`
      const due = new Date()
      due.setDate(due.getDate() + (i * 2))

      let t = await Task.findOne({ title })
      if (!t) {
        await Task.create({
          title,
          description: `Detailed task instructions for ${title}`,
          eventId: events[i % events.length]._id,
          assignedTo: employees[i % employees.length]._id,
          priority: priorities[i % priorities.length],
          status: taskStatuses[i % taskStatuses.length],
          dueDate: due,
          createdBy: adminUser._id,
        })
      }
    }
    console.log(`   ✅ Total Tasks: ${await Task.countDocuments()}`)

    // ─────────────────── 10. NOTIFICATIONS (25 records) ───────────────────
    console.log('\n🔔 Seeding Notifications (25 records)…')
    const notifTypes = ['upcoming_event', 'payment_received', 'payment_pending', 'task_assigned', 'task_due', 'workflow_deadline', 'general']

    for (let i = 0; i < 25; i++) {
      const evt = events[i % events.length]
      const nTitle = `Notification #${i + 1}: ${evt.eventName}`
      const nMsg = `Alert details for shoot ${evt.eventName} scheduled at ${evt.venue}`

      let n = await Notification.findOne({ title: nTitle })
      if (!n) {
        await Notification.create({
          userId: adminUser._id,
          title: nTitle,
          message: nMsg,
          type: notifTypes[i % notifTypes.length],
          isRead: i % 2 === 0,
          relatedEventId: evt._id,
        })
      }
    }
    console.log(`   ✅ Total Notifications: ${await Notification.countDocuments()}`)

    // ─────────────────── 11. SETTINGS (1 record) ───────────────────
    console.log('\n⚙️ Seeding Studio Settings…')
    await Settings.getSettings()
    console.log(`   ✅ Total Settings Documents: ${await Settings.countDocuments()}`)

    console.log('\n' + '═'.repeat(60))
    console.log('🎉 MongoDB Atlas Seeding Completed Successfully!')
    console.log('═'.repeat(60))
    console.log('📊 Final Atlas Document Totals:')
    console.log(`   • Users:         ${await User.countDocuments()}`)
    console.log(`   • Employees:     ${await Employee.countDocuments()}`)
    console.log(`   • Clients:       ${await Client.countDocuments()}`)
    console.log(`   • Events:        ${await Event.countDocuments()}`)
    console.log(`   • Workflows:     ${await Workflow.countDocuments()}`)
    console.log(`   • Payments:      ${await Payment.countDocuments()}`)
    console.log(`   • Expenses:      ${await Expense.countDocuments()}`)
    console.log(`   • Equipment:     ${await Equipment.countDocuments()}`)
    console.log(`   • Tasks:         ${await Task.countDocuments()}`)
    console.log(`   • Notifications: ${await Notification.countDocuments()}`)
    console.log(`   • Settings:      ${await Settings.countDocuments()}`)
    console.log('═'.repeat(60) + '\n')

    await mongoose.connection.close()
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Seed Error:', err)
    await mongoose.connection.close()
    process.exit(1)
  }
}

seed()
