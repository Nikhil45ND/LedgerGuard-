
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/User.js";
import Tenant from "../models/Tenant.js";

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (
      typeof decoded.userId !== "string" ||
      typeof decoded.tenantId !== "string" ||
      !mongoose.Types.ObjectId.isValid(decoded.userId) ||
      !mongoose.Types.ObjectId.isValid(decoded.tenantId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // Verify tenant still exists and is active.
    const tenant = await Tenant.findOne({
      _id: decoded.tenantId,
      status: "active",
    }).select("_id");

    if (!tenant) {
      return res.status(403).json({
        success: false,
        message: "Tenant is inactive, suspended or unavailable",
      });
    }

    // Verify user still exists and is active.
    const user = await User.findOne({
      _id: decoded.userId,
      tenantId: decoded.tenantId,
      isActive: true,
    }).select("_id name email tenantId role");

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive or unavailable",
      });
    }

    req.user = {
      userId: user._id.toString(),
      _id: user._id,
      tenantId: user.tenantId.toString(),
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    next(error);
  }
}

// Only tenant administrators can perform admin operations.
export function authorizeTenantAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Tenant administrator permission required",
    });
  }

  next();
}
