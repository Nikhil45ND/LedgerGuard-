import crypto from 'node:crypto';
import { IdempotencyRecord } from '../models/IdempotencyRecord.js';

/**
 * Generates a deterministic SHA-256 hash for a request payload
 * @param {object} payload 
 * @returns {string} SHA-256 hex digest
 */
export function hashPayload(payload = {}) {
  // Canonical stringify sorting top-level keys
  const sortedKeys = Object.keys(payload).sort();
  const canonicalObj = {};
  for (const k of sortedKeys) {
    canonicalObj[k] = payload[k];
  }
  return crypto.createHash('sha256').update(JSON.stringify(canonicalObj)).digest('hex');
}

/**
 * Checks the status of an idempotency key for a specific tenant
 * @param {string} tenantId 
 * @param {string} key 
 * @param {string} operation 
 * @param {object} payload 
 * @returns {Promise<{ state: 'NEW'|'REPLAY'|'PROCESSING'|'PAYLOAD_MISMATCH', record?: object, requestHash: string }>}
 */
export async function checkIdempotency(tenantId, key, operation, payload = {}) {
  const requestHash = hashPayload(payload);
  const existing = await IdempotencyRecord.findOne({ tenantId, key });

  if (!existing) {
    return { state: 'NEW', requestHash };
  }

  // Check if request payload changed for the same key
  if (existing.requestHash !== requestHash) {
    return {
      state: 'PAYLOAD_MISMATCH',
      message: 'Idempotency key was already used with a different request payload',
      existingRecord: existing,
      requestHash
    };
  }

  if (existing.status === 'processing') {
    return {
      state: 'PROCESSING',
      message: 'A request with this idempotency key is currently processing. Please retry in a moment.',
      existingRecord: existing,
      requestHash
    };
  }

  if (existing.status === 'completed') {
    return {
      state: 'REPLAY',
      responseCode: existing.responseCode,
      responseData: existing.responseData,
      existingRecord: existing,
      requestHash
    };
  }

  // If previous attempt failed, allow retry
  return { state: 'NEW', requestHash };
}

/**
 * Records an operation as currently processing
 */
export async function markAsProcessing(tenantId, key, operation, requestHash, ttlHours = 24) {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  return await IdempotencyRecord.findOneAndUpdate(
    { tenantId, key },
    {
      tenantId,
      key,
      operation,
      requestHash,
      status: 'processing',
      expiresAt
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * Stores the final result of a successful idempotent operation
 */
export async function markAsCompleted(tenantId, key, responseCode, responseData) {
  return await IdempotencyRecord.findOneAndUpdate(
    { tenantId, key },
    {
      status: 'completed',
      responseCode,
      responseData
    },
    { new: true }
  );
}

/**
 * Marks record as failed or deletes it to allow safe retry
 */
export async function markAsFailed(tenantId, key, error) {
  return await IdempotencyRecord.findOneAndUpdate(
    { tenantId, key },
    {
      status: 'failed',
      responseData: { error: error.message || 'Operation failed' }
    },
    { new: true }
  );
}
