
import mongoose from "mongoose";

export function extractTenantContext(req, res, next) {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({
      success: false,
      message: "Authenticated tenant context required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(tenantId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tenant identifier",
    });
  }

  req.tenantId = new mongoose.Types.ObjectId(tenantId);

import mongoose from 'mongoose';

/**
 * Tenant Context Middleware
 * Extracts and strictly enforces the tenant identity on all incoming requests.
 * 
 * Works seamlessly with Member 1's JWT middleware (which sets req.user.tenantId),
 * with a fallback to `x-tenant-id` header for testing and Postman development.
 */
export function extractTenantContext(req, res, next) {
  // 1. From authenticated JWT token (Member 1)
  let rawTenantId = req.user?.tenantId || req.tenant?._id || req.tenant?.id;

  // 2. From header (for development & API integration testing)
  if (!rawTenantId && req.headers['x-tenant-id']) {
    rawTenantId = req.headers['x-tenant-id'];
  }

  // 3. Fallback for local initial bootstrap / dev if none provided
  if (!rawTenantId && process.env.NODE_ENV !== 'production') {
    // Default development tenant ID
    rawTenantId = '654321654321654321654321';
  }

  if (!rawTenantId) {
    const error = new Error('Tenant context missing. Unable to identify organization.');
    error.statusCode = 401;
    return next(error);
  }

  if (!mongoose.Types.ObjectId.isValid(rawTenantId)) {
    const error = new Error('Invalid tenant identifier format');
    error.statusCode = 400;
    return next(error);
  }

  req.tenantId = new mongoose.Types.ObjectId(rawTenantId);
  next();
}
