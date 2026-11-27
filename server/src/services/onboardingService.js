
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Generate a readable, unique tenant slug.
const generateTenantSlug = (organizationName) => {
  const baseSlug = organizationName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 45);

  const uniqueSuffix = crypto.randomBytes(3).toString("hex");

  return `${baseSlug || "organization"}-${uniqueSuffix}`;
};

// Create tenant and its first administrator atomically.
export const onboardOrganization = async ({
  organizationName,
  adminName,
  email,
  password,
}) => {
  // 1. Validate input
  if (!organizationName?.trim() || !adminName?.trim() ||
      !email?.trim() || !password) {
    throw createError("All registration fields are required", 400);
  }

  if (organizationName.trim().length < 2) {
    throw createError("Organization name must contain at least 2 characters", 400);
  }

  if (adminName.trim().length < 2) {
    throw createError("Administrator name must contain at least 2 characters", 400);
  }

  if (password.length < 8) {
    throw createError("Password must contain at least 8 characters", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw createError("Please provide a valid email address", 400);
  }

  // 2. Hash password before opening the transaction.
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Generate tenant details.
  const tenantSlug = generateTenantSlug(organizationName);

  // 4. Start MongoDB transaction.
  const session = await mongoose.startSession();

  let createdTenant;
  let createdUser;

  try {
    await session.withTransaction(
      async () => {
        // Create organization.
        const tenant = new Tenant({
          name: organizationName.trim(),
          slug: tenantSlug,
          email: normalizedEmail,
          status: "active",
        });

        await tenant.save({ session });

        // Create the first tenant administrator.
        const user = new User({
          name: adminName.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          tenantId: tenant._id,
          role: "admin",
          isActive: true,
        });

        await user.save({ session });

        createdTenant = tenant;
        createdUser = user;
      },
      {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      }
    );

    return {
      tenant: {
        id: createdTenant._id,
        name: createdTenant.name,
        slug: createdTenant.slug,
        email: createdTenant.email,
        status: createdTenant.status,
      },
      admin: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        tenantId: createdUser.tenantId,
        role: createdUser.role,
      },
    };
  } finally {
    await session.endSession();
  }
};
