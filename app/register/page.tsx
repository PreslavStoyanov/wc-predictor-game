"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/profile";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("account")) router.replace(redirect);
  }, [redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("account", JSON.stringify(data.account));
      router.push(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">✨</div>
        <h1 className="text-3xl font-bold mb-1">Create Account</h1>
        <p className="text-gray-400 text-sm">Pick a username and password to get started.</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username" required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 4 characters" required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password" required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
          {loading ? "Creating account..." : "Create Account"}
        </button>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href={`/login${redirect !== "/profile" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-green-400 hover:text-green-300">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
