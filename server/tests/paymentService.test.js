import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { processPayment } from '../src/services/paymentService.js';
import { Invoice } from '../src/models/Invoice.js';
import { IdempotencyRecord } from '../src/models/IdempotencyRecord.js';
import { hashPayload } from '../src/services/idempotencyService.js';

describe('Payment Service & Concurrency (services/paymentService.js)', () => {

  const dummyTenantId = new mongoose.Types.ObjectId();
  const dummyInvoiceId = new mongoose.Types.ObjectId();

  test('strictly rejects payment if Idempotency-Key is missing', async () => {
    await assert.rejects(async () => {
      await processPayment({
        tenantId: dummyTenantId,
        invoiceId: dummyInvoiceId,
        amount: 5000,
        idempotencyKey: null
      });
    }, /Idempotency-Key header is strictly required/);
  });

  test('replays cached response when Idempotency-Key has already completed (no duplicate charge)', async () => {
    const originalFindOne = IdempotencyRecord.findOne;

    try {
      const payload = {
        invoiceId: String(dummyInvoiceId),
        amount: 5000,
        currency: 'USD',
        paymentMethod: 'SIMULATED_CARD'
      };

      // Mock that MongoDB IdempotencyRecord has already completed this exact payment
      IdempotencyRecord.findOne = async () => ({
        tenantId: dummyTenantId,
        key: 'dup-key-123',
        requestHash: hashPayload(payload),
        status: 'completed',
        responseCode: 200,
        responseData: {
          success: true,
          transactionId: 'TXN-PAY-PREVIOUS-1234',
          amount: 5000,
          status: 'paid'
        }
      });

      const result = await processPayment({
        tenantId: dummyTenantId,
        invoiceId: dummyInvoiceId,
        amount: 5000,
        currency: 'USD',
        paymentMethod: 'SIMULATED_CARD',
        idempotencyKey: 'dup-key-123'
      });

      assert.equal(result.isReplay, true, 'Result must indicate it is a replayed response');
      assert.equal(result.transactionId, 'TXN-PAY-PREVIOUS-1234');
      assert.equal(result.amount, 5000);

    } finally {
      IdempotencyRecord.findOne = originalFindOne;
    }
  });

  test('rejects payment if amount does not match invoice total', async () => {
    const originalInvoiceFindOne = Invoice.findOne;
    const originalIdempFindOne = IdempotencyRecord.findOne;
    const originalFindOneAndUpdate = IdempotencyRecord.findOneAndUpdate;

    try {
      IdempotencyRecord.findOne = async () => null; // New request
      IdempotencyRecord.findOneAndUpdate = async () => ({});

      Invoice.findOne = async () => ({
        _id: dummyInvoiceId,
        tenantId: dummyTenantId,
        invoiceNumber: 'INV-2026-0001',
        status: 'pending',
        total: 10000 // $100.00
      });

      await assert.rejects(async () => {
        await processPayment({
          tenantId: dummyTenantId,
          invoiceId: dummyInvoiceId,
          amount: 5000, // Client tries to pay only $50.00
          idempotencyKey: 'partial-pay-key'
        });
      }, /Payment amount \(5000\) must match invoice total \(10000\)/);

    } finally {
      Invoice.findOne = originalInvoiceFindOne;
      IdempotencyRecord.findOne = originalIdempFindOne;
      IdempotencyRecord.findOneAndUpdate = originalFindOneAndUpdate;
    }
  });

  test('refuses to pay an already paid invoice', async () => {
    const originalInvoiceFindOne = Invoice.findOne;
    const originalIdempFindOne = IdempotencyRecord.findOne;
    const originalFindOneAndUpdate = IdempotencyRecord.findOneAndUpdate;

    try {
      IdempotencyRecord.findOne = async () => null;
      IdempotencyRecord.findOneAndUpdate = async () => ({});

      Invoice.findOne = async () => ({
        _id: dummyInvoiceId,
        tenantId: dummyTenantId,
        invoiceNumber: 'INV-2026-0001',
        status: 'paid', // already paid!
        total: 5000
      });

      await assert.rejects(async () => {
        await processPayment({
          tenantId: dummyTenantId,
          invoiceId: dummyInvoiceId,
          amount: 5000,
          idempotencyKey: 'already-paid-key'
        });
      }, /is already paid in full/);

    } finally {
      Invoice.findOne = originalInvoiceFindOne;
      IdempotencyRecord.findOne = originalIdempFindOne;
      IdempotencyRecord.findOneAndUpdate = originalFindOneAndUpdate;
    }
  });

});
