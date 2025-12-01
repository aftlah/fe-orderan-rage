"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Store token
      localStorage.setItem("auth_token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-[#1f1410] border-b border-[#f3e8d8] dark:border-[#3d342d] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo_rage.png"
              alt="R.A.G.E Logo"
              width={48}
              height={48}
              className="w-12 h-12"
            />
            <div>
              <h1 className="text-lg font-bold text-yellow-300">R.A.G.E</h1>
              <p className="text-xs text-yellow-200/80">Admin Login</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200"
            >
              Order
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-lg border-2 border-amber-300 dark:border-yellow-600 text-amber-900 dark:text-yellow-200"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-10 relative z-10">
        <div className="rounded-2xl bg-white dark:bg-[#1f1410] border border-[#f3e8d8] dark:border-[#3d342d] shadow-lg p-8">
          <h2 className="text-xl font-bold mb-6 text-[#1a1410] dark:text-[#fef3c7]">
            Masuk Admin
          </h2>
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-600 text-white text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-[#1a1410] dark:text-[#fef3c7]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-[#1a1410] dark:text-[#fef3c7]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-[#0a0805] border border-[#f3e8d8] dark:border-[#3d342d] text-[#1a1410] dark:text-[#fef3c7] focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg bg-linear-to-r from-orange-700 to-amber-600 text-white font-semibold shadow hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </main>

      <div className="fixed inset-x-0 top-16 flex justify-center z-50 pointer-events-none">
        <div
          id="appAlertBox"
          className="hidden px-4 py-2 rounded-lg bg-red-600 text-white shadow-lg pointer-events-auto"
        ></div>
      </div>
    </>
  );
}
