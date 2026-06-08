"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const [username, setUsername] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("account");
    if (stored) setUsername(JSON.parse(stored).username);
    else setUsername(null);
  }, [pathname]); // re-check on route change

  return (
    <header className="border-b border-gray-800 bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={username ? "/profile" : "/login"} className="flex items-center gap-2 hover:opacity-80 transition">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-lg tracking-tight">WC 2026 Predictor</span>
        </Link>
        <div className="flex items-center gap-3">
          {username ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition"
            >
              <span className="text-green-400">👤</span>
              <span>{username}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg px-4 py-1.5 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
