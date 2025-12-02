import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl shadow-2xl p-10 max-w-lg w-full">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3 text-center">
          RAGE Order System
        </h1>
        <p className="text-slate-300 text-center mb-8">
          Your modern ordering platform
        </p>
        <div className="space-y-5">
          <Link
            href="/order"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
          >
            Start Ordering
          </Link>
          <Link
            href="/menu"
            className="w-full border border-purple-500 text-purple-300 py-4 px-6 rounded-xl hover:bg-purple-500/10 hover:text-purple-200 transition-all duration-300"
          >
            View Menu
          </Link>
        </div>
      </div>
    </main>
  );
}
