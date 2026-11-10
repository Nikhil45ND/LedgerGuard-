import { Customer } from '../models/Customer.js';

export async function createCustomer(req, res, next) {
  try {
    const { name, email, phone, company, address } = req.body;

    if (!name || !email) {
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
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A customer with this email already exists in this tenant'
      });
    }

    next(error);
  }
}

export async function getCustomers(req, res, next) {
  try {
    const customers = await Customer.find({
      tenantId: req.tenantId
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req, res, next) {
  try {
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
      data: customer
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const allowedFields = ['name', 'email', 'phone', 'company', 'address', 'status'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
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
      data: customer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A customer with this email already exists in this tenant'
      });
    }

    next(error);
  }
}

export async function deactivateCustomer(req, res, next) {
  try {
    const customer = await Customer.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: req.tenantId
      },
      { $set: { status: 'inactive' } },
      { new: true, runValidators: true }
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
      data: customer
    });
  } catch (error) {
    next(error);
  }
}