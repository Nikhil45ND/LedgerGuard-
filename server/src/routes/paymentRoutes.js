
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
import { Router } from 'express';
import { extractTenantContext } from '../middleware/tenantContext.js';
import { requireIdempotencyKey } from '../middleware/idempotency.js';
import * as paymentController from '../controllers/paymentController.js';

const router = Router();

// Enforce tenant scoping
router.use(extractTenantContext);

// Critical financial payment route strictly requires an Idempotency-Key
router.post('/', requireIdempotencyKey, paymentController.recordPayment);

export default router;
