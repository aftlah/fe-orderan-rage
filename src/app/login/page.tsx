"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        data = { message: await response.text() };
      }
      if (!response.ok) {
        setError(
          response.status === 401 ? "Email atau password salah" : "Login gagal"
        );
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
      

      <main className="max-w-md mx-auto px-6 py-10 relative z-10">
        <div className="rounded-2xl bg-white dark:bg-card border border-[#f3e8d8] dark:border-border shadow-lg p-8">
          <h2 className="text-xl font-bold mb-6 text-[#1a1410] dark:text-primary">
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
                className="text-sm font-semibold text-[#1a1410] dark:text-primary"
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
                className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-input border border-[#f3e8d8] dark:border-border text-[#1a1410] dark:text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-[#1a1410] dark:text-primary"
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
                className="px-4 py-3 rounded-lg bg-[#fffbf0] dark:bg-input border border-[#f3e8d8] dark:border-border text-[#1a1410] dark:text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
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
