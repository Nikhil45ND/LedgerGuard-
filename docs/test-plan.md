# Automated Testing & Verification Report

## 1. Overview
LedgerGuard utilizes Node.js native test runner (`node:test`) and assertion module (`node:assert/strict`) for lightning-fast, zero-dependency unit and regression testing.

## 2. Test Suite Breakdown (22 / 22 Tests Passing)

### 2.1 Financial Precision (`tests/money.test.js`) — 5 Tests
* `toMinorUnits` conversion precision avoiding floating-point drift.
* `toMajorUnits` conversion back to standard display format.
* `formatMoney` currency localized string output.
* Subtotal, percentage-based tax, and line-item calculation integrity.
* Strict validation rejecting non-positive quantities and negative unit prices.

### 2.2 Concurrency & Distributed Locking (`tests/lockService.test.js`) — 4 Tests
* Uncontested lock acquisition on unlocked resources.
* **Mutual exclusion**: Rejecting concurrent acquire attempts while a resource is held.
* Safe lock release using atomic Lua comparison of security tokens.
* Rejection of unauthorized lock release using mismatched tokens.

### 2.3 Idempotency Engine (`tests/idempotencyService.test.js`) — 3 Tests
* Deterministic `SHA-256` hashing ensuring identical digests regardless of JSON key order.
* Differentiation of distinct request bodies.
* State transitions: `NEW`, `PROCESSING`, `REPLAY`, and `PAYLOAD_MISMATCH`.

### 2.4 Billing State Machine (`tests/billingService.test.js`) — 2 Tests
* Required field validations on invoice creation.
* Financial status transition validation (`pending` -> `paid`, rejecting `cancelled` -> `paid`).

### 2.5 Payment Processing & Replay (`tests/paymentService.test.js`) — 4 Tests
* Strict rejection of requests missing `Idempotency-Key` (HTTP 400).
* Replay of completed responses without duplicate charging (`isReplay: true`).
* Rejection of payment amount mismatches.
* Rejection of attempts to pay already settled invoices.

### 2.6 Route Middlewares (`tests/api.test.js`) — 4 Tests
* `requireIdempotencyKey` middleware header validation.
* Attachment of `req.idempotencyKey` context.
* `extractTenantContext` multi-tenant header isolation.
* Setting of `Idempotent-Replay: true` HTTP response header.

## 3. Test Execution Command
```bash
npm test --prefix server
```
* **Status**: 22 passed, 0 failed, duration < 2.5 seconds.
