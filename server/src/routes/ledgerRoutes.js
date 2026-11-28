
import { Router } from 'express';

import { authenticate } from '../middleware/authMiddleware.js';
import { extractTenantContext } from '../middleware/tenantContext.js';

import { Router } from 'express';
import { extractTenantContext } from '../middleware/tenantContext.js';
import * as ledgerController from '../controllers/ledgerController.js';

const router = Router();

router.use(authenticate, extractTenantContext);
router.use(extractTenantContext);

router.get('/', ledgerController.getLedger);

export default router;
