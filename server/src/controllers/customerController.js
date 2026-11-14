
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';

/**
 * POST /api/v1/customers
 * Create a customer for the current tenant
 */
export async function createCustomer(req, res, next) {
  try {
    const { name, email, phone, company, address } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and email are required'
      });
    }

    const customer = await Customer.create({
      tenantId: req.tenantId,
      name,
      email,
      phone,
      company,
      address
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Customer email already exists for this tenant'
      });
    }
    next(err);
  }
}

/**
 * GET /api/v1/customers
 * List customers belonging to the current tenant
 */
export async function getCustomers(req, res, next) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { tenantId: req.tenantId };

    if (status) filter.status = status;

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Math.min(Number(limit), 100));

    const total = await Customer.countDocuments(filter);

    res.status(200).json({
      success: true,
      customers,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/customers/:id
 * Retrieve a customer belonging to the current tenant
 */
export async function getCustomerById(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({ success: true, customer });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/customers/:id
 * Update a customer belonging to the current tenant
 */
export async function updateCustomer(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    const allowedFields = ['name', 'email', 'phone', 'company', 'address', 'status'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Customer email already exists for this tenant'
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/v1/customers/:id
 * Delete a customer belonging to the current tenant
 */
export async function deleteCustomer(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}
