"use client";

import Link from "next/link";
import Image from "next/image";
const format = (date: Date, fmt: string): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return fmt
    .replace("EEE", days[date.getDay()])
    .replace("MMM", months[date.getMonth()])
    .replace("d", date.getDate().toString());
};

export function Header() {
  const today = new Date();

  return (
    <header className="bg-white dark:bg-card border-b border-[#f3e8d8] dark:border-border shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={process.env.NEXT_PUBLIC_LOGO_PATH ?? "/images/LOGO_RAGE.png"}
              alt="R.A.G.E Logo"
              width={50}
              height={50}
              className="w-17 h-20"
            />
            <div className="brand-title text-[24px] font-extrabold text-[#fbbf24] tracking-[-0.5px]">
              <h1 className="dark:text-accent-primary font-black font-[var(--font-heading)]">R.A.G.E</h1>
              <p className="text-[11px] text-[#a89968] font-medium tracking-[0.5px] uppercase font-[var(--font-body)]">
                Order System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex gap-2">
              <Link
                href="/order"
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
              className="px-3 py-2 rounded-lg bg-linear-to-r from-red-600 to-orange-600 text-white text-sm"
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
