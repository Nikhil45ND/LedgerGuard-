# Database Architecture & Schema Design

## 1. Overview
LedgerGuard employs MongoDB with Mongoose for managing multi-tenant financial data. To guarantee that tenant data remains isolated, all tenant-owned entities strictly store a `tenantId` reference.

## 2. Core Collections

### 2.1 Invoices (`invoices`)
Stores invoice documents with line items, tax breakdowns, and status tracking.
* **Fields**:
  * `tenantId`: ObjectId (ref: Tenant, required, indexed)
  * `invoiceNumber`: String (format: `INV-YYYY-XXXX`)
  * `customerId`: ObjectId (ref: Customer, required)
  * `customerName`: String
  * `customerEmail`: String
  * `items`: Array of line items `{ description, quantity, unitPrice, amount }`
  * `subtotal`: Number (Integer minor units, e.g. cents/paise)
  * `taxRatePercent`: Number (e.g. 10 for 10%)
  * `tax`: Number (Integer minor units)
  * `total`: Number (Integer minor units)
  * `currency`: String (ISO-4217, default: USD)
  * `dueDate`: Date
  * `status`: Enum (`draft`, `pending`, `paid`, `overdue`, `cancelled`)
  * `paidAt`: Date
  * `paymentReference`: String
* **Indexes**:
  * `{ tenantId: 1, invoiceNumber: 1 }` (Unique compound index)
  * `{ tenantId: 1, status: 1, createdAt: -1 }`
  * `{ tenantId: 1, customerId: 1 }`

### 2.2 Financial Ledger (`ledgerentries`)
An immutable, append-only financial ledger. Every movement of money or invoice issuance creates a permanent entry.
* **Fields**:
  * `tenantId`: ObjectId (ref: Tenant, required)
  * `transactionId`: String (Unique transaction reference)
  * `invoiceId`: ObjectId (ref: Invoice)
  * `customerId`: ObjectId
  * `type`: Enum (`INVOICE_CREATED`, `PAYMENT_RECEIVED`, `REFUND_ISSUED`, `PAYMENT_REVERSED`)
  * `amount`: Number (Integer minor units)
  * `currency`: String
  * `status`: Enum (`pending`, `completed`, `failed`, `reversed`)
  * `idempotencyKey`: String
  * `metadata`: Mixed
* **Immutability Rules**:
  * Mongoose pre-hooks intercept and strictly reject `updateOne`, `updateMany`, `deleteOne`, and `deleteMany`.

### 2.3 Idempotency Records (`idempotencyrecords`)
Ensures critical operations (like payments) are never executed twice.
* **Fields**:
  * `tenantId`: ObjectId (ref: Tenant, required)
  * `key`: String (Client-provided unique key)
  * `operation`: String (`PROCESS_PAYMENT`)
  * `requestHash`: String (SHA-256 hash of canonical JSON body)
  * `status`: Enum (`processing`, `completed`, `failed`)
  * `responseCode`: Number (HTTP status code)
  * `responseData`: Mixed (Cached JSON payload)
  * `expiresAt`: Date (TTL auto-purge timestamp)
* **Indexes**:
  * `{ tenantId: 1, key: 1 }` (Unique compound index)
  * `{ expiresAt: 1 }` (TTL index with `expireAfterSeconds: 0`)
