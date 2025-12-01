"use client";

import Link from "next/link";
const format = (date: Date, fmt: string): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return fmt
    .replace('EEE', days[date.getDay()])
    .replace('MMM', months[date.getMonth()])
    .replace('d', date.getDate().toString());
};

export function Header() {
  const today = new Date();

  return (
    <header className="bg-white dark:bg-[#1f1410] border-b border-[#f3e8d8] dark:border-[#3d342d] shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/LOGO_RAGE.png"
              alt="R.A.G.E Logo"
              className="w-14"
            />
            <div className="brand-title">
              <h1>R.A.G.E</h1>
              <p className="brand-subtitle">Order System</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex gap-2">
              <Link
                href="/"
                className="px-3 py-2 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20"
              >
                Order
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200 hover:bg-amber-50 dark:hover:bg-yellow-900/20"
              >
                Dashboard
              </Link>
            </nav>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm"
            >
              Logout
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-700 dark:text-yellow-300">
                Today
              </p>
              <p className="text-xs text-slate-500 dark:text-yellow-200/70">
                {format(today, "EEE, MMM d")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
