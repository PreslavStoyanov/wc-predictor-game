"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculatePoints } from "@/lib/scoring";
import { format, isPast } from "date-fns";

interface Account { id: string; username: string; }
interface Group { id: string; name: string; invite_code: string; }
interface Participant { id: string; username: string; group_id: string; account_id: string; groups: Group; }
interface Match {
  id: string; home_team: string; away_team: string; match_date: string;
  home_score: number | null; away_score: number | null; is_finished: boolean;
  stage: string; group_label: string | null;
}
interface Prediction { id: string; participant_id: string; match_id: string; home_score: number; away_score: number; }

export default function ProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [localPreds, setLocalPreds] = useState<Record<string, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const loadProfile = useCallback(async (acc: Account) => {
    const res = await fetch(`/api/profile?accountId=${acc.id}`);
    const data = await res.json();
    if (!res.ok) return;
    setParticipants(data.participants);
    setMatches(data.matches);
    setPredictions(data.predictions);
    if (data.participants.length > 0) setActiveGroup(data.participants[0].groups.id);
    // Pre-fill local prediction state
    const mine: Record<string, { home: string; away: string }> = {};
    data.predictions.forEach((p: Prediction) => {
      mine[`${p.participant_id}_${p.match_id}`] = { home: String(p.home_score), away: String(p.away_score) };
    });
    setLocalPreds(mine);
    setLoading(false);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("account");
    if (!stored) { router.replace("/login"); return; }
    const acc = JSON.parse(stored) as Account;
    setAccount(acc);
    loadProfile(acc);
  }, [router, loadProfile]);

  function signOut() {
    localStorage.removeItem("account");
    router.push("/");
  }

  async function savePrediction(participantId: string, matchId: string) {
    const key = `${participantId}_${matchId}`;
    const pred = localPreds[key];
    if (!pred || pred.home === "" || pred.away === "") return;
    setSaving(key);
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, matchId, homeScore: parseInt(pred.home), awayScore: parseInt(pred.away) }),
    });
    if (res.ok) {
      const data = await res.json();
      setPredictions((prev) => {
        const filtered = prev.filter((p) => !(p.participant_id === participantId && p.match_id === matchId));
        return [...filtered, data];
      });
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    }
    setSaving(null);
  }

  function getTotalPoints(participantId: string): number {
    const finished = matches.filter((m) => m.is_finished && m.home_score != null);
    return finished.reduce((total, m) => {
      const p = predictions.find((pr) => pr.participant_id === participantId && pr.match_id === m.id);
      if (!p) return total;
      return total + calculatePoints({ home: p.home_score, away: p.away_score }, { home: m.home_score!, away: m.away_score! });
    }, 0);
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Loading...</div>;

  const activeParticipant = participants.find((p) => p.groups.id === activeGroup);
  const activeGroupData = activeParticipant?.groups;
  const groupMatches = matches; // all matches are shared across groups

  // Group matches by group label
  const matchesByStage: Record<string, Match[]> = {};
  groupMatches.forEach((m) => {
    const key = m.group_label ? `${m.stage} – ${m.group_label}` : m.stage;
    if (!matchesByStage[key]) matchesByStage[key] = [];
    matchesByStage[key].push(m);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{account?.username}</h1>
          <p className="text-gray-400 text-sm">{participants.length} group{participants.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={signOut} className="text-sm text-gray-400 hover:text-white transition border border-gray-700 rounded-lg px-4 py-2">
          Sign Out
        </button>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">You haven&apos;t joined any groups yet.</p>
          <Link href="/groups" className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg font-medium transition">
            Join or Create a Group
          </Link>
        </div>
      ) : (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Sidebar — groups */}
          <div className="lg:w-56 shrink-0 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Your Groups</p>
            {participants.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveGroup(p.groups.id)}
                className={`w-full text-left rounded-xl px-4 py-3 transition border ${
                  activeGroup === p.groups.id
                    ? "bg-green-900/40 border-green-700 text-white"
                    : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-600"
                }`}
              >
                <div className="font-medium text-sm truncate">{p.groups.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 font-mono">{p.groups.invite_code}</span>
                  <span className="text-xs text-yellow-400 font-bold">{getTotalPoints(p.id)} pts</span>
                </div>
              </button>
            ))}
            <Link
              href="/groups"
              className="block w-full text-center text-sm text-gray-400 hover:text-white border border-dashed border-gray-700 rounded-xl px-4 py-3 transition hover:border-gray-500 mt-2"
            >
              + Join another group
            </Link>
          </div>

          {/* Main — predictions for active group */}
          <div className="flex-1 min-w-0">
            {activeGroupData && activeParticipant && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">{activeGroupData.name}</h2>
                  <Link
                    href={`/group/${activeGroupData.invite_code}`}
                    className="text-sm text-green-400 hover:text-green-300 transition"
                  >
                    View Leaderboard →
                  </Link>
                </div>

                <div className="space-y-6">
                  {Object.entries(matchesByStage).map(([stageName, stageMatches]) => (
                    <div key={stageName}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{stageName}</h3>
                      <div className="space-y-2">
                        {stageMatches.map((m) => {
                          const started = isPast(new Date(m.match_date));
                          const myPred = predictions.find(
                            (p) => p.participant_id === activeParticipant.id && p.match_id === m.id
                          );
                          const key = `${activeParticipant.id}_${m.id}`;
                          const local = localPreds[key] ?? {
                            home: myPred ? String(myPred.home_score) : "",
                            away: myPred ? String(myPred.away_score) : "",
                          };

                          let earnedPts: number | null = null;
                          if (m.is_finished && m.home_score != null && myPred) {
                            earnedPts = calculatePoints(
                              { home: myPred.home_score, away: myPred.away_score },
                              { home: m.home_score!, away: m.away_score! }
                            );
                          }

                          return (
                            <div
                              key={m.id}
                              className={`bg-gray-900 rounded-xl border px-4 py-3 ${
                                m.is_finished ? "border-gray-700" : "border-gray-800"
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-wrap">
                                {/* Date */}
                                <span className="text-xs text-gray-500 w-24 shrink-0">
                                  {format(new Date(m.match_date), "d MMM HH:mm")}
                                </span>

                                {/* Teams */}
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                  <span className="font-medium text-sm text-right flex-1 truncate">{m.home_team}</span>
                                  {m.is_finished ? (
                                    <span className="font-mono font-bold text-sm shrink-0 text-yellow-400">
                                      {m.home_score}–{m.away_score}
                                    </span>
                                  ) : (
                                    <span className="text-gray-600 text-xs shrink-0">vs</span>
                                  )}
                                  <span className="font-medium text-sm flex-1 truncate">{m.away_team}</span>
                                </div>

                                {/* Prediction */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {started ? (
                                    myPred ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500">Predicted:</span>
                                        <span className="font-mono text-sm bg-gray-800 rounded px-2 py-0.5">
                                          {myPred.home_score}–{myPred.away_score}
                                        </span>
                                        {earnedPts !== null && (
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded ml-1 ${
                                            earnedPts === 10 ? "bg-yellow-500 text-black" :
                                            earnedPts >= 7 ? "bg-green-700 text-white" :
                                            earnedPts >= 5 ? "bg-blue-800 text-white" :
                                            earnedPts > 0 ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-500"
                                          }`}>
                                            +{earnedPts}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-600 italic">No prediction</span>
                                    )
                                  ) : (
                                    <>
                                      <input
                                        type="number" min={0} max={20}
                                        value={local.home}
                                        onChange={(e) => setLocalPreds((prev) => ({ ...prev, [key]: { ...prev[key] ?? { away: "" }, home: e.target.value } }))}
                                        className="w-10 text-center bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-green-500"
                                        placeholder="0"
                                      />
                                      <span className="text-gray-500 text-sm">–</span>
                                      <input
                                        type="number" min={0} max={20}
                                        value={local.away}
                                        onChange={(e) => setLocalPreds((prev) => ({ ...prev, [key]: { ...prev[key] ?? { home: "" }, away: e.target.value } }))}
                                        className="w-10 text-center bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-green-500"
                                        placeholder="0"
                                      />
                                      <button
                                        onClick={() => savePrediction(activeParticipant.id, m.id)}
                                        disabled={saving === key || local.home === "" || local.away === ""}
                                        className={`text-xs px-3 py-1.5 rounded font-medium transition min-w-[52px] ${
                                          saved[key] ? "bg-green-700 text-white" : "bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white"
                                        }`}
                                      >
                                        {saved[key] ? "✓" : saving === key ? "..." : "Save"}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
