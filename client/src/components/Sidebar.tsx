
function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 p-5">
      <h2 className="text-lg font-bold text-gray-800 mb-6">
        Main Menu
      </h2>

      <nav className="space-y-3">
        <a className="block rounded-lg bg-purple-100 text-purple-700 p-3 font-semibold">
          Dashboard
        </a>

        <a className="block rounded-lg text-gray-600 hover:bg-gray-100 p-3">
          Customers
        </a>

        <a className="block rounded-lg text-gray-600 hover:bg-gray-100 p-3">
          Invoices
        </a>

        <a className="block rounded-lg text-gray-600 hover:bg-gray-100 p-3">
          Transactions
        </a>

        <a className="block rounded-lg text-gray-600 hover:bg-gray-100 p-3">
          Ledger
        </a>

        <a className="block rounded-lg text-gray-600 hover:bg-gray-100 p-3">
          Analytics
        </a>

        <a className="block rounded-lg text-gray-600 hover:bg-gray-100 p-3">
          Settings
        </a>
      </nav>
    </aside>
  )
}

export default Sidebar
