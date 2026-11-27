import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Line item description is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price in minor units is required'],
    min: [0, 'Unit price cannot be negative']
  },
  amount: {
    type: Number,
    required: [true, 'Line item amount in minor units is required'],
    min: [0, 'Amount cannot be negative']
  }
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is strictly required for multi-tenant isolation'],
    index: true
  },
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required'],
    index: true
  },
  customerName: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  items: {
    type: [lineItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'Invoice must contain at least one line item'
    }
  },
  // All monetary figures are stored as integer minor units (paise/cents)
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxRatePercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  paidAt: {
    type: Date
  },
  paymentReference: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound unique index: Invoice number must be unique per tenant
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });

// Common query indexes
invoiceSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
invoiceSchema.index({ tenantId: 1, customerId: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
