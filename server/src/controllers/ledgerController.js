import * as ledgerService from '../services/ledgerService.js';

/**
 * GET /api/v1/ledger
 * Fetch audit ledger entries scoped to the authenticated tenant
 */
export async function getLedger(req, res, next) {
  try {
    const { type, invoiceId, page, limit } = req.query;
    const result = await ledgerService.getLedgerEntries(req.tenantId, {
      type,
      invoiceId,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/dashboard/summary
 * Fetch KPI aggregates for tenant analytics dashboard
 */
export async function getDashboardSummary(req, res, next) {
  try {
    const summary = await ledgerService.getTenantDashboardSummary(req.tenantId);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
}
