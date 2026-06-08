"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("account");
    if (stored) {
      const acc = JSON.parse(stored);
      setAccountId(acc.id);
      setUsername(acc.username);
    }
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!groupName.trim() || !username.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, username, accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Store session
      localStorage.setItem(
        `session_${data.group.invite_code}`,
        JSON.stringify({ participantId: data.participant.id, username: data.participant.username })
      );
      router.push(`/group/${data.group.invite_code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!joinCode.trim() || !username.trim()) return;
    setLoading(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const res = await fetch(`/api/groups/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(
        `session_${code}`,
        JSON.stringify({ participantId: data.participant.id, username: data.participant.username })
      );
      router.push(`/group/${code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-4xl font-bold mb-2">WC 2026 Predictor</h1>
        <p className="text-gray-400">Predict match scores, compete with friends, claim glory.</p>
      </div>

      <div className="w-full max-w-md">
        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
          <button
            onClick={() => setTab("create")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              tab === "create" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Create Group
          </button>
          <button
            onClick={() => setTab("join")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              tab === "join" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Join Group
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {tab === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Office WC Pool"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Preslav"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Invite Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 uppercase tracking-widest font-mono"
                maxLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Preslav"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? "Joining..." : "Join Group"}
            </button>
          </form>
        )}
      </div>

      {/* How scoring works */}
      <div className="mt-12 w-full max-w-md bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="font-semibold text-gray-300 mb-3">How Points Work</h2>
        <ul className="space-y-1.5 text-sm text-gray-400">
          <li className="flex justify-between"><span>Exact score</span><span className="font-bold text-white">10 pts</span></li>
          <li className="flex justify-between"><span>Correct outcome + goal diff</span><span className="font-bold text-white">7 pts</span></li>
          <li className="flex justify-between"><span>Correct outcome + 1 team score</span><span className="font-bold text-white">6 pts</span></li>
          <li className="flex justify-between"><span>Correct outcome only</span><span className="font-bold text-white">5 pts</span></li>
          <li className="flex justify-between"><span>1 team score only</span><span className="font-bold text-white">1 pt</span></li>
          <li className="flex justify-between"><span>Nothing correct</span><span className="font-bold text-white">0 pts</span></li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">Extra time counts. Penalties do not.</p>
      </div>
    </div>
  );
}
