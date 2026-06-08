"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/profile";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false);
  const [fpUsername, setFpUsername] = useState("");
  const [fpAdminPw, setFpAdminPw] = useState("");
  const [fpNewPw, setFpNewPw] = useState("");
  const [fpNewPwConfirm, setFpNewPwConfirm] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("account")) router.replace(redirect);
  }, [redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
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

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setFpError("");
    if (fpNewPw !== fpNewPwConfirm) { setFpError("Passwords do not match"); return; }
    setFpLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: fpUsername, adminPassword: fpAdminPw, newPassword: fpNewPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFpSuccess(true);
      setTimeout(() => {
        setShowForgot(false);
        setFpSuccess(false);
        setUsername(fpUsername);
        setFpUsername(""); setFpAdminPw(""); setFpNewPw(""); setFpNewPwConfirm("");
      }, 1500);
    } catch (err: unknown) {
      setFpError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFpLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-3xl font-bold mb-1">Sign In</h1>
          <p className="text-gray-400 text-sm">Welcome back! Enter your credentials.</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username" required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-400">Password</label>
              <button type="button" onClick={() => { setShowForgot(true); setFpUsername(username); }}
                className="text-xs text-green-400 hover:text-green-300 transition">
                Forgot password?
              </button>
            </div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password" required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-gray-400">
            New here?{" "}
            <Link href={`/register${redirect !== "/profile" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-green-400 hover:text-green-300">
              Create an account
            </Link>
          </p>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForgot(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Reset Password</h2>
              <button onClick={() => setShowForgot(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            {fpSuccess ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-green-400 font-semibold">Password reset successfully!</p>
                <p className="text-gray-400 text-sm mt-1">You can now sign in with your new password.</p>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-gray-400">
                  Ask your group admin for the admin password to reset your credentials.
                </p>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Your Username</label>
                  <input type="text" value={fpUsername} onChange={(e) => setFpUsername(e.target.value)}
                    placeholder="Username to reset" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Admin Password</label>
                  <input type="password" value={fpAdminPw} onChange={(e) => setFpAdminPw(e.target.value)}
                    placeholder="Provided by group admin" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <input type="password" value={fpNewPw} onChange={(e) => setFpNewPw(e.target.value)}
                    placeholder="At least 4 characters" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                  <input type="password" value={fpNewPwConfirm} onChange={(e) => setFpNewPwConfirm(e.target.value)}
                    placeholder="Repeat new password" required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
                </div>
                {fpError && <p className="text-red-400 text-sm">{fpError}</p>}
                <button type="submit" disabled={fpLoading}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
                  {fpLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
