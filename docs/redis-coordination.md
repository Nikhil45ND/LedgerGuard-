# Redis Distributed Locking & Concurrency Coordination

## 1. Overview
In a multi-tenant billing platform, race conditions can lead to duplicate payments and corrupted financial balances. LedgerGuard implements a distributed locking pattern utilizing Redis with safe fallback to an in-memory lock coordinator.

## 2. Lock Acquisition
* **Lock Pattern**: `SET resource_key token NX PX ttl_ms`
* **Resource Key Schema**: `lock:payment:{tenantId}:{invoiceId}`
* **Mutual Exclusion**: If another worker holds the key, subsequent requests are immediately rejected or queued with HTTP 409 Conflict.
* **TTL Safeguard**: Locks automatically expire after 5000ms to prevent deadlocks in case of unexpected process termination.

## 3. Atomic Lock Release Protocol
To prevent a process from releasing a lock that has timed out and was subsequently acquired by another concurrent worker, lock releases are executed atomically via a Lua script:

```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
```

## 4. In-Memory Fallback Mechanism
For local development or testing environments where an active Redis server is not provisioned:
* The system utilizes an internal Map with active timeout IDs.
* Ensures mutual exclusion within the Node.js event loop without throwing uncaught connection exceptions.
