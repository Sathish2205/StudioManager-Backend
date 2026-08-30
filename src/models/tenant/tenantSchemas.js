'use strict'

const mongoose = require('mongoose')
const { Schema } = mongoose

// Defense-in-depth helper: attach tenantId field definition to schema options
const addTenantField = (schemaDefinition) => ({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  ...schemaDefinition,
})

// 1. Customer / Client Schema
const clientSchema = new Schema(
  addTenantField({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    city: { type: String, default: 'Bengaluru' },
    state: { type: String, default: 'Karnataka' },
    address: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'lead'], default: 'active' },
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastEvent: { type: String },
    customerSince: { type: String },
    loyaltyLevel: { type: String, default: 'Gold' },
    rewardPoints: { type: Number, default: 0 },
    dob: { type: String },
    anniversaryDate: { type: String },
    notes: { type: String },
    createdBy: { type: Schema.Types.Mixed },
  }),
  { timestamps: true }
)

// 2. Event Schema
const eventSchema = new Schema(
  addTenantField({
    eventName: { type: String, required: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    eventType: { type: String, default: 'Wedding Shoot' },
    eventDate: { type: Date, required: true },
    endDate: { type: Date },
    startTime: { type: String, default: '09:00 AM' },
    endTime: { type: String, default: '10:00 PM' },
    venue: { type: String, default: 'Studio Venue' },
    venueAddress: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    package: { type: String, default: 'Custom Package' },
    packageAmount: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    photographer: { type: String },
    videographer: { type: String },
    assignedPhotographers: [{ type: Schema.Types.Mixed }],
    assignedEditors: [{ type: Schema.Types.Mixed }],
    droneRequired: { type: Boolean, default: false },
    liveStreaming: { type: Boolean, default: false },
    albumRequired: { type: Boolean, default: false },
    candidPhotography: { type: Boolean, default: false },
    traditionalPhotography: { type: Boolean, default: false },
    traditionalVideo: { type: Boolean, default: false },
    status: {
      type: String,
      default: 'Confirmed',
    },
    notes: { type: String },
    createdBy: { type: Schema.Types.Mixed },
  }),
  { timestamps: true }
)

// 3. Employee / Staff Schema
const employeeSchema = new Schema(
  addTenantField({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ['Photographer', 'Videographer', 'Editor', 'Album Designer', 'Drone Pilot', 'Assistant', 'Manager'],
      default: 'Photographer',
    },
    employmentType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Freelance'],
      default: 'Full Time',
    },
    salary: { type: Number, default: 0 },
    specialization: { type: String },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
    workingHours: { type: String, default: '09:00 AM - 06:00 PM' },
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
  }),
  { timestamps: true }
)

// 4. Attendance Schema
const attendanceSchema = new Schema(
  addTenantField({
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true, default: Date.now },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ['Present', 'Absent', 'Half Day', 'Late', 'On Leave'], default: 'Present' },
    workingMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },
    totalBreakMinutes: { type: Number, default: 0 },
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
    notes: { type: String },
  }),
  { timestamps: true }
)

// 5. Invoice Schema
const invoiceSchema = new Schema(
  addTenantField({
    invoiceNumber: { type: String, required: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, required: true },
    eventName: { type: String },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        rate: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    totalPaid: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'],
      default: 'Draft',
    },
    paymentHistory: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],
    notes: { type: String },
  }),
  { timestamps: true }
)

// 6. Payment Schema
const paymentSchema = new Schema(
  addTenantField({
    id: { type: String },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    clientName: { type: String },
    eventName: { type: String },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Cheque'],
      default: 'UPI',
    },
    paymentType: { type: String, default: 'Advance' },
    transactionId: { type: String },
    transactionRef: { type: String },
    notes: { type: String },
  }),
  { timestamps: true }
)

// 7. Workflow Schema
const workflowSchema = new Schema(
  addTenantField({
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    clientName: { type: String, required: true },
    eventName: { type: String, required: true },
    photographer: { type: String },
    assignedEditor: { type: String },
    currentStageIndex: { type: Number, default: 0 },
    overallStatus: { type: String, default: 'Booking' },
    paymentSummary: {
      totalAmount: { type: Number, default: 0 },
      advancePaid: { type: Number, default: 0 },
      balanceDue: { type: Number, default: 0 },
      paymentStatus: { type: String, default: 'Pending' },
    },
    activityLog: [{ type: String }],
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    deliverables: [{ type: String }],
    estimatedDeliveryDate: { type: String, default: 'TBD' },
  }),
  { timestamps: true }
)

