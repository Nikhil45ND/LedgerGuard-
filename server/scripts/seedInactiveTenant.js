
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Tenant } from '../src/models/Tenant.js';

async function seedInactiveTenant() {
  try {
    await connectDB();

    const tenantId = new mongoose.Types.ObjectId(
      'cccccccccccccccccccccccc'
    );

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $set: {
          companyName: 'Inactive Demo Company',
          slug: 'inactive-demo-company',
          email: 'inactive@demo.example',
          status: 'inactive',
          plan: 'free'
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('Inactive tenant created:', tenant.companyName);
    console.log('Tenant ID:', tenant._id.toString());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

seedInactiveTenant();
