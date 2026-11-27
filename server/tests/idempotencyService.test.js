import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {
  hashPayload,
  checkIdempotency,
  markAsProcessing,
  markAsCompleted
} from '../src/services/idempotencyService.js';
import { IdempotencyRecord } from '../src/models/IdempotencyRecord.js';

describe('Idempotency Service (services/idempotencyService.js)', () => {

  const dummyTenantId = new mongoose.Types.ObjectId();

  test('hashPayload produces identical SHA-256 hashes regardless of JSON key ordering', () => {
    const payloadA = { amount: 5000, currency: 'USD', invoiceId: 'inv-123' };
    const payloadB = { invoiceId: 'inv-123', currency: 'USD', amount: 5000 };

    const hashA = hashPayload(payloadA);
    const hashB = hashPayload(payloadB);

    assert.equal(hashA, hashB, 'Hashes must match even if keys are arranged in different order');
    assert.equal(hashA.length, 64, 'SHA-256 hex string should be 64 characters');
  });

  test('hashPayload produces different hashes for different payloads', () => {
    const hash1 = hashPayload({ amount: 5000 });
    const hash2 = hashPayload({ amount: 9999 });

    assert.notEqual(hash1, hash2);
  });

  test('mock-based checkIdempotency identifies NEW, REPLAY, PROCESSING and PAYLOAD_MISMATCH', async () => {
    // We can verify the logic directly using mock findOne
    const originalFindOne = IdempotencyRecord.findOne;

    try {
      // 1. When key does not exist -> NEW
      IdempotencyRecord.findOne = async () => null;
      const resNew = await checkIdempotency(dummyTenantId, 'key-1', 'RECORD_PAYMENT', { amount: 5000 });
      assert.equal(resNew.state, 'NEW');

      // 2. When key exists and is processing -> PROCESSING
      IdempotencyRecord.findOne = async () => ({
        tenantId: dummyTenantId,
        key: 'key-2',
        requestHash: hashPayload({ amount: 5000 }),
        status: 'processing'
      });
      const resProcessing = await checkIdempotency(dummyTenantId, 'key-2', 'RECORD_PAYMENT', { amount: 5000 });
      assert.equal(resProcessing.state, 'PROCESSING');

      // 3. When key exists and is completed -> REPLAY
      IdempotencyRecord.findOne = async () => ({
        tenantId: dummyTenantId,
        key: 'key-3',
        requestHash: hashPayload({ amount: 5000 }),
        status: 'completed',
        responseCode: 200,
        responseData: { success: true, txnId: 'TXN-999' }
      });
      const resReplay = await checkIdempotency(dummyTenantId, 'key-3', 'RECORD_PAYMENT', { amount: 5000 });
      assert.equal(resReplay.state, 'REPLAY');
      assert.equal(resReplay.responseCode, 200);
      assert.equal(resReplay.responseData.txnId, 'TXN-999');

      // 4. When key is reused with a different request payload -> PAYLOAD_MISMATCH
      IdempotencyRecord.findOne = async () => ({
        tenantId: dummyTenantId,
        key: 'key-4',
        requestHash: hashPayload({ amount: 5000 }), // originally $50
        status: 'completed'
      });
      // Client tries to call again with amount 9000 ($90) using the old key
      const resMismatch = await checkIdempotency(dummyTenantId, 'key-4', 'RECORD_PAYMENT', { amount: 9000 });
      assert.equal(resMismatch.state, 'PAYLOAD_MISMATCH');

    } finally {
      // Restore original findOne
      IdempotencyRecord.findOne = originalFindOne;
    }
  });

});
