
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true
    },

    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    company: {
      type: String,
      trim: true
    },

    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate customer emails within the same tenant.
customerSchema.index(
  { tenantId: 1, email: 1 },
  { unique: true }
);

export const Customer =
  mongoose.models.Customer ||
  mongoose.model('Customer', customerSchema);
