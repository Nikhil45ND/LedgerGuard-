import * as paymentService from '../services/paymentService.js';

/**
 * POST /api/v1/payments
 * Record a payment against an invoice with strict idempotency enforcement
 */
export async function recordPayment(req, res, next) {
  try {
    const { invoiceId, amount, currency, paymentMethod } = req.body;

    const result = await paymentService.processPayment({
      tenantId: req.tenantId,
      invoiceId,
      amount,
      currency,
      paymentMethod,
      idempotencyKey: req.idempotencyKey,
      actorUserId: req.user?._id
    });

    // If this request was served from the idempotency cache, add standard replay header
    if (result.isReplay) {
      res.setHeader('Idempotent-Replay', 'true');
    }

    res.status(result.statusCode || 200).json(result);
  } catch (err) {
    next(err);
  }
}
