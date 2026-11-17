# LedgerGuard System Architecture Overview

## 1. Architectural Topology
LedgerGuard is an enterprise multi-tenant billing engine designed to handle financial operations with zero-loss data integrity and concurrency protection.

```
React Frontend UI (Member 4)
       │
       ▼ [HTTPS REST Requests]
Express API Gateway (Member 1)
       │ (JWT Verification & Tenant Context Attachment)
       ▼
LedgerGuard Billing Engine (Member 3)
   ├── Money Precision Guard (Minor-Units Utility)
   ├── Redis Distributed Lock Manager (SET NX PX + Safe Release Lua)
   └── Idempotency Guard (SHA-256 Hashing + Replay Cache)
       │
       ▼ [MongoDB Atomic Transactions / Sessions]
MongoDB Multi-Tenant Database
   ├── invoices (Compound Unique Index: tenantId + invoiceNumber)
   ├── ledgerentries (Append-Only Financial History)
   └── idempotencyrecords (TTL Auto-Purge Expiration)
```

## 2. Multi-Tenant Data Isolation Strategy
* Every document stored in tenant-scoped collections contains a mandatory `tenantId: ObjectId` reference.
* All queries in controllers and services automatically scope down to the authenticated `tenantId`.
* Cross-tenant data leakage is structurally impossible at the database query level.

## 3. Financial Invariant Guarantees
1. **Zero Floating-Point Drift**: All currency numbers are persisted as integer minor units (paise/cents).
2. **Double-Entry Append-Only Ledger**: No financial record is ever updated or deleted. Corrections are applied strictly via balancing ledger entries.
3. **Replay Safety**: Repeated identical requests return the cached result with `Idempotent-Replay: true` rather than charging twice.
