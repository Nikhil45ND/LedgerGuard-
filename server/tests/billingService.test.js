
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
  test('rejects invoice creation when customer belongs to another tenant', async () => {
  const originalFindOne = Customer.findOne;

  try {
    // Simulate customer lookup returning no match for this tenant.
    Customer.findOne = async (query) => {
      assert.equal(query.tenantId, dummyTenantId);
      return null;
    };

    await assert.rejects(
      async () => {
        await createInvoice({
          tenantId: dummyTenantId,
          customerId: new mongoose.Types.ObjectId(),
          customerName: 'Other Tenant Customer',
          customerEmail: 'other@example.com',
          dueDate: new Date(),
          items: [
            { description: 'Test item', quantity: 1, unitPrice: 100 }
          ]
        });
      },
      /Customer not found or does not belong to this tenant/
    );
  } finally {
    Customer.findOne = originalFindOne;
  }
});
test('creates an invoice when customer belongs to the same tenant', async () => {
  const originalCustomerFindOne = Customer.findOne;
  const originalInvoiceFindOne = Invoice.findOne;
  const originalInvoiceSave = Invoice.prototype.save;
  const originalLedgerCreate = (await import('../src/models/LedgerEntry.js')).LedgerEntry.create;

  try {
    Customer.findOne = async (query) => {
      assert.equal(query.tenantId, dummyTenantId);
      return {
        _id: query._id,
        tenantId: dummyTenantId,
        name: 'Acme Customer',
        email: 'acme@example.com'
      };
    };

    Invoice.findOne = () => ({
      sort: async () => null
    });

    Invoice.prototype.save = async function () {
      this._id = new mongoose.Types.ObjectId();
      return this;
    };

    const { LedgerEntry } = await import('../src/models/LedgerEntry.js');
    LedgerEntry.create = async () => ({});

    const invoice = await createInvoice({
      tenantId: dummyTenantId,
      customerId: new mongoose.Types.ObjectId(),
      customerName: 'Acme Customer',
      customerEmail: 'acme@example.com',
      dueDate: new Date(),
      items: [
        { description: 'Development Service', quantity: 2, unitPrice: 5000 }
      ],
      currency: 'INR'
    });

    assert.equal(invoice.tenantId, dummyTenantId);
    assert.equal(invoice.subtotal, 10000);
    assert.equal(invoice.total, 10000);
  } finally {
    Customer.findOne = originalCustomerFindOne;
    Invoice.findOne = originalInvoiceFindOne;
    Invoice.prototype.save = originalInvoiceSave;

    const { LedgerEntry } = await import('../src/models/LedgerEntry.js');
    LedgerEntry.create = originalLedgerCreate;
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
