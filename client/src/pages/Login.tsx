
type LoginProps = {
  onLogin: () => void
  onRegister: () => void
}

function Login({ onLogin, onRegister }: LoginProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-purple-700">
          LedgerGuard
        </h1>

        <h2 className="mb-6 text-center text-xl font-semibold">
          Login to Your Account
        </h2>

        <form onSubmit={(e) => {
          e.preventDefault()
          onLogin()
        }} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full rounded-lg border p-3"
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-lg border p-3"
          />

          <button className="w-full rounded-lg bg-purple-700 p-3 font-semibold text-white">
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={onRegister} className="font-semibold text-purple-700">
            Register
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
