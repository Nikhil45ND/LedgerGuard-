
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Tenant ID is required"],
      index: true,
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same email can exist in different tenants,
// but not twice within the same tenant.
userSchema.index(
  { email: 1, tenantId: 1 },
  { unique: true }
);

const User = mongoose.model("User", userSchema);

export default User;
