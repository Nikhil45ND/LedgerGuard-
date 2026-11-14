
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import { requireActiveTenant } from '../src/middleware/requireActiveTenant.js';
import { Customer } from '../src/models/Customer.js';
import { Tenant } from '../src/models/Tenant.js';


import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../src/controllers/customerController.js';

import { extractTenantContext } from '../src/middleware/tenantContext.js';

function mockResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

async function withMocks(mocks, callback) {
  const originals = mocks.map(({ target, method }) => target[method]);

  try {
    mocks.forEach(({ target, method, replacement }) => {
      target[method] = replacement;
    });

    await callback();
  } finally {
    mocks.forEach(({ target, method }, index) => {
      target[method] = originals[index];
    });
  }
}

describe('Member 2 - Customer Management', () => {
  const tenantId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  test('creates a customer with the correct tenant ID', async () => {
    let savedData;

    await withMocks([
      {
        target: Customer,
        method: 'create',
        replacement: async (data) => {
          savedData = data;
          return { _id: customerId, ...data };
        }
      }
    ], async () => {
      const req = {
        tenantId,
        body: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      };

      const res = mockResponse();

      await createCustomer(req, res, (err) => {
        if (err) throw err;
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(savedData.tenantId.toString(), tenantId.toString());
    });
  });

  test('rejects duplicate customer email within the same tenant', async () => {
    await withMocks([
      {
        target: Customer,
        method: 'create',
        replacement: async () => {
          const error = new Error('Duplicate key');
          error.code = 11000;
          throw error;
        }
      }
    ], async () => {
      const req = {
        tenantId,
        body: {
          name: 'Duplicate Customer',
          email: 'test@example.com'
        }
      };

      const res = mockResponse();

      await createCustomer(req, res, (err) => {
        if (err) throw err;
      });

      assert.equal(res.statusCode, 409);
      assert.equal(
        res.body.message,
        'Customer email already exists for this tenant'
      );
    });
  });

  test('lists only customers belonging to the requesting tenant', async () => {
    let receivedFilter;
    let receivedSkip;
    let receivedLimit;

    const sampleCustomers = [{ name: 'Tenant Customer' }];

    await withMocks([
      {
        target: Customer,
        method: 'find',
        replacement: (filter) => {
          receivedFilter = filter;

          return {
            sort() {
              return this;
            },
            skip(value) {
              receivedSkip = value;
              return this;
            },
            limit(value) {
              receivedLimit = value;
              return Promise.resolve(sampleCustomers);
            }
          };
        }
      },
      {
        target: Customer,
        method: 'countDocuments',
        replacement: async (filter) => {
          assert.deepEqual(filter, receivedFilter);
          return 1;
        }
      }
    ], async () => {
      const req = {
        tenantId,
        query: {
          page: '2',
          limit: '5',
          status: 'active'
        }
      };

      const res = mockResponse();

      await getCustomers(req, res, (err) => {
        if (err) throw err;
      });

      assert.equal(receivedFilter.tenantId, tenantId);
      assert.equal(receivedFilter.status, 'active');
      assert.equal(receivedSkip, 5);
      assert.equal(receivedLimit, 5);
      assert.equal(res.body.total, 1);
    });
  });

  test('retrieves a customer using both customer ID and tenant ID', async () => {
    let receivedFilter;

    await withMocks([
      {
        target: Customer,
        method: 'findOne',
        replacement: async (filter) => {
          receivedFilter = filter;
          return { _id: customerId, tenantId };
        }
      }
    ], async () => {
      const req = {
        tenantId,
        params: { id: customerId.toString() }
      };

      const res = mockResponse();

      await getCustomerById(req, res, (err) => {
        if (err) throw err;
      });

      assert.equal(receivedFilter._id, customerId.toString());
      assert.equal(receivedFilter.tenantId, tenantId);
      assert.equal(res.statusCode, 200);
    });
  });

  test('rejects invalid customer IDs', async () => {
    let databaseCalled = false;

    await withMocks([
      {
        target: Customer,
        method: 'findOne',
        replacement: async () => {
          databaseCalled = true;
          return null;
        }
      }
    ], async () => {
      const req = {
        tenantId,
        params: { id: 'invalid-id' }
      };

      const res = mockResponse();

      await getCustomerById(req, res, (err) => {
        if (err) throw err;
      });

      assert.equal(res.statusCode, 400);
      assert.equal(databaseCalled, false);
    });
  });

  test('updates only permitted customer fields for the correct tenant', async () => {
    let receivedFilter;
    let receivedUpdates;

    await withMocks([
      {
        target: Customer,
        method: 'findOneAndUpdate',
        replacement: async (filter, update) => {
          receivedFilter = filter;
          receivedUpdates = update.$set;
          return { name: 'Updated Customer' };
        }
      }
    ], async () => {
      const req = {
        tenantId,
        params: { id: customerId.toString() },
        body: {
          name: 'Updated Customer',
          status: 'inactive',
          tenantId: new mongoose.Types.ObjectId().toString()
        }
      };

      const res = mockResponse();

      await updateCustomer(req, res, (err) => {
        if (err) throw err;
      });

      assert.equal(receivedFilter.tenantId, tenantId);
      assert.equal(receivedUpdates.name, 'Updated Customer');
      assert.equal(receivedUpdates.status, 'inactive');
      assert.equal(receivedUpdates.tenantId, undefined);
      assert.equal(res.statusCode, 200);
    });
  });

  test('does not delete a customer belonging to another tenant', async () => {
    let receivedFilter;

    await withMocks([
      {
        target: Customer,
        method: 'findOneAndDelete',
        replacement: async (filter) => {
          receivedFilter = filter;
          return null;
        }
      }
    ], async () => {
      const req = {
        tenantId,
        params: { id: customerId.toString() }
      };

      const res = mockResponse();

      await deleteCustomer(req, res, (err) => {
        if (err) throw err;
      });

      assert.equal(receivedFilter.tenantId, tenantId);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.message, 'Customer not found');
    });
  });
});

describe('Member 2 - Database Architecture', () => {
  test('Customer schema references Tenant and requires tenantId', () => {
    const tenantPath = Customer.schema.path('tenantId');

    assert.equal(tenantPath.options.ref, 'Tenant');
    assert.equal(tenantPath.isRequired, true);
  });

  test('Customer schema has a unique compound tenant-email index', () => {
    const indexes = Customer.schema.indexes();

    const compoundIndex = indexes.find(([keys, options]) =>
      keys.tenantId === 1 &&
      keys.email === 1 &&
      options.unique === true
    );

    assert.ok(compoundIndex);
  });

  test('Tenant schema has a unique slug index', () => {
    const indexes = Tenant.schema.indexes();

    const uniqueSlugIndex = indexes.find(([keys, options]) =>
      keys.slug === 1 &&
      options.unique === true
    );

    assert.ok(uniqueSlugIndex);
  });
});

describe('Member 2 - Production Tenant Security', () => {
  const tenantId = new mongoose.Types.ObjectId();
  test('rejects x-tenant-id header as the only identity in production', () => {
    const previousEnvironment = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = 'production';

      const req = {
        headers: {
          'x-tenant-id': tenantId.toString()
        },
        user: null,
        tenant: null
      };

      let capturedError = null;

      extractTenantContext(req, {}, (err) => {
        capturedError = err;
      });

      assert.ok(capturedError);
      assert.equal(capturedError.statusCode, 401);
    } finally {
      if (previousEnvironment === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousEnvironment;
      }
    }
  });

  test('accepts tenant identity from authenticated request context', () => {
    const previousEnvironment = process.env.NODE_ENV;

    try {
      process.env.NODE_ENV = 'production';

      const req = {
        headers: {},
        user: { tenantId: tenantId.toString() }
      };

      let capturedError = null;

      extractTenantContext(req, {}, (err) => {
        capturedError = err;
      });

      assert.ifError(capturedError);
      assert.equal(req.tenantId.toString(), tenantId.toString());
    } finally {
      if (previousEnvironment === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousEnvironment;
      }
    }
  });
});

