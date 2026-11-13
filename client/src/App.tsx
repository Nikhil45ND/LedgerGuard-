
import { useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const [page, setPage] = useState('login')

  if (page === 'login') {
    return (
      <Login
        onLogin={() => setPage('dashboard')}
        onRegister={() => setPage('register')}
      />
    )
  }

  if (page === 'register') {
    return (
      <Register
        onRegister={() => setPage('login')}
        onLogin={() => setPage('login')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Welcome to your LedgerGuard billing dashboard.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow">
              <p className="text-gray-500">Total Customers</p>
              <h2 className="mt-2 text-3xl font-bold text-purple-700">120</h2>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <p className="text-gray-500">Total Invoices</p>
              <h2 className="mt-2 text-3xl font-bold text-purple-700">85</h2>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <p className="text-gray-500">Total Revenue</p>
              <h2 className="mt-2 text-3xl font-bold text-purple-700">₹45,000</h2>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
