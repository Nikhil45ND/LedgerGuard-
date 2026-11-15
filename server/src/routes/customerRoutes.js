
import express from 'express';

import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';

import { extractTenantContext } from '../middleware/tenantContext.js';
import { requireActiveTenant } from '../middleware/requireActiveTenant.js';

const router = express.Router();

// Apply tenant isolation and active tenant validation
router.use(extractTenantContext);
router.use(requireActiveTenant);

// Customer CRUD routes
router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);

// Support both PUT and PATCH updates
router.put('/:id', updateCustomer);
router.patch('/:id', updateCustomer);

// Deactivate and delete customer
router.patch('/:id/deactivate', deactivateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
