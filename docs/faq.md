# LedgerGuard Architectural FAQ

### Q1: Why are monetary amounts represented in integer minor units rather than floating-point decimals?
Standard IEEE-754 floating-point numbers in JavaScript suffer from binary representation inaccuracies (e.g., `0.1 + 0.2 === 0.30000000000000004`). In financial systems, accumulating rounding errors leads to ledger discrepancies. Storing amounts as integer cents or paise guarantees 100% arithmetic precision.

### Q2: How does the system handle concurrent duplicate payment requests?
When a payment request hits `/api/v1/payments`:
1. The server acquires a Redis lock keyed to `lock:payment:{tenantId}:{invoiceId}`.
2. If another request is currently executing for that invoice, the second request is safely rejected with HTTP 409 Conflict.
3. Once completed, the response is recorded in the idempotency cache. Future retries receive the cached response with `Idempotent-Replay: true`.

### Q3: Why is the ledger append-only?
Legal accounting frameworks (e.g. GAAP, IFRS) mandate that financial records cannot be mutated or deleted. Corrections must always be applied as separate, offsetting balancing entries.
