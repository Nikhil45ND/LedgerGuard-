
import { useState } from 'react'

function Invoices() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  const invoices = [
    { id: 'INV001', customer: 'Rahul Sharma', amount: 5000, dueDate: '2026-11-20', status: 'Paid' },
    { id: 'INV002', customer: 'Priya Reddy', amount: 3500, dueDate: '2026-11-22', status: 'Pending' },
    { id: 'INV003', customer: 'Arjun Kumar', amount: 8000, dueDate: '2026-11-15', status: 'Overdue' },
    { id: 'INV004', customer: 'Sneha Rao', amount: 2500, dueDate: '2026-11-25', status: 'Paid' },
    { id: 'INV005', customer: 'Kiran Kumar', amount: 4500, dueDate: '2026-11-28', status: 'Pending' },
  ]

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customer.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <p className="mt-2 text-gray-500">
          Manage and track your customer invoices here.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by invoice ID or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3"
        >
          <option value="All">All Invoices</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Invoice ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="p-4 font-medium">{invoice.id}</td>
                  <td className="p-4">{invoice.customer}</td>
                  <td className="p-4">
                    ₹{invoice.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">{invoice.dueDate}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      invoice.status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Invoices
