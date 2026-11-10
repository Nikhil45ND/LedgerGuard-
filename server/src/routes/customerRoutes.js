
import { Router } from 'express';
import { extractTenantContext } from '../middleware/tenantContext.js';
import * as customerController from '../controllers/customerController.js';

const router = Router();

router.use(extractTenantContext);

router.post('/', customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.patch('/:id', customerController.updateCustomer);
router.patch('/:id/deactivate', customerController.deactivateCustomer);

export default router;
