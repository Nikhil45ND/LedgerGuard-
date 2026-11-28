# Security & Idempotency Engineering Specifications

## 1. The Duplicate Payment Hazard
In distributed financial systems, network partitions, client retry storms, or double-clicks can cause duplicate payment processing:
* **Race Condition Hazard**: Two requests arrive within 5ms of each other before the database status flag has finished updating.
* **Network Drop Hazard**: A payment succeeds on the backend, but the HTTP response times out before reaching the client; the client retries the request.

## 2. LedgerGuard Two-Layer Defense

### Layer 1: Distributed Concurrency Lock (Redis)
* **Lock Key**: `lock:payment:{tenantId}:{invoiceId}`
* **Acquisition**: `SET key token NX PX 5000` (Atomic set-if-not-exists with 5000ms expiration).
* **Release Protocol**: Atomic Lua script:
```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
```
* **Safety Invariant**: A request cannot accidentally release another request's lock if execution exceeds the TTL.

### Layer 2: Deterministic SHA-256 Idempotency Cache
* **Request Hashing**: Top-level JSON payload keys are canonically sorted and hashed using `SHA-256`.
* **State Machine**:
  * `NEW`: Creates a record with status `processing`.
  * `PROCESSING`: If a duplicate request arrives while processing, immediately returns `409 Conflict`.
  * `REPLAY`: If already completed, returns the previously cached response with header `Idempotent-Replay: true`.
  * `PAYLOAD_MISMATCH`: If the client reuses an idempotency key with different payload parameters (e.g. altered amounts), rejects with `422 Unprocessable Entity`.
* **Automatic Expiration**: MongoDB TTL index automatically cleans up idempotency records after 24 hours.

## 3. Cryptographic and Environmental Hygiene
* No secrets, credentials, or private keys are committed into version control.
* `.env` is ignored by Git, and `.env.example` provides template variables only.
