import { Router } from 'express';
import { extractTenantContext } from '../middleware/tenantContext.js';
import * as ledgerController from '../controllers/ledgerController.js';

const router = Router();

router.use(extractTenantContext);

router.get('/', ledgerController.getLedger);

export default router;
