# LedgerGuard REST API Documentation

## Base URL
`http://localhost:5000/api/v1`

## 1. Invoice Endpoints

### 1.1 Create Invoice
* **Method**: `POST /invoices`
* **Headers**:
  * `Content-Type: application/json`
  * `x-tenant-id: <Tenant_ObjectId>`
* **Request Body**:
```json
{
  "customerId": "654321654321654321654322",
  "customerName": "Acme Corp",
  "customerEmail": "billing@acme.com",
  "items": [
    {
      "description": "Cloud Pro Subscription",
      "quantity": 1,
      "unitPrice": 10000
    }
  ],
  "taxRatePercent": 10,
  "currency": "USD",
  "dueDate": "2026-12-01"
}
```
* **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "invoice": {
    "invoiceNumber": "INV-2026-0001",
    "subtotal": 10000,
    "tax": 1000,
    "total": 11000,
    "currency": "USD",
    "status": "pending"
  }
}
```

### 1.2 List Invoices
* **Method**: `GET /invoices`
* **Query Parameters**: `status`, `customerId`, `page`, `limit`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "invoices": [],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

## 2. Payment Endpoints

### 2.1 Record Payment (Idempotent)
* **Method**: `POST /payments`
* **Headers**:
  * `Content-Type: application/json`
  * `x-tenant-id: <Tenant_ObjectId>`
  * `Idempotency-Key: <unique-uuid>` *(Mandatory)*
* **Request Body**:
```json
{
  "invoiceId": "654321654321654321654323",
  "amount": 11000,
  "currency": "USD",
  "paymentMethod": "SIMULATED_CARD"
}
```
* **Success Response (200 OK)**:
  * Headers: `Idempotent-Replay: true` (if cached)
```json
{
  "success": true,
  "transactionId": "TXN-PAY-1731154-ABCD",
  "status": "paid",
  "amount": 11000,
  "isReplay": false
}
```

## 3. Financial Ledger

### 3.1 Query Audit Trail
* **Method**: `GET /ledger`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "entries": [
    {
      "transactionId": "TXN-PAY-1731154-ABCD",
      "type": "PAYMENT_RECEIVED",
      "amount": 11000,
      "status": "completed"
    }
  ]
}
```

## 4. Tenant Analytics Dashboard

### 4.1 Get Dashboard KPIs
* **Method**: `GET /dashboard/summary`
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalBilled": 11000,
      "totalCollected": 11000,
      "totalOutstanding": 0,
      "invoiceCounts": { "total": 1, "paid": 1, "pending": 0 }
    }
  }
}
```
