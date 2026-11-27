/**
 * Money Utility Module for LedgerGuard
 * 
 * Rules:
 * 1. Financial amounts are ALWAYS stored as integer minor units (paise/cents).
 * 2. Never store floating-point numbers in MongoDB for money to prevent rounding drift (e.g. 0.1 + 0.2 !== 0.3).
 * 3. Conversions between major and minor units occur strictly at the API boundary.
 */

// Decimal places for supported currencies
const CURRENCY_DECIMALS = {
  USD: 2, // 1 dollar = 100 cents
  INR: 2, // 1 rupee = 100 paise
  EUR: 2, // 1 euro = 100 cents
  GBP: 2, // 1 pound = 100 pence
  JPY: 0  // 1 yen = 1 yen
};

/**
 * Converts a decimal major unit (e.g. 10.50) to integer minor units (e.g. 1050)
 * @param {number|string} amount 
 * @param {string} currency 
 * @returns {number} Integer minor units
 */
export function toMinorUnits(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    throw new Error(`Invalid amount provided: ${amount}`);
  }
  const decimals = CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
  const factor = Math.pow(10, decimals);
  // Math.round ensures 19.99 * 100 = 1999 without float precision artifacts
  return Math.round(Number(amount) * factor);
}

/**
 * Converts integer minor units (e.g. 1050) to decimal major units (e.g. 10.50)
 * @param {number} minorUnits 
 * @param {string} currency 
 * @returns {number} Decimal major units
 */
export function toMajorUnits(minorUnits, currency = 'USD') {
  if (!Number.isInteger(minorUnits)) {
    throw new Error(`Minor units must be an integer, received: ${minorUnits}`);
  }
  const decimals = CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
  const factor = Math.pow(10, decimals);
  return Number((minorUnits / factor).toFixed(decimals));
}

/**
 * Formats minor units into localized currency string (e.g. "$10.50")
 * @param {number} minorUnits 
 * @param {string} currency 
 * @returns {string} Formatted string
 */
export function formatMoney(minorUnits, currency = 'USD') {
  const major = toMajorUnits(minorUnits, currency);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(major);
}

/**
 * Calculates subtotal, tax, and total for an array of invoice line items
 * @param {Array<{ quantity: number, unitPrice: number }>} items List of items (unitPrice in minor units)
 * @param {number} taxRatePercent e.g. 18 for 18% GST/Tax
 * @returns {{ itemsWithTotals: Array, subtotal: number, tax: number, total: number }}
 */
export function calculateInvoiceTotals(items = [], taxRatePercent = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Invoice must contain at least one line item');
  }

  let subtotal = 0;
  const itemsWithTotals = items.map((item, idx) => {
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Item ${idx + 1} (${item.description || 'unnamed'}): quantity must be greater than 0`);
    }

    const unitPrice = Number(item.unitPrice);
    if (!Number.isInteger(unitPrice) || unitPrice < 0) {
      throw new Error(`Item ${idx + 1} (${item.description || 'unnamed'}): unitPrice must be a non-negative integer minor unit`);
    }

    const itemTotal = qty * unitPrice;
    subtotal += itemTotal;

    return {
      description: item.description?.trim() || `Item ${idx + 1}`,
      quantity: qty,
      unitPrice,
      amount: itemTotal
    };
  });

  const tax = Math.round((subtotal * Math.max(0, Number(taxRatePercent))) / 100);
  const total = subtotal + tax;

  return {
    itemsWithTotals,
    subtotal,
    tax,
    total
  };
}
