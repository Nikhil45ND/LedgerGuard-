import { LedgerEntry } from '../models/LedgerEntry.js';
import { Invoice } from '../models/Invoice.js';

/**
 * Retrieves audit ledger transactions scoped strictly to tenant
 */
export async function getLedgerEntries(tenantId, { type, invoiceId, page = 1, limit = 20 } = {}) {
  const query = { tenantId };

  if (type) query.type = type;
  if (invoiceId) query.invoiceId = invoiceId;

  const skip = (Math.max(1, page) - 1) * limit;

  const [entries, totalCount] = await Promise.all([
    LedgerEntry.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    LedgerEntry.countDocuments(query)
  ]);

  return {
    entries,
    pagination: {
      total: totalCount,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

/**
 * Calculates tenant financial summary / dashboard KPIs
 */
export async function getTenantDashboardSummary(tenantId) {
  // Aggregate invoices by status
  const invoiceStats = await Invoice.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' }
      }
    }
  ]);

  const statsMap = {
    draft: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    paid: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 }
  };

  for (const s of invoiceStats) {
    if (statsMap[s._id]) {
      statsMap[s._id] = { count: s.count, amount: s.totalAmount };
    }
  }

  // Aggregate collected payments from ledger
  const paymentStats = await LedgerEntry.aggregate([
    { $match: { tenantId, type: 'PAYMENT_RECEIVED', status: 'completed' } },
    {
      $group: {
        _id: null,
        totalCollected: { $sum: '$amount' },
        paymentCount: { $sum: 1 }
      }
    }
  ]);

  const totalCollected = paymentStats[0]?.totalCollected || 0;
  const totalBilled = (statsMap.pending.amount + statsMap.paid.amount + statsMap.overdue.amount);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);

  // Fetch recent ledger activity (last 5)
  const recentActivity = await LedgerEntry.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    kpis: {
      totalBilled,
      totalCollected,
      totalOutstanding,
      invoiceCounts: {
        total: statsMap.draft.count + statsMap.pending.count + statsMap.paid.count + statsMap.overdue.count + statsMap.cancelled.count,
        paid: statsMap.paid.count,
        pending: statsMap.pending.count,
        overdue: statsMap.overdue.count,
        draft: statsMap.draft.count
      }
    },
    recentActivity
  };
}
