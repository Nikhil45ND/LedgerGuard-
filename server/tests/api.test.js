import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { requireIdempotencyKey } from '../src/middleware/idempotency.js';
import { extractTenantContext } from '../src/middleware/tenantContext.js';
import { recordPayment } from '../src/controllers/paymentController.js';
import { IdempotencyRecord } from '../src/models/IdempotencyRecord.js';
import { hashPayload } from '../src/services/idempotencyService.js';

describe('API Middlewares & Payment Controller (tests/api.test.js)', () => {
  const dummyTenantId = new mongoose.Types.ObjectId().toString();

  test('requireIdempotencyKey rejects request when Idempotency-Key header is missing', () => {
    const req = { headers: {} };
    let capturedError = null;
    const res = {};
    const next = (err) => { capturedError = err; };

    requireIdempotencyKey(req, res, next);

    assert.ok(capturedError, 'Middleware should pass error to next()');
    assert.equal(capturedError.statusCode, 400);
    assert.ok(capturedError.message.includes('Idempotency-Key'));
  });

  test('requireIdempotencyKey accepts valid header and attaches req.idempotencyKey', () => {
    const req = {
      headers: {
        'idempotency-key': '   valid-uuid-key-1234   '
      }
    };
    let capturedError = null;
    let nextCalled = false;
    const res = {};
    const next = (err) => {
      capturedError = err;
      nextCalled = true;
    };

    requireIdempotencyKey(req, res, next);

    assert.ifError(capturedError);
    assert.equal(nextCalled, true);
    assert.equal(req.idempotencyKey, 'valid-uuid-key-1234');
  });

  test('extractTenantContext extracts tenantId from headers and converts to ObjectId', () => {
    const req = {
      headers: { 'x-tenant-id': dummyTenantId },
      user: null
    };
    let capturedError = null;
    const res = {};
    const next = (err) => { capturedError = err; };

    extractTenantContext(req, res, next);

    assert.ifError(capturedError);
    assert.ok(req.tenantId instanceof mongoose.Types.ObjectId);
    assert.equal(req.tenantId.toString(), dummyTenantId);
  });

  test('recordPayment controller sets Idempotent-Replay header when replaying cached response', async () => {
    const dummyInvoiceId = new mongoose.Types.ObjectId();
    const payload = {
      invoiceId: String(dummyInvoiceId),
      amount: 5000,
      currency: 'USD',
      paymentMethod: 'SIMULATED_CARD'
    };

    const originalFindOne = IdempotencyRecord.findOne;

    try {
      // Mock that MongoDB IdempotencyRecord already contains this completed payment
      IdempotencyRecord.findOne = async () => ({
        tenantId: new mongoose.Types.ObjectId(dummyTenantId),
        key: 'cached-idemp-key',
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

      const req = {
        tenantId: new mongoose.Types.ObjectId(dummyTenantId),
        idempotencyKey: 'cached-idemp-key',
        body: payload
      };

      const setHeaders = {};
      let responseStatus = null;
      let responseJson = null;

      const res = {
        setHeader: (k, v) => { setHeaders[k] = v; },
        status: (code) => {
          responseStatus = code;
          return {
            json: (data) => { responseJson = data; }
          };
        }
      };

      const next = (err) => {
        if (err) throw err;
      };

      await recordPayment(req, res, next);

      // Verify HTTP response
      assert.equal(responseStatus, 200);
      assert.equal(responseJson.success, true);
      assert.equal(responseJson.isReplay, true);
      assert.equal(responseJson.transactionId, 'TXN-PAY-PREVIOUS-1234');

      // Verify the critical HTTP Header for evaluation
      assert.equal(setHeaders['Idempotent-Replay'], 'true');

    } finally {
      IdempotencyRecord.findOne = originalFindOne;
    }
  });

});
