import crypto from 'node:crypto';
import { Invoice } from '../models/Invoice.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { calculateInvoiceTotals } from '../utils/money.js';

/**
 * Generates the next sequential invoice number for a tenant
 * Format: INV-{YEAR}-{SEQUENCE} (e.g. INV-2026-0001)
 */
export async function generateInvoiceNumber(tenantId) {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  // Find the highest existing invoice number for this tenant this year
  const latestInvoice = await Invoice.findOne({
    tenantId,
    invoiceNumber: new RegExp(`^${prefix}`)
  }).sort({ createdAt: -1 });

  let sequence = 1;
  if (latestInvoice && latestInvoice.invoiceNumber) {
    const parts = latestInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

/**
 * Creates a new invoice with minor unit calculations and writes initial ledger entry
 */
export async function createInvoice({
  tenantId,
  customerId,
  customerName,
  customerEmail,
  items,
  taxRatePercent = 0,
  currency = 'USD',
  dueDate,
  notes,
  createdBy
}) {
  if (!tenantId) throw new Error('Tenant ID is required for invoice creation');
  if (!customerId) throw new Error('Customer ID is required');
  if (!dueDate) throw new Error('Invoice due date is required');

  // Compute minor-unit totals safely
  const { itemsWithTotals, subtotal, tax, total } = calculateInvoiceTotals(items, taxRatePercent);

  // Generate unique sequential invoice number
  const invoiceNumber = await generateInvoiceNumber(tenantId);

  // Create invoice document
  const invoice = new Invoice({
    tenantId,
    invoiceNumber,
    customerId,
    customerName,
    customerEmail,
    items: itemsWithTotals,
    subtotal,
    taxRatePercent,
    tax,
    total,
    currency: currency.toUpperCase(),
    dueDate: new Date(dueDate),
    status: 'pending',
    notes,
    createdBy
  });

  const savedInvoice = await invoice.save();

  // Create initial ledger audit record
  const transactionId = `TXN-INV-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await LedgerEntry.create({
    tenantId,
    transactionId,
    invoiceId: savedInvoice._id,
    customerId,
    type: 'INVOICE_CREATED',
    amount: total,
    currency: savedInvoice.currency,
    status: 'completed',
    metadata: {
      invoiceNumber,
      itemCount: items.length,
      dueDate: savedInvoice.dueDate
    }
  });

  return savedInvoice;
}

/**
 * Retrieves invoices scoped strictly to the requesting tenant
 */
export async function getInvoices(tenantId, { status, customerId, page = 1, limit = 20 } = {}) {
  const query = { tenantId };

  if (status) query.status = status;
  if (customerId) query.customerId = customerId;

  const skip = (Math.max(1, page) - 1) * limit;

  const [invoices, totalCount] = await Promise.all([
    Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Invoice.countDocuments(query)
  ]);

  return {
    invoices,
    pagination: {
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

/**
 * Gets a single invoice scoped strictly to the requesting tenant
 */
export async function getInvoiceById(tenantId, invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
  if (!invoice) {
    const error = new Error('Invoice not found or access denied');
    error.statusCode = 404;
    throw error;
  }
  return invoice;
}

/**
 * Updates invoice status with validation guard
 */
export async function updateInvoiceStatus(tenantId, invoiceId, newStatus, reason = '') {
  const allowedTransitions = {
    draft: ['pending', 'cancelled'],
    pending: ['paid', 'overdue', 'cancelled'],
    overdue: ['paid', 'cancelled'],
    paid: ['cancelled'], // Only permitted under strict reversal
    cancelled: []
  };

  const invoice = await getInvoiceById(tenantId, invoiceId);

  const validNextStates = allowedTransitions[invoice.status] || [];
  if (!validNextStates.includes(newStatus)) {
    const error = new Error(`Invalid status transition from "${invoice.status}" to "${newStatus}"`);
    error.statusCode = 400;
    throw error;
  }

  invoice.status = newStatus;
  if (reason) invoice.notes = `${invoice.notes ? invoice.notes + ' | ' : ''}Status update: ${reason}`;
  await invoice.save();

  return invoice;
}
