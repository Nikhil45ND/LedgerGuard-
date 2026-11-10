
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import {
  updateInvoiceStatus,
  createInvoice
} from '../src/services/billingService.js';

import { Invoice } from '../src/models/Invoice.js';
import { Customer } from '../src/models/Customer.js';

describe('Billing Service (services/billingService.js)', () => {
  const dummyTenantId = new mongoose.Types.ObjectId();

  test('validates required fields on createInvoice', async () => {
    await assert.rejects(async () => {
      await createInvoice({
        customerId: 'cust-1',
        dueDate: new Date(),
        items: []
      });
    }, /Tenant ID is required/);

    await assert.rejects(async () => {
      await createInvoice({
        tenantId: dummyTenantId,
        dueDate: new Date(),
        items: []
      });
    }, /Customer ID is required/);

    await assert.rejects(async () => {
      await createInvoice({
        tenantId: dummyTenantId,
        customerId: 'cust-1',
        items: []
      });
    }, /Invoice due date is required/);
  });

  test('updateInvoiceStatus enforces strict financial state transitions', async () => {
    const originalFindOne = Invoice.findOne;

    try {
      Invoice.findOne = async () => ({
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        save: async function () {
          return this;
        }
      });

      const updated = await updateInvoiceStatus(
        dummyTenantId,
        'inv-1',
        'paid'
      );
      assert.equal(updated.status, 'paid');

      Invoice.findOne = async () => ({
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        save: async function () {
          return this;
        }
      });

      const cancelled = await updateInvoiceStatus(
        dummyTenantId,
        'inv-1',
        'cancelled',
        'Client requested'
      );
      assert.equal(cancelled.status, 'cancelled');

      Invoice.findOne = async () => ({
        _id: new mongoose.Types.ObjectId(),
        status: 'cancelled',
        save: async function () {
          return this;
        }
      });

      await assert.rejects(async () => {
        await updateInvoiceStatus(dummyTenantId, 'inv-1', 'paid');
      }, /Invalid status transition/);
    } finally {
      Invoice.findOne = originalFindOne;
    }
  });

  test('prevents invoice creation with another tenant customer', async () => {
    const originalCustomerFindOne = Customer.findOne;

    try {
      Customer.findOne = async (query) => {
        assert.equal(query.tenantId, dummyTenantId);
        return null;
      };

      await assert.rejects(
        async () => {
          await createInvoice({
            tenantId: dummyTenantId,
            customerId: new mongoose.Types.ObjectId(),
            dueDate: new Date(),
            items: [
              {
                description: 'Test item',
                quantity: 1,
                unitPrice: 100
              }
            ]
          });
        },
        /Customer not found or does not belong to this tenant/
      );
    } finally {
      Customer.findOne = originalCustomerFindOne;
    }
  });
});
