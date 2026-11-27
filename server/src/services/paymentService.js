import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { acquireLock } from './lockService.js';
import {
  checkIdempotency,
  markAsProcessing,
  markAsCompleted,
  markAsFailed
} from './idempotencyService.js';

export async function processPayment({
  tenantId,
  invoiceId,
  amount,
  currency = 'USD',
  paymentMethod = 'SIMULATED_CARD',
  idempotencyKey,
  actorUserId
}) {
  if (!tenantId) throw new Error('Tenant ID is required for payment processing');
  if (!invoiceId) throw new Error('Invoice ID is required');
  if (!idempotencyKey) {
    const err = new Error('Idempotency-Key header is strictly required for payment operations');
    err.statusCode = 400;
    throw err;
  }

  const payload = {
    invoiceId: String(invoiceId),
    amount: Number(amount),
    currency: currency.toUpperCase(),
    paymentMethod
  };

  const lockKey = `lock:payment:${tenantId}:${invoiceId}`;
  const lock = await acquireLock(lockKey, 6000);

  if (!lock.acquired) {
    const err = new Error('A payment for this invoice is currently in progress. Please retry shortly.');
    err.statusCode = 409;
    throw err;
  }

  try {
    const idempotency = await checkIdempotency(tenantId, idempotencyKey, 'PROCESS_PAYMENT', payload);

    if (idempotency.state === 'REPLAY') {
      return {
        ...idempotency.responseData,
        isReplay: true,
        statusCode: idempotency.responseCode || 200
      };
    }

    if (idempotency.state === 'PROCESSING') {
      const err = new Error(idempotency.message);
      err.statusCode = 409;
      throw err;
    }

    if (idempotency.state === 'PAYLOAD_MISMATCH') {
      const err = new Error(idempotency.message);
      err.statusCode = 422;
      throw err;
    }

    await markAsProcessing(tenantId, idempotencyKey, 'PROCESS_PAYMENT', idempotency.requestHash);

    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
    if (!invoice) {
      const err = new Error('Invoice not found or does not belong to active tenant');
      err.statusCode = 404;
      throw err;
    }

    if (invoice.status === 'paid') {
      const err = new Error(`Invoice ${invoice.invoiceNumber} is already paid in full`);
      err.statusCode = 400;
      throw err;
    }

    if (invoice.status === 'cancelled') {
      const err = new Error(`Cannot record payment for cancelled invoice ${invoice.invoiceNumber}`);
      err.statusCode = 400;
      throw err;
    }

    const paymentAmount = Number(amount);
    if (!Number.isInteger(paymentAmount) || paymentAmount <= 0) {
      const err = new Error('Payment amount must be a positive integer in minor units');
      err.statusCode = 400;
      throw err;
    }

    if (paymentAmount !== invoice.total) {
      const err = new Error(`Payment amount (${paymentAmount}) must match invoice total (${invoice.total})`);
      err.statusCode = 400;
      throw err;
    }

    const transactionId = `TXN-PAY-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const paidAt = new Date();

    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      invoice.status = 'paid';
      invoice.paidAt = paidAt;
      invoice.paymentReference = transactionId;
      await invoice.save({ session });

      const [ledgerEntry] = await LedgerEntry.create([{
        tenantId,
        transactionId,
        invoiceId: invoice._id,
        customerId: invoice.customerId,
        type: 'PAYMENT_RECEIVED',
        amount: paymentAmount,
        currency: invoice.currency,
        status: 'completed',
        idempotencyKey,
        metadata: {
          paymentMethod,
          invoiceNumber: invoice.invoiceNumber,
          actorUserId
        }
      }], { session });

      if (session) {
        await session.commitTransaction();
      }

      const responseData = {
        success: true,
        message: 'Payment recorded successfully',
        transactionId,
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        amount: paymentAmount,
        currency: invoice.currency,
        status: 'paid',
        paidAt,
        ledgerEntryId: ledgerEntry._id,
        isReplay: false
      };

      await markAsCompleted(tenantId, idempotencyKey, 200, responseData);

      return { ...responseData, statusCode: 200 };

    } catch (txErr) {
      if (session) await session.abortTransaction();
      throw txErr;
    } finally {
      if (session) session.endSession();
    }

  } catch (err) {
    await markAsFailed(tenantId, idempotencyKey, err).catch(() => {});
    throw err;
  } finally {
    await lock.release();
  }
}
