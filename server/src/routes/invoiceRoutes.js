
import { Router } from 'express';

import { authenticate } from '../middleware/authMiddleware.js';
import { extractTenantContext } from '../middleware/tenantContext.js';

import { Router } from 'express';
import { extractTenantContext } from '../middleware/tenantContext.js';
import * as invoiceController from '../controllers/invoiceController.js';

const router = Router();

router.use(authenticate, extractTenantContext);
// Enforce tenant scoping across all invoice operations
router.use(extractTenantContext);

router.post('/', invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.patch('/:id/status', invoiceController.updateInvoiceStatus);

export default router;
