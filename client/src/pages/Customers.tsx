
import { useState } from 'react'

function Customers() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const customers = [
    { id: 1, name: 'Rahul Sharma', email: 'rahul@gmail.com', status: 'Active' },
    { id: 2, name: 'Priya Reddy', email: 'priya@gmail.com', status: 'Active' },
    { id: 3, name: 'Arjun Kumar', email: 'arjun@gmail.com', status: 'Inactive' },
    { id: 4, name: 'Sneha Rao', email: 'sneha@gmail.com', status: 'Active' },
    { id: 5, name: 'Kiran Kumar', email: 'kiran@gmail.com', status: 'Inactive' },
    { id: 6, name: 'Ananya Gupta', email: 'ananya@gmail.com', status: 'Active' },
    { id: 7, name: 'Vikram Reddy', email: 'vikram@gmail.com', status: 'Active' },
    { id: 8, name: 'Meena Sharma', email: 'meena@gmail.com', status: 'Inactive' },
    { id: 9, name: 'Rohit Verma', email: 'rohit@gmail.com', status: 'Active' },
    { id: 10, name: 'Divya Rao', email: 'divya@gmail.com', status: 'Inactive' },
  ]

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(
    (customer) => customer.status === 'Active'
  ).length
  const inactiveCustomers = customers.filter(
    (customer) => customer.status === 'Inactive'
  ).length

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'All' || customer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <p className="mt-2 text-gray-500">
          Manage your LedgerGuard customers here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Customers</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-800">
            {totalCustomers}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active Customers</p>
          <h2 className="mt-2 text-2xl font-bold text-green-600">
            {activeCustomers}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inactive Customers</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-600">
            {inactiveCustomers}
          </h2>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-3"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-3"
        >
          <option value="All">All Customers</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td className="p-4">{customer.id}</td>
                  <td className="p-4 font-medium">{customer.name}</td>
                  <td className="p-4 text-gray-500">{customer.email}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        customer.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Customers
