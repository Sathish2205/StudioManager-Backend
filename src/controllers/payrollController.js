'use strict'

const Payroll = require('../models/Payroll')
const Employee = require('../models/Employee')
const Attendance = require('../models/Attendance')
const { success, created, notFound, badRequest } = require('../utils/apiResponse')
const { parsePagination, buildPaginationMeta } = require('../utils/pagination')

// POST /api/payroll/generate - Calculate and generate payroll for an employee for a specific month/year
const generatePayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year, bonus = 0, deductions = 0, overtimeRatePerHour = 100 } = req.body
    if (!employeeId || !month || !year) {
      return badRequest(res, 'employeeId, month, and year are required')
    }

    const employee = await Employee.findById(employeeId).lean()
    if (!employee) return notFound(res, 'Employee not found')

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

    const attendances = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
    }).lean()

    const workingDays = endDate.getDate() // total days in month
    const presentDays = attendances.filter(a => ['Present', 'Late', 'Early Checkout', 'Half Day'].includes(a.status)).length
    const absentDays = attendances.filter(a => a.status === 'Absent').length
    const paidLeaveDays = attendances.filter(a => a.status === 'On Leave').length
    const lateDays = attendances.filter(a => a.status === 'Late').length

    const totalWorkingMinutes = attendances.reduce((sum, a) => sum + (a.workingMinutes || 0), 0)
    const overtimeMinutes = attendances.reduce((sum, a) => sum + (a.overtimeMinutes || 0), 0)

    const baseSalary = employee.salary || 0

    // Overtime pay calculation
    const overtimeHours = overtimeMinutes / 60
    const overtimeAmount = Math.round(overtimeHours * overtimeRatePerHour)

    // Daily rate for unpaid days deduction if needed
    const dailyRate = workingDays > 0 ? baseSalary / workingDays : 0
    const unpaidLeaveDays = Math.max(0, workingDays - (presentDays + paidLeaveDays))
    const totalDeductions = Math.round(deductions + (unpaidLeaveDays * dailyRate))

    const netSalary = Math.max(0, Math.round(baseSalary + overtimeAmount + bonus - totalDeductions))

    const payroll = await Payroll.findOneAndUpdate(
      { employeeId, month: parseInt(month), year: parseInt(year) },
      {
        employeeId,
        month: parseInt(month),
        year: parseInt(year),
        baseSalary,
        workingDays,
        presentDays,
        absentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        lateDays,
        totalWorkingMinutes,
        overtimeMinutes,
        overtimeAmount,
        deductions: totalDeductions,
        bonus,
        netSalary,
        status: 'Generated',
        generatedBy: req.user?._id || null,
      },
      { upsert: true, new: true, runValidators: true }
    )

    return created(res, payroll, 'Payroll generated successfully')
  } catch (err) {
    next(err)
  }
}

// GET /api/payroll - List payrolls
const getPayrolls = async (req, res, next) => {
  try {
    const { page, limit, skip, sort } = parsePagination(req.query)
    const filter = {}

    if (req.query.employeeId) filter.employeeId = req.query.employeeId
    if (req.query.month) filter.month = parseInt(req.query.month)
    if (req.query.year) filter.year = parseInt(req.query.year)
    if (req.query.status) filter.status = req.query.status

    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .populate('employeeId', 'name role employeeId avatar salary email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Payroll.countDocuments(filter),
    ])

    return success(res, payrolls, 'Payrolls fetched successfully', 200, buildPaginationMeta(total, page, limit))
  } catch (err) {
    next(err)
  }
}

// GET /api/payroll/:id
const getPayrollById = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'name role employeeId avatar salary email phone address bankDetails')
      .lean()

    if (!payroll) return notFound(res, 'Payroll record not found')
    return success(res, payroll, 'Payroll details fetched')
  } catch (err) {
    next(err)
  }
}

// PUT /api/payroll/:id/status
const updatePayrollStatus = async (req, res, next) => {
  try {
    const { status, bonus, deductions, notes } = req.body
    const updateData = {}

    if (status) updateData.status = status
    if (bonus !== undefined) updateData.bonus = bonus
    if (deductions !== undefined) updateData.deductions = deductions
    if (notes !== undefined) updateData.notes = notes

    const payroll = await Payroll.findById(req.params.id)
    if (!payroll) return notFound(res, 'Payroll record not found')

    if (bonus !== undefined || deductions !== undefined) {
      const b = bonus !== undefined ? bonus : payroll.bonus
      const d = deductions !== undefined ? deductions : payroll.deductions
      updateData.netSalary = Math.max(0, Math.round(payroll.baseSalary + payroll.overtimeAmount + b - d))
    }

    const updated = await Payroll.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean()
    return success(res, updated, 'Payroll updated successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  generatePayroll,
  getPayrolls,
  getPayrollById,
  updatePayrollStatus,
}
