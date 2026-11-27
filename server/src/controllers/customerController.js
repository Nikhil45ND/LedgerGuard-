
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';

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

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer,
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Customer email already exists for this tenant'
      });
    }
    next(error);
  }
}

export async function getCustomers(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const filter = { tenantId: req.tenantId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Customer.countDocuments(filter);

    return res.status(200).json({
      success: true,
      customers,
      data: customers,
      count: customers.length,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
}

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

    return res.status(200).json({
      success: true,
      customer,
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    const allowedFields = [
      'name',
      'email',
      'phone',
      'company',
      'address',
      'status'
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name cannot be empty'
      });
    }

    if (updates.email !== undefined && !updates.email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer email cannot be empty'
      });
    }

    const customer = await Customer.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId
      },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer,
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Customer email already exists for this tenant'
      });
    }
    next(error);
  }
}

export async function deactivateCustomer(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    const customer = await Customer.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId
      },
      { $set: { status: 'inactive' } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully',
      customer,
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

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

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}
