
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Tenant } from '../src/models/Tenant.js';

async function seedSecondTenant() {
  try {
    await connectDB();

    const tenantId = new mongoose.Types.ObjectId(
      'aaaaaaaaaaaaaaaaaaaaaaaa'
    );

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $setOnInsert: {
          companyName: 'Beta Demo Company',
          slug: 'beta-demo-company',
          email: 'admin@betademo.example',
          status: 'active',
          plan: 'free',
          settings: {
            currency: 'USD',
            timezone: 'UTC'
          }
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('Second tenant ready:', tenant.companyName);
    console.log('Tenant ID:', tenant._id.toString());
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

seedSecondTenant();
