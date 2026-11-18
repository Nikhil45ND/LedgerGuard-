
import { useState } from 'react'

type SidebarProps = {
  page: string
  setPage: (page: string) => void
}

function Sidebar({ page, setPage }: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const menuItems = [
    'Dashboard',
    'Customers',
    'Invoices',
    'Transactions',
    'Ledger',
    'Analytics',
    'Settings',
  ]

  const handleNavigation = (item: string) => {
    setPage(item.toLowerCase())
    setMenuOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden m-3 rounded-lg bg-purple-600 px-4 py-2 text-white"
      >
        {menuOpen ? 'Close Menu' : 'Open Menu'}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          menuOpen ? 'block' : 'hidden'
        } md:block w-64 min-h-screen bg-white border-r border-gray-200 p-5`}
      >
        <h2 className="text-lg font-bold text-gray-800 mb-6">
          Main Menu
        </h2>

        <nav className="space-y-3">
          {menuItems.map((item) => (
            <button
              key={item}
              onClick={() => handleNavigation(item)}
              className={`block w-full text-left rounded-lg p-3 font-semibold ${
                page === item.toLowerCase()
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
