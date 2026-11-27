
function Dashboard() {
  const stats = [
    { title: 'Total Customers', value: '120', description: 'Registered customers', icon: '👥' },
    { title: 'Total Invoices', value: '85', description: 'Invoices generated', icon: '📄' },
    { title: 'Total Revenue', value: '₹45,000', description: 'Total earnings', icon: '💰' },
    { title: 'Pending Payments', value: '12', description: 'Payments awaiting', icon: '⏳' },
  ]

  const revenue = [
    { month: 'Jun', amount: 40 },
    { month: 'Jul', amount: 65 },
    { month: 'Aug', amount: 50 },
    { month: 'Sep', amount: 80 },
    { month: 'Oct', amount: 60 },
    { month: 'Nov', amount: 95 },
  ]

  const transactions = [
    { name: 'Rahul Sharma', id: 'TXN001', amount: '₹5,000', status: 'Paid' },
    { name: 'Priya Reddy', id: 'TXN002', amount: '₹3,500', status: 'Pending' },
    { name: 'Arjun Kumar', id: 'TXN003', amount: '₹8,000', status: 'Paid' },
    { name: 'Sneha Rao', id: 'TXN004', amount: '₹2,500', status: 'Overdue' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="mt-2 text-gray-500">
          Welcome to your LedgerGuard dashboard.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.title} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{item.title}</p>
              <span className="text-2xl">{item.icon}</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-purple-700">{item.value}</h2>
            <p className="mt-2 text-sm text-gray-400">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">Monthly Revenue</h2>
        <p className="mb-6 text-sm text-gray-500">
          Revenue generated over the last 6 months
        </p>

        <div className="flex h-64 items-end justify-around gap-4 border-b">
          {revenue.map((item) => (
            <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full max-w-12 rounded-t-lg bg-purple-600"
                style={{ height: `${item.amount}%` }}
              />
              <span className="text-sm text-gray-500">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Status */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-gray-800">Invoice Status</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-5">
            <p className="text-sm text-gray-500">Paid Invoices</p>
            <h3 className="mt-2 text-2xl font-bold text-green-700">55</h3>
          </div>

          <div className="rounded-lg bg-yellow-50 p-5">
            <p className="text-sm text-gray-500">Pending Invoices</p>
            <h3 className="mt-2 text-2xl font-bold text-yellow-700">20</h3>
          </div>

          <div className="rounded-lg bg-red-50 p-5">
            <p className="text-sm text-gray-500">Overdue Invoices</p>
            <h3 className="mt-2 text-2xl font-bold text-red-700">10</h3>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-gray-800">Recent Transactions</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="p-3">Customer</th>
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3 text-sm font-medium">{item.name}</td>
                  <td className="p-3 text-sm text-gray-500">{item.id}</td>
                  <td className="p-3 text-sm font-medium">{item.amount}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      item.status === 'Paid'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