// 8. Settings Schema
const settingsSchema = new Schema(
  addTenantField({
    studioName: { type: String, required: true, default: 'PhotoStudio Pro' },
    tagline: { type: String, default: 'Premium Wedding & Commercial Photography Studio' },
    email: { type: String, default: 'contact@photostudiopro.com' },
    phone: { type: String, default: '+91 98765 43210' },
    website: { type: String, default: 'https://photostudiopro.com' },
    address: { type: String, default: 'MG Road, Indiranagar, Bengaluru' },
    city: { type: String, default: 'Bengaluru' },
    state: { type: String, default: 'Karnataka' },
    pincode: { type: String, default: '560038' },
    gstin: { type: String, default: '29ABCDE1234F1Z5' },
    pan: { type: String, default: 'ABCDE1234F' },
    currency: { type: String, default: 'INR' },
    taxRatePercent: { type: Number, default: 18 },
    bankDetails: {
      bankName: { type: String, default: 'HDFC Bank' },
      accountName: { type: String, default: 'PhotoStudio Pro Enterprise' },
      accountNumber: { type: String, default: '50200012345678' },
      ifscCode: { type: String, default: 'HDFC0001234' },
      upiId: { type: String, default: 'photostudio@hdfcbank' },
    },
  }),
  { timestamps: true }
)

// 9. Equipment Schema
const equipmentSchema = new Schema(
  addTenantField({
    name: { type: String, required: true },
    category: { type: String, required: true, default: 'Camera' },
    brand: { type: String },
    model: { type: String },
    serialNumber: { type: String, required: true },
    availability: { type: String, enum: ['Available', 'Assigned', 'In Maintenance'], default: 'Available' },
    condition: { type: String, default: 'Good' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
    purchasePrice: { type: Number, default: 0 },
    lastMaintenanceDate: { type: Date },
  }),
  { timestamps: true }
)

// 10. Expense Schema
const expenseSchema = new Schema(
  addTenantField({
    category: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    expenseDate: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, default: 'UPI' },
    paidTo: { type: String },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    receiptUrl: { type: String },
  }),
  { timestamps: true }
)

// 11. Leave Schema
const leaveSchema = new Schema(
  addTenantField({
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: { type: String, enum: ['Casual', 'Sick', 'Earned', 'Unpaid'], default: 'Casual' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, default: 1 },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
  }),
  { timestamps: true }
)

// 12. Notification Schema
const notificationSchema = new Schema(
  addTenantField({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  }),
  { timestamps: true }
)

// 13. Payroll Schema
const payrollSchema = new Schema(
  addTenantField({
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true },
    presentDays: { type: Number, default: 30 },
    overtimeAmount: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Processing', 'Paid'], default: 'Paid' },
    paymentDate: { type: Date, default: Date.now },
  }),
  { timestamps: true }
)

// 14. Quotation Schema
const quotationSchema = new Schema(
  addTenantField({
    quotationNumber: { type: String, required: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, required: true },
    eventName: { type: String, required: true },
    packageName: { type: String, default: 'Custom Package' },
    addOns: [{ type: String }],
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        rate: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    status: { type: String, enum: ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected'], default: 'Draft' },
    notes: { type: String },
  }),
  { timestamps: true }
)

// 15. Shift Schema
const shiftSchema = new Schema(
  addTenantField({
    name: { type: String, required: true },
    startTime: { type: String, required: true, default: '09:00' },
    endTime: { type: String, required: true, default: '18:00' },
    breakDuration: { type: Number, default: 60 },
    gracePeriod: { type: Number, default: 15 },
    overtimeEnabled: { type: Boolean, default: true },
  }),
  { timestamps: true }
)

// 16. Task Schema
const taskSchema = new Schema(
  addTenantField({
    title: { type: String, required: true },
    eventName: { type: String },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    deliverableType: { type: String, default: 'Edited Photos' },
    assignedEditor: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    progress: { type: Number, default: 0 },
    status: { type: String, enum: ['To Do', 'Culling', 'Editing & Album Design', 'Quality Check', 'Final Approval', 'Production', 'Ready for Delivery', 'Delivered'], default: 'To Do' },
    notes: { type: String },
  }),
  { timestamps: true }
)

// 17. Package Schema
const packageSchema = new Schema(
  addTenantField({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0 },
    category: { type: String, default: 'Wedding' },
    description: { type: String },
    deliverables: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  }),
  { timestamps: true }
)

module.exports = {
  clientSchema,
  eventSchema,
  employeeSchema,
  attendanceSchema,
  invoiceSchema,
  paymentSchema,
  workflowSchema,
  settingsSchema,
  equipmentSchema,
  expenseSchema,
  leaveSchema,
  notificationSchema,
  payrollSchema,
  quotationSchema,
  shiftSchema,
  taskSchema,
  packageSchema,
}