describe('Member 2 - Active Tenant Middleware', () => {
  const testTenantId = new mongoose.Types.ObjectId();

  test('allows an existing active tenant', async () => {
    await withMocks([
      {
        target: Tenant,
        method: 'findOne',
        replacement: () => ({
          select: async () => ({
            _id: testTenantId,
            companyName: 'Active Company',
            status: 'active'
          })
        })
      }
    ], async () => {
      const req = { tenantId: testTenantId };
      const res = mockResponse();
      let nextCalled = false;

      await requireActiveTenant(req, res, (err) => {
        if (err) throw err;
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(req.tenant.status, 'active');
    });
  });

  test('rejects a nonexistent or inactive tenant', async () => {
    await withMocks([
      {
        target: Tenant,
        method: 'findOne',
        replacement: () => ({
          select: async () => null
        })
      }
    ], async () => {
      const req = { tenantId: testTenantId };
      const res = mockResponse();

      await requireActiveTenant(req, res, (err) => {
        if (err) throw err;
      });

      assert.equal(res.statusCode, 404);
      assert.equal(
        res.body.message,
        'Tenant not found or inactive'
      );
    });
  });

  test('passes database errors to the error handler', async () => {
    const databaseError = new Error('Database unavailable');

    await withMocks([
      {
        target: Tenant,
        method: 'findOne',
        replacement: () => ({
          select: async () => {
            throw databaseError;
          }
        })
      }
    ], async () => {
      const req = { tenantId: testTenantId };
      const res = mockResponse();
      let capturedError;

      await requireActiveTenant(req, res, (err) => {
        capturedError = err;
      });

      assert.equal(capturedError, databaseError);
    });
  });
});
