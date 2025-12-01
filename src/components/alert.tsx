"use client";

import { useEffect, useState } from "react";

interface AlertProps {
  message: string;
  type?: "success" | "error" | "info";
}

export function Alert({ message, type = "info" }: AlertProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      // Trigger visibility update via a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setVisible(true));
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!visible || !message) return null;

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-yellow-600";

  return (
    <div className="fixed inset-x-0 top-16 flex justify-center z-50 pointer-events-none">
      <div
        className={`${bgColor} px-4 py-2 rounded-lg text-white shadow-lg pointer-events-auto`}
      >
        {message}
      </div>
    </div>
  );
}
