import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },

    slug: {
      type: String,
      required: [true, 'Tenant slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Company email is required'],
      lowercase: true,
      trim: true
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },

    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    },

    settings: {
      currency: {
        type: String,
        default: 'USD',
        uppercase: true
      },
      timezone: {
        type: String,
        default: 'UTC'
      }
    }
  },
  {
    timestamps: true
  }
);

tenantSchema.index({ email: 1 });

export const Tenant =
  mongoose.models.Tenant ||
  mongoose.model('Tenant', tenantSchema);