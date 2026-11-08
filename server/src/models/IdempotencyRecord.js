import mongoose from 'mongoose';

const idempotencyRecordSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required for idempotency scoping'],
    index: true
  },
  key: {
    type: String,
    required: [true, 'Idempotency key is required'],
    trim: true
  },
  operation: {
    type: String,
    required: [true, 'Operation name is required'],
    trim: true
  },
  requestHash: {
    type: String,
    required: [true, 'SHA-256 hash of request payload is required']
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
    index: true
  },
  responseCode: {
    type: Number
  },
  responseData: {
    type: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index: Idempotency keys are unique per tenant
idempotencyRecordSchema.index({ tenantId: 1, key: 1 }, { unique: true });

// TTL index: MongoDB automatically purges expired records
idempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyRecord = mongoose.model('IdempotencyRecord', idempotencyRecordSchema);
