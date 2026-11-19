
import { useState } from 'react'

function Transactions() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const transactions = [
    {
      id: 'TXN001',
      customer: 'Rahul Sharma',
      amount: 5000,
      date: '2026-11-15',
      status: 'Completed',
    },
    {
      id: 'TXN002',
      customer: 'Priya Reddy',
      amount: 3500,
      date: '2026-11-16',
      status: 'Pending',
    },
    {
      id: 'TXN003',
      customer: 'Arjun Kumar',
      amount: 8000,
      date: '2026-11-16',
      status: 'Completed',
    },
    {
      id: 'TXN004',
      customer: 'Sneha Rao',
      amount: 2500,
      date: '2026-11-17',
      status: 'Failed',
    },
    {
      id: 'TXN005',
      customer: 'Kiran Kumar',
      amount: 4500,
      date: '2026-11-17',
      status: 'Pending',
    },
  ]

  // Calculate transaction summary
  const totalTransactions = transactions.length

  const completedTransactions = transactions.filter(
    (item) => item.status === 'Completed'
  ).length

  const pendingTransactions = transactions.filter(
    (item) => item.status === 'Pending'
  ).length

  const failedTransactions = transactions.filter(
    (item) => item.status === 'Failed'
  ).length

  // Search and filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(search.toLowerCase()) ||
      transaction.customer.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || transaction.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">

      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Transactions
        </h1>
        <p className="text-gray-500 mt-1">
          View and manage payment transactions.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">Total Transactions</p>
          <h2 className="text-2xl font-bold text-purple-700 mt-2">
            {totalTransactions}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">Completed</p>
          <h2 className="text-2xl font-bold text-green-600 mt-2">
            {completedTransactions}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">Pending</p>
          <h2 className="text-2xl font-bold text-yellow-600 mt-2">
            {pendingTransactions}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">Failed</p>
          <h2 className="text-2xl font-bold text-red-600 mt-2">
            {failedTransactions}
          </h2>
        </div>

      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search transaction ID or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:flex-1 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-400"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg p-3"
        >
          <option value="All">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-t">
                  <td className="p-4 font-medium">{transaction.id}</td>
                  <td className="p-4">{transaction.customer}</td>
                  <td className="p-4">
                    ₹{transaction.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">{transaction.date}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        transaction.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : transaction.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default Transactions
