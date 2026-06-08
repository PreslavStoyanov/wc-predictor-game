"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Account { id: string; username: string; }

export default function GroupsPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [tab, setTab] = useState<"create" | "join">("create");
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("account");
    if (!stored) { router.replace("/login?redirect=/groups"); return; }
    setAccount(JSON.parse(stored));
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!groupName.trim() || !account) return;
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, username: account.username, accountId: account.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(
        `session_${data.group.invite_code}`,
        JSON.stringify({ participantId: data.participant.id, username: data.participant.username })
      );
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!joinCode.trim() || !account) return;
    setLoading(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const res = await fetch(`/api/groups/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: account.username, accountId: account.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(
        `session_${code}`,
        JSON.stringify({ participantId: data.participant.id, username: data.participant.username })
      );
      router.push("/profile");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!account) return null;

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-3xl font-bold mb-1">Groups</h1>
        <p className="text-gray-400 text-sm">Signed in as <span className="text-white font-medium">{account.username}</span></p>
      </div>

      <div className="w-full max-w-md">
        <div className="flex rounded-lg bg-gray-800 p-1 mb-6">
          <button
            onClick={() => setTab("create")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === "create" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Create Group
          </button>
          <button
            onClick={() => setTab("join")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === "join" ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Join Group
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
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
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
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
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
              {loading ? "Joining..." : "Join Group"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
