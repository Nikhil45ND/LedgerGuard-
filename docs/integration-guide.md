# Team Integration Contract & Interface Guide

## 1. Integration with Authentication (Member 1)
The billing engine expects the API gateway to authenticate requests and inject tenant identity into the request pipeline.
* **Header Support**: In development or direct API testing, supply `x-tenant-id: <ObjectId>`.
* **JWT Context**: Member 1's authentication middleware sets `req.user.tenantId`. Our `tenantContext.js` middleware automatically reads and enforces this context.

## 2. Integration with React Frontend (Member 4)
* **Creating Invoices**: Send `POST /api/v1/invoices` with line items, `customerId`, and `taxRatePercent`.
* **Processing Payments**:
  1. Generate a client-side UUID: `const idempotencyKey = crypto.randomUUID()`.
  2. Send `POST /api/v1/payments` with `Idempotency-Key` header.
  3. Inspect response header: if `Idempotent-Replay` is `true`, notify user that the prior receipt was replayed.
* **Dashboard KPIs**: Call `GET /api/v1/dashboard/summary` to retrieve aggregated financial totals for Chart.js charts.
