"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const RULES = [
  { label: "Exact score", pts: "10 pts" },
  { label: "Correct outcome + goal difference", pts: "7 pts" },
  { label: "Correct outcome + 1 team score", pts: "6 pts" },
  { label: "Correct outcome only", pts: "5 pts" },
  { label: "1 team score only (wrong outcome)", pts: "1 pt" },
  { label: "Nothing correct", pts: "0 pts" },
];

export default function NavBar() {
  const [username, setUsername] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("account");
    setUsername(stored ? JSON.parse(stored).username : null);
  }, [pathname]);

  return (
    <>
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={username ? "/profile" : "/login"} className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-lg tracking-tight">WC 2026 Predictor</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1.5 transition hover:border-gray-500"
              title="How points work"
            >
              📋 Rules
            </button>
            {username ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition"
              >
                <span>🏆</span>
                <span>Groups</span>
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

      {/* Rules modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowRules(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">How Points Work</h2>
              <button onClick={() => setShowRules(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <ul className="space-y-2 mb-4">
              {RULES.map((r) => (
                <li key={r.label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">{r.label}</span>
                  <span className="font-bold text-white ml-4 shrink-0">{r.pts}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-800 pt-3 space-y-1 text-xs text-gray-500">
              <p>⚽ Draws always give +2 goal difference bonus (diff is always 0).</p>
              <p>⏱ Extra time score counts. Penalty shootout does not.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
