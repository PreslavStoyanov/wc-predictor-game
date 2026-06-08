"use client";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  is_finished: boolean;
  stage: string;
  group_label: string | null;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  // Add match form
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [stage, setStage] = useState("Group Stage");
  const [groupLabel, setGroupLabel] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  // Result editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHome, setEditHome] = useState("");
  const [editAway, setEditAway] = useState("");
  const [editFinished, setEditFinished] = useState(false);

  const fetchMatches = useCallback(async (pw: string) => {
    setLoading(true);
    const res = await fetch("/api/admin/matches", {
      headers: { "x-admin-password": pw },
    });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setMatches(data);
    setLoading(false);
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/matches", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      const data = await res.json();
      setMatches(data);
      setAuthed(true);
    } else {
      setAuthError("Incorrect password");
    }
  }

  useEffect(() => {
    if (authed) fetchMatches(password);
  }, [authed, password, fetchMatches]);

  async function handleAddMatch(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess(false);
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ homeTeam, awayTeam, matchDate, stage, groupLabel: groupLabel || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error);
      return;
    }
    setHomeTeam(""); setAwayTeam(""); setMatchDate(""); setGroupLabel("");
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
    fetchMatches(password);
  }

  async function saveResult(id: string) {
    const res = await fetch("/api/admin/results", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({
        id,
        homeScore: parseInt(editHome),
        awayScore: parseInt(editAway),
        isFinished: editFinished,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchMatches(password);
    }
  }

  async function deleteMatch(id: string) {
    if (!confirm("Delete this match? All predictions for it will also be deleted.")) return;
    await fetch("/api/admin/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id }),
    });
    fetchMatches(password);
  }

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            required
          />
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button onClick={() => fetchMatches(password)} className="text-sm text-gray-400 hover:text-white transition">
          Refresh
        </button>
      </div>

      {/* Add Match */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h2 className="font-semibold mb-4">Add Match</h2>
        <form onSubmit={handleAddMatch} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            placeholder="Home Team"
            required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
          />
          <input
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            placeholder="Away Team"
            required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
          />
          <input
            type="datetime-local"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            required
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
          />
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 text-sm"
          >
            <option>Group Stage</option>
            <option>Round of 32</option>
            <option>Round of 16</option>
            <option>Quarter-finals</option>
            <option>Semi-finals</option>
            <option>Third-place Play-off</option>
            <option>Final</option>
          </select>
          <input
            value={groupLabel}
            onChange={(e) => setGroupLabel(e.target.value)}
            placeholder="Group Label (e.g. Group A)"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
          />
          <button
            type="submit"
            className={`bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg transition text-sm ${addSuccess ? "bg-green-700" : ""}`}
          >
            {addSuccess ? "Added!" : "Add Match"}
          </button>
          {addError && <p className="col-span-2 text-red-400 text-sm">{addError}</p>}
        </form>
      </div>

      {/* Matches List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold">Matches ({matches.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : matches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No matches yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {matches.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">{m.stage}{m.group_label ? ` – ${m.group_label}` : ""}</span>
                      <span className="text-xs text-gray-600">{format(new Date(m.match_date), "d MMM yyyy HH:mm")}</span>
                      {m.is_finished && <span className="text-xs text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded">Final</span>}
                    </div>
                    <div className="font-semibold">
                      {m.home_team} vs {m.away_team}
                      {m.is_finished && m.home_score != null && (
                        <span className="ml-2 text-yellow-400 font-mono">
                          {m.home_score}–{m.away_score}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(m.id);
                        setEditHome(m.home_score != null ? String(m.home_score) : "");
                        setEditAway(m.away_score != null ? String(m.away_score) : "");
                        setEditFinished(m.is_finished);
                      }}
                      className="text-xs bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded text-white transition"
                    >
                      Set Result
                    </button>
                    <button
                      onClick={() => deleteMatch(m.id)}
                      className="text-xs bg-red-900 hover:bg-red-800 px-3 py-1.5 rounded text-white transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === m.id && (
                  <div className="mt-3 flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                    <input
                      type="number"
                      min={0}
                      value={editHome}
                      onChange={(e) => setEditHome(e.target.value)}
                      className="w-14 text-center bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="H"
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="number"
                      min={0}
                      value={editAway}
                      onChange={(e) => setEditAway(e.target.value)}
                      className="w-14 text-center bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      placeholder="A"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFinished}
                        onChange={(e) => setEditFinished(e.target.checked)}
                        className="rounded"
                      />
                      Mark as finished
                    </label>
                    <button onClick={() => saveResult(m.id)} className="text-xs bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-white transition">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-white transition">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
