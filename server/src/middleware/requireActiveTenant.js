
import { Tenant } from '../models/Tenant.js';

/**
 * Verify that the requesting tenant exists and is active.
 * Must run after extractTenantContext.
 */
export async function requireActiveTenant(req, res, next) {
  try {
    const tenant = await Tenant.findOne({
      _id: req.tenantId,
      status: 'active'
    }).select('_id companyName status');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or inactive'
      });
    }

    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
}
