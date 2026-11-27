
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Tenant } from '../src/models/Tenant.js';
import { Customer } from '../src/models/Customer.js';

async function seedTenantCustomers() {
  try {
    console.log('Connecting to LedgerGuard MongoDB...');

    const connection = await connectDB();

    if (!connection) {
      throw new Error('MongoDB connection failed');
    }

    // These IDs match the existing billing seed script.
    const tenantId = new mongoose.Types.ObjectId(
      '654321654321654321654321'
    );

    const customerId = new mongoose.Types.ObjectId(
      '654321654321654321654322'
    );

    // 1. Create Tenant if it does not already exist.
    let tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      tenant = await Tenant.create({
        _id: tenantId,
        companyName: 'Acme Global Technologies',
        slug: 'acme-global-technologies',
        email: 'admin@acmeglobal.com',
        status: 'active',
        plan: 'professional',
        settings: {
          currency: 'USD',
          timezone: 'UTC'
        }
      });

      console.log('Tenant created:', tenant.companyName);
    } else {
      console.log('Tenant already exists:', tenant.companyName);
    }

    // 2. Create Customer if it does not already exist.
    let customer = await Customer.findById(customerId);

    if (customer) {
      if (customer.tenantId.toString() !== tenantId.toString()) {
        throw new Error(
          'Existing customer belongs to a different tenant'
        );
      }

      console.log('Customer already exists:', customer.name);
    } else {
      customer = await Customer.create({
        _id: customerId,
        tenantId,
        name: 'Acme Global Technologies',
        email: 'billing@acmeglobal.com',
        phone: '9876543210',
        company: 'Acme Global Technologies',
        status: 'active'
      });

      console.log('Customer created:', customer.name);
    }

    console.log('\nTenant and Customer seed completed successfully.');
    console.log('Tenant ID:', tenant._id.toString());
    console.log('Customer ID:', customer._id.toString());

  } catch (error) {
    console.error('Seed error:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

seedTenantCustomers();
