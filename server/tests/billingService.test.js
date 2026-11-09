import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { updateInvoiceStatus, createInvoice } from '../src/services/billingService.js';
import { Invoice } from '../src/models/Invoice.js';

describe('Billing Service (services/billingService.js)', () => {

  const dummyTenantId = new mongoose.Types.ObjectId();

  test('validates required fields on createInvoice', async () => {
    // Missing tenantId
    await assert.rejects(async () => {
      await createInvoice({ customerId: 'cust-1', dueDate: new Date(), items: [] });
    }, /Tenant ID is required/);

    // Missing customerId
    await assert.rejects(async () => {
      await createInvoice({ tenantId: dummyTenantId, dueDate: new Date(), items: [] });
    }, /Customer ID is required/);

    // Missing dueDate
    await assert.rejects(async () => {
      await createInvoice({ tenantId: dummyTenantId, customerId: 'cust-1', items: [] });
    }, /Invoice due date is required/);
  });

  test('updateInvoiceStatus enforces strict financial state transitions', async () => {
    const originalFindOne = Invoice.findOne;

    try {
      // 1. Pending invoice can transition to 'paid'
      Invoice.findOne = async () => ({
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        save: async function() { return this; }
      });
      const updated = await updateInvoiceStatus(dummyTenantId, 'inv-1', 'paid');
      assert.equal(updated.status, 'paid');

      // 2. Pending invoice can transition to 'cancelled'
      Invoice.findOne = async () => ({
        _id: new mongoose.Types.ObjectId(),
        status: 'pending',
        save: async function() { return this; }
      });
      const cancelled = await updateInvoiceStatus(dummyTenantId, 'inv-1', 'cancelled', 'Client requested');
      assert.equal(cancelled.status, 'cancelled');

      // 3. Cancelled invoice CANNOT transition to 'paid' or 'pending'
      Invoice.findOne = async () => ({
        _id: new mongoose.Types.ObjectId(),
        status: 'cancelled',
        save: async function() { return this; }
      });
      await assert.rejects(async () => {
        await updateInvoiceStatus(dummyTenantId, 'inv-1', 'paid');
      }, /Invalid status transition/);

    } finally {
      Invoice.findOne = originalFindOne;
    }
  });

});
