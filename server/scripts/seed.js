import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import * as billingService from '../src/services/billingService.js';
import * as paymentService from '../src/services/paymentService.js';
import { formatMoney } from '../src/utils/money.js';

async function runSeed() {
  console.log('\n======================================================');
  console.log('🌱 LedgerGuard - Database Populator & Visualizer');
  console.log('======================================================\n');

  console.log('[1/4] Connecting to your MongoDB database (ledgerguard)...');
  const conn = await connectDB();
  if (!conn) {
    console.error('❌ Could not connect to MongoDB. Make sure MongoDB is running!');
    process.exit(1);
  }

  const sampleTenantId = new mongoose.Types.ObjectId('654321654321654321654321');
  const sampleCustomerId = new mongoose.Types.ObjectId('654321654321654321654322');

  console.log('\n[2/4] Creating a sample invoice for "Acme Global Technologies"...');
  const invoice = await billingService.createInvoice({
    tenantId: sampleTenantId,
    customerId: sampleCustomerId,
    customerName: 'Acme Global Technologies',
    customerEmail: 'billing@acmeglobal.com',
    items: [
      {
        description: 'Cloud Infrastructure Plan (Monthly)',
        quantity: 1,
        unitPrice: 10000 // $100.00 (in minor units)
      },
      {
        description: 'Dedicated Static IPv4',
        quantity: 2,
        unitPrice: 1500  // 2 * $15.00 = $30.00
      }
    ],
    taxRatePercent: 10, // 10% tax
    currency: 'USD',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
    notes: 'Sample billing record for LedgerGuard demonstration'
  });

  console.log(`   ✔ Invoice Created: ${invoice.invoiceNumber}`);
  console.log(`   ✔ Subtotal: ${formatMoney(invoice.subtotal, invoice.currency)}`);
  console.log(`   ✔ Tax (10%): ${formatMoney(invoice.tax, invoice.currency)}`);
  console.log(`   ✔ Total: ${formatMoney(invoice.total, invoice.currency)} (Stored as integer: ${invoice.total})`);
  console.log(`   ✔ Status: ${invoice.status.toUpperCase()}`);

  console.log('\n[3/4] Recording a payment using Idempotency Protection...');
  const idempotencyKey = `seed-pay-key-${Date.now()}`;
  
  const payment = await paymentService.processPayment({
    tenantId: sampleTenantId,
    invoiceId: invoice._id,
    amount: invoice.total,
    currency: invoice.currency,
    paymentMethod: 'CREDIT_CARD_SIMULATION',
    idempotencyKey
  });

  console.log(`   ✔ Payment Recorded: ${payment.transactionId}`);
  console.log(`   ✔ Invoice Updated to: ${payment.status.toUpperCase()}`);
  console.log(`   ✔ Idempotency Key Cached: ${idempotencyKey}`);

  console.log('\n[4/4] Demonstrating Idempotent Retry (Simulating duplicate click)...');
  const retryPayment = await paymentService.processPayment({
    tenantId: sampleTenantId,
    invoiceId: invoice._id,
    amount: invoice.total,
    currency: invoice.currency,
    paymentMethod: 'CREDIT_CARD_SIMULATION',
    idempotencyKey // Reusing the EXACT SAME key!
  });

  console.log(`   ✔ Duplicate payment safely caught!`);
  console.log(`   ✔ isReplay: ${retryPayment.isReplay} (No duplicate money deducted)`);

  console.log('\n======================================================');
  console.log('🎉 SUCCESS! YOUR DATABASE HAS LIVE DATA NOW!');
  console.log('======================================================');
  console.log('\n👉 Open MongoDB Compass:');
  console.log('   1. Click on the "ledgerguard" database on the left.');
  console.log('   2. Click the Refresh icon (🔄).');
  console.log('   3. You will see 3 collections created:');
  console.log('      • "invoices"           (Stores the customer invoices)');
  console.log('      • "ledgerentries"      (Immutable audit log of all money movements)');
  console.log('      • "idempotencyrecords" (Protects against double payments)');
  console.log('\n======================================================\n');

  await disconnectDB();
  process.exit(0);
}

runSeed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
