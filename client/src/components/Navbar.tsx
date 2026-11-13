
function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-purple-700">
        LedgerGuard
      </h1>

      <div className="flex items-center gap-4">
        <span className="text-gray-600">Welcome</span>

        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
          S
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
