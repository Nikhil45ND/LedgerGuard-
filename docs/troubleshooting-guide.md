# LedgerGuard Diagnostic & Troubleshooting Guide

## 1. MongoDB Connection Diagnostics

### Issue: `connect ECONNREFUSED 127.0.0.1:27017`
* **Root Cause**: The local MongoDB Community Service daemon is not actively running.
* **Resolution**:
  1. Open Windows PowerShell as Administrator.
  2. Run `net start MongoDB` or start the MongoDB service from `services.msc`.
  3. Alternatively, supply a cloud connection string via `MONGODB_URI` in `server/.env`.

## 2. Redis Offline Notice

### Notice: `[Redis] Notice: connect ECONNREFUSED 127.0.0.1:6379`
* **Behavior**: This is non-fatal. LedgerGuard immediately engages its in-memory locking coordinator.
* **Resolution**:
  * For local dev, no action is required—tests and API routes continue functioning.
  * For production, configure `REDIS_URL` pointing to an authenticated Redis cluster.

## 3. HTTP Error Code Reference

| Status Code | Error Label | Typical Scenario |
| :--- | :--- | :--- |
| **400 Bad Request** | Missing Idempotency-Key | Client omitted the `Idempotency-Key` header on `/api/v1/payments`. |
| **404 Not Found** | Resource Not Found | Invoice or Customer ID does not exist or belongs to another tenant. |
| **409 Conflict** | Processing In Progress | Duplicate payment request arrived while the initial request is active. |
| **422 Unprocessable**| Payload Mismatch | Client reused an idempotency key with different body parameters. |
