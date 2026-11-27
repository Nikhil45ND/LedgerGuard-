import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  toMinorUnits,
  toMajorUnits,
  formatMoney,
  calculateInvoiceTotals
} from '../src/utils/money.js';

describe('Financial Money Utility (utils/money.js)', () => {

  test('toMinorUnits converts decimal currencies accurately without floating point drift', () => {
    // 19.99 * 100 often causes 1999.0000000000002 in naive JS; our helper must return exactly 1999
    assert.equal(toMinorUnits(19.99, 'USD'), 1999);
    assert.equal(toMinorUnits('10.50', 'USD'), 1050);
    assert.equal(toMinorUnits(0, 'USD'), 0);
    assert.equal(toMinorUnits(100, 'JPY'), 100); // JPY has 0 decimals
  });

  test('toMajorUnits converts minor units back to human-readable decimals', () => {
    assert.equal(toMajorUnits(1999, 'USD'), 19.99);
    assert.equal(toMajorUnits(1050, 'INR'), 10.50);
    assert.equal(toMajorUnits(500, 'USD'), 5.00);
  });

  test('formatMoney produces properly formatted currency strings', () => {
    const formattedUSD = formatMoney(1999, 'USD');
    assert.ok(formattedUSD.includes('19.99'));

    const formattedINR = formatMoney(10050, 'INR');
    assert.ok(formattedINR.includes('100.50'));
  });

  test('calculateInvoiceTotals accurately computes subtotal, tax and total in minor units', () => {
    const items = [
      { description: 'Cloud Server Pro', quantity: 2, unitPrice: 5000 }, // 2 * $50.00 = $100.00 (10000 cents)
      { description: 'Dedicated IP', quantity: 1, unitPrice: 1500 }       // 1 * $15.00 = $15.00 (1500 cents)
    ];

    // Tax rate: 10%
    const result = calculateInvoiceTotals(items, 10);

    assert.equal(result.subtotal, 11500); // $115.00
    assert.equal(result.tax, 1150);       // 10% of 11500 = $11.50
    assert.equal(result.total, 12650);    // $115.00 + $11.50 = $126.50
    assert.equal(result.itemsWithTotals.length, 2);
    assert.equal(result.itemsWithTotals[0].amount, 10000);
    assert.equal(result.itemsWithTotals[1].amount, 1500);
  });

  test('calculateInvoiceTotals throws error for invalid items or negative prices', () => {
    assert.throws(() => {
      calculateInvoiceTotals([], 10);
    }, /Invoice must contain at least one line item/);

    assert.throws(() => {
      calculateInvoiceTotals([{ description: 'Bad item', quantity: 0, unitPrice: 100 }], 10);
    }, /quantity must be greater than 0/);

    assert.throws(() => {
      calculateInvoiceTotals([{ description: 'Negative price', quantity: 1, unitPrice: -50 }], 10);
    }, /unitPrice must be a non-negative integer minor unit/);
  });

});
