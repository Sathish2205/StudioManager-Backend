'use strict'

const { success, created, notFound, badRequest } = require('../utils/apiResponse')

// Default initial package presets for studio initialization
const DEFAULT_PRESETS = [
  {
    name: 'Royal Heritage Package',
    price: 250000,
    category: 'Wedding',
    description: 'Complete luxury wedding coverage with 2 Lead Photographers, Drone Pilot, 4K Teaser & Album.',
    deliverables: ['2 Lead Photographers', '1 Drone Pilot', '1 Videographer', '4K Cinematic Film', 'Premium Leather Album'],
  },
  {
    name: 'Luxury Cinematic Package',
    price: 180000,
    category: 'Wedding',
    description: 'Candid & Traditional photography with 4K Video Highlights.',
    deliverables: ['1 Candid Photographer', '1 Traditional Photographer', '1 Cinematographer', 'Teaser Reel', 'Photobook'],
  },
  {
    name: 'Traditional Wedding & Reception',
    price: 120000,
    category: 'Wedding',
    description: 'Comprehensive coverage for traditional ceremonies and reception.',
    deliverables: ['1 Traditional Photographer', '1 HD Videographer', 'Standard Album (30 Sheets)'],
  },
  {
    name: 'Pre-Wedding & Engagement Shoot',
    price: 75000,
    category: 'Engagement',
    description: 'Outdoor pre-wedding shoot with cinematic drone footage and Instagram reels.',
    deliverables: ['1 Outdoor Shoot Location', 'Reels & Teaser', 'Digital High-Res Gallery'],
  },
  {
    name: 'Portrait & Fashion Shoot',
    price: 45000,
    category: 'Portrait',
    description: 'Studio or outdoor fashion & portrait photography session.',
    deliverables: ['20 Retouched Images', 'Raw Files Provided'],
  },
]

// GET /api/packages
const getPackages = async (req, res, next) => {
  try {
    const { Package } = req.tenant.models
    let packages = await Package.find({ tenantId: req.user.tenantId, status: 'active' })
      .sort({ createdAt: -1 })
      .lean()

    // Auto-seed default package presets if empty
    if (packages.length === 0) {
      const presetsToCreate = DEFAULT_PRESETS.map(p => ({
        ...p,
        tenantId: req.user.tenantId,
      }))
      packages = await Package.insertMany(presetsToCreate)
    }

    const mapped = packages.map(p => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      name: p.name,
      packageName: p.name,
      price: p.price,
      packageAmount: p.price,
      category: p.category || 'Wedding',
      description: p.description || '',
      deliverables: p.deliverables || [],
      status: p.status || 'active',
      createdAt: p.createdAt,
    }))

    return success(res, mapped, 'Packages fetched successfully')
  } catch (err) {
    next(err)
  }
}

// POST /api/packages
const createPackage = async (req, res, next) => {
  try {
    const { Package } = req.tenant.models
    const { name, packageName, price, packageAmount, category, description, deliverables } = req.body

    const finalName = (name || packageName || '').trim()
    const finalPrice = Number(price !== undefined ? price : packageAmount) || 0

    if (!finalName) {
      return badRequest(res, 'Package name is required.')
    }

    const newPackage = await Package.create({
      tenantId: req.user.tenantId,
      name: finalName,
      price: finalPrice,
      category: category || 'Wedding',
      description: description || '',
      deliverables: Array.isArray(deliverables) ? deliverables : (deliverables ? [deliverables] : []),
      status: 'active',
    })

    const mapped = {
      id: newPackage._id.toString(),
      _id: newPackage._id.toString(),
      name: newPackage.name,
      packageName: newPackage.name,
      price: newPackage.price,
      packageAmount: newPackage.price,
      category: newPackage.category,
      description: newPackage.description,
      deliverables: newPackage.deliverables,
      status: newPackage.status,
      createdAt: newPackage.createdAt,
    }

    return created(res, mapped, 'Package created successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/packages/:id
const updatePackage = async (req, res, next) => {
  try {
    const { Package } = req.tenant.models
    const updated = await Package.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).lean()

    if (!updated) return notFound(res, 'Package not found')

    const mapped = {
      id: updated._id.toString(),
      _id: updated._id.toString(),
      name: updated.name,
      packageName: updated.name,
      price: updated.price,
      packageAmount: updated.price,
      category: updated.category,
      description: updated.description,
      deliverables: updated.deliverables,
      status: updated.status,
    }

    return success(res, mapped, 'Package updated successfully')
  } catch (err) {
    next(err)
  }
}

// DELETE /api/packages/:id
const deletePackage = async (req, res, next) => {
  try {
    const { Package } = req.tenant.models
    const pkg = await Package.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!pkg) return notFound(res, 'Package not found')
    return success(res, null, 'Package deleted successfully')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
}
