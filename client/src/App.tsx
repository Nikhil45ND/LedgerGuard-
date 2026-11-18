
import { useState } from 'react'

import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Invoices from './pages/Invoices'
import Transactions from './pages/Transactions'

function App() {
  const [page, setPage] = useState('login')

  // Login page
  if (page === 'login') {
    return (
      <Login
        onLogin={() => setPage('dashboard')}
        onRegister={() => setPage('register')}
      />
    )
  }

  // Register page
  if (page === 'register') {
    return (
      <Register
        onRegister={() => setPage('login')}
        onLogin={() => setPage('login')}
      />
    )
  }

  // Main application
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex">
        <Sidebar page={page} setPage={setPage} />

        <main className="flex-1 min-w-0 p-6">
          {/* Dashboard */}
          {page === 'dashboard' && <Dashboard />}

          {/* Customers */}
          {page === 'customers' && <Customers />}

          {/* Invoices */}
          {page === 'invoices' && <Invoices />}

          {/* Transactions */}
          {page === 'transactions' && <Transactions />}

          {/* Other pages */}
          {page !== 'dashboard' &&
            page !== 'customers' &&
            page !== 'invoices' &&
            page !== 'transactions' && (
              <h1 className="text-2xl font-bold text-gray-800 capitalize">
                {page}
              </h1>
            )}
        </main>
      </div>
    </div>
  )
}

export default App
