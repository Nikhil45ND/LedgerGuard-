
import { Router } from 'express';

import { authenticate } from '../middleware/authMiddleware.js';
import { extractTenantContext } from '../middleware/tenantContext.js';
import { requireIdempotencyKey } from '../middleware/idempotency.js';

import { recordPayment } from '../controllers/paymentController.js';

const router = Router();

router.use(authenticate, extractTenantContext);

router.post(
  '/',
  requireIdempotencyKey,
  recordPayment
);

export default router;
