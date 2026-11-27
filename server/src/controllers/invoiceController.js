import * as billingService from '../services/billingService.js';

/**
 * POST /api/v1/invoices
 * Create a new invoice for the authenticated tenant
 */
export async function createInvoice(req, res, next) {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      items,
      taxRatePercent,
      currency,
      dueDate,
      notes
    } = req.body;

    const invoice = await billingService.createInvoice({
      tenantId: req.tenantId,
      customerId,
      customerName,
      customerEmail,
      items,
      taxRatePercent,
      currency,
      dueDate,
      notes,
      createdBy: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/invoices
 * List all invoices for the authenticated tenant
 */
export async function getInvoices(req, res, next) {
  try {
    const { status, customerId, page, limit } = req.query;
    const result = await billingService.getInvoices(req.tenantId, {
      status,
      customerId,
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
 * GET /api/v1/invoices/:id
 * Retrieve a specific invoice by ID
 */
export async function getInvoiceById(req, res, next) {
  try {
    const invoice = await billingService.getInvoiceById(req.tenantId, req.params.id);
    res.status(200).json({
      success: true,
      invoice
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/invoices/:id/status
 * Update invoice status (e.g. cancelled)
 */
export async function updateInvoiceStatus(req, res, next) {
  try {
    const { status, reason } = req.body;
    const invoice = await billingService.updateInvoiceStatus(
      req.tenantId,
      req.params.id,
      status,
      reason
    );

    res.status(200).json({
      success: true,
      message: `Invoice status updated to "${status}"`,
      invoice
    });
  } catch (err) {
    next(err);
  }
}
