import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Welcome to RAGE Order System
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Your modern ordering platform
        </p>
        <div className="space-y-4">
          <Link
            href="/order"
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Ordering
          </Link>
          <Link
            href="/menu"
            className="w-full border border-indigo-600 text-indigo-600 py-3 px-4 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            View Menu
          </Link>
        </div>
      </div>
    </main>
  );
}
