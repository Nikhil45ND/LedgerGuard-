
import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';
import { extractTenantContext } from '../middleware/tenantContext.js';
import { requireActiveTenant } from '../middleware/requireActiveTenant.js';

const router = express.Router();

// Apply tenant isolation to every customer route.
router.use(extractTenantContext);
router.use(requireActiveTenant);
router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
