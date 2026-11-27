import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required for multi-tenant isolation'],
    index: true
  },
  transactionId: {
    type: String,
    required: [true, 'Unique transaction ID is required'],
    unique: true,
    index: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  type: {
    type: String,
    enum: ['INVOICE_CREATED', 'PAYMENT_RECEIVED', 'REFUND_ISSUED', 'PAYMENT_REVERSED'],
    required: [true, 'Ledger entry type is required'],
    index: true
  },
  // Stored in integer minor units (paise/cents)
  amount: {
    type: Number,
    required: [true, 'Amount in minor units is required']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed',
    index: true
  },
  idempotencyKey: {
    type: String,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Ledger is append-only: no updatedAt
});

// Compound indexes for fast tenant ledger inspection
ledgerEntrySchema.index({ tenantId: 1, createdAt: -1 });
ledgerEntrySchema.index({ tenantId: 1, invoiceId: 1 });
ledgerEntrySchema.index({ tenantId: 1, type: 1, status: 1 });

// Immutability Guard: Financial ledger entries must never be modified or deleted
const blockMutation = function (next) {
  const err = new Error('Financial Ledger entries are immutable and cannot be updated or deleted');
  err.statusCode = 403;
  next(err);
};

ledgerEntrySchema.pre('updateOne', blockMutation);
ledgerEntrySchema.pre('updateMany', blockMutation);
ledgerEntrySchema.pre('findOneAndUpdate', blockMutation);
ledgerEntrySchema.pre('deleteOne', blockMutation);
ledgerEntrySchema.pre('deleteMany', blockMutation);
ledgerEntrySchema.pre('findOneAndDelete', blockMutation);

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
