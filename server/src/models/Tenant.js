
import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, "Tenant slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Tenant email is required"],
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    databaseName: {
      type: String,
      trim: true,
    },

    publicKey: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


const Tenant = mongoose.model("Tenant", tenantSchema);

export default Tenant;
