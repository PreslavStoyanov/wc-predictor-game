"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { calculatePoints, pointsBreakdown } from "@/lib/scoring";
import { format, isPast, formatDistanceToNow } from "date-fns";

interface Match {
  id: string; home_team: string; away_team: string; match_date: string;
  home_score: number | null; away_score: number | null;
  is_finished: boolean; stage: string; group_label: string | null;
}
interface Participant { id: string; username: string; group_id: string; }
interface Group { id: string; name: string; invite_code: string; participants: Participant[]; }
interface Prediction { id: string; participant_id: string; match_id: string; home_score: number; away_score: number; }
interface LeaderboardEntry {
  username: string; participantId: string; totalPoints: number;
  matchesScored: number; exactScores: number; predictionsCount: number;
}
interface Session { participantId: string; username: string; }

type Tab = "predictions" | "leaderboard" | "participants";

export default function GroupClient({ code }: { code: string }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tab, setTab] = useState<Tab>("predictions");
  const [loading, setLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [localPreds, setLocalPreds] = useState<Record<string, { home: string; away: string }>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const groupIdRef = useRef<string | null>(null);

  const fetchGroupAndPredictions = useCallback(async (groupId: string) => {
    const ts = Date.now();
    const [groupRes, predsRes] = await Promise.all([
      fetch(`/api/groups/${code}?t=${ts}`, { cache: "no-store" }),
      fetch(`/api/predictions?groupId=${groupId}&t=${ts}`, { cache: "no-store" }),
    ]);
    if (groupRes.ok) setGroup(await groupRes.json());
    const predsData = await predsRes.json();
    if (Array.isArray(predsData)) setPredictions(predsData);
  }, [code]);

  const loadData = useCallback(async (sess: Session) => {
    const ts = Date.now();
    const [groupRes, matchesRes] = await Promise.all([
      fetch(`/api/groups/${code}?t=${ts}`, { cache: "no-store" }),
      fetch("/api/matches", { cache: "no-store" }),
    ]);
    const groupData = await groupRes.json();
    const matchesData = await matchesRes.json();
    if (!groupRes.ok) return;
    setGroup(groupData);
    groupIdRef.current = groupData.id;
    setMatches(Array.isArray(matchesData) ? matchesData : []);

    const predsRes = await fetch(`/api/predictions?groupId=${groupData.id}&t=${ts}`, { cache: "no-store" });
    const predsData = await predsRes.json();
    if (Array.isArray(predsData)) {
      setPredictions(predsData);
      const mine: Record<string, { home: string; away: string }> = {};
      predsData
        .filter((p: Prediction) => p.participant_id === sess.participantId)
        .forEach((p: Prediction) => {
          mine[p.match_id] = { home: String(p.home_score), away: String(p.away_score) };
        });
      setLocalPreds((prev) => ({ ...mine, ...prev }));
    }
    setLoading(false);
  }, [code]);

  // Auto-poll every 30s to pick up new participants & results
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (groupIdRef.current) fetchGroupAndPredictions(groupIdRef.current);
    }, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchGroupAndPredictions]);

  useEffect(() => {
    const account = localStorage.getItem("account");
    if (!account) { router.replace(`/login?redirect=/group/${code}`); return; }
    const acc = JSON.parse(account);
    const existingSession = localStorage.getItem(`session_${code}`);
    if (existingSession) {
      const sess = JSON.parse(existingSession) as Session;
      setSession(sess);
      loadData(sess);
    } else {
      fetch(`/api/groups/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: acc.id }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.participant) {
            const sess = { participantId: data.participant.id, username: data.participant.username };
            localStorage.setItem(`session_${code}`, JSON.stringify(sess));
            setSession(sess);
            loadData(sess);
          } else { setLoading(false); }
        });
    }
  }, [code, loadData, router]);

  async function savePrediction(matchId: string) {
    if (!session) return;
    const pred = localPreds[matchId];
    if (!pred || pred.home === "" || pred.away === "") return;
    setSavingMatchId(matchId);
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: session.participantId, matchId, homeScore: parseInt(pred.home), awayScore: parseInt(pred.away) }),
    });
    if (res.ok) {
      const data = await res.json();
      setPredictions((prev) => {
        const filtered = prev.filter((p) => !(p.participant_id === session.participantId && p.match_id === matchId));
        return [...filtered, data];
      });
      setSaved((prev) => ({ ...prev, [matchId]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [matchId]: false })), 2000);
    }
    setSavingMatchId(null);
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/group/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function buildLeaderboard(): LeaderboardEntry[] {
    if (!group) return [];
    const finished = matches.filter((m) => m.is_finished && m.home_score != null);
    return group.participants
      .map((p) => {
        let totalPoints = 0, matchesScored = 0, exactScores = 0;
        const predictionsCount = predictions.filter((pr) => pr.participant_id === p.id).length;
        finished.forEach((m) => {
          const pred = predictions.find((pr) => pr.participant_id === p.id && pr.match_id === m.id);
          if (!pred) return;
          const pts = calculatePoints({ home: pred.home_score, away: pred.away_score }, { home: m.home_score!, away: m.away_score! });
          totalPoints += pts; matchesScored++;
          if (pts === 10) exactScores++;
        });
        return { username: p.username, participantId: p.id, totalPoints, matchesScored, exactScores, predictionsCount };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }

  function groupMatchesByStage(): Record<string, Match[]> {
    const groups: Record<string, Match[]> = {};
    matches.forEach((m) => {
      const key = m.group_label ? `${m.stage} – ${m.group_label}` : m.stage;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }

  function getMyPrediction(matchId: string) {
    return predictions.find((p) => p.participant_id === session?.participantId && p.match_id === matchId);
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Loading...</div>;
  if (!session) return <div className="flex items-center justify-center py-24 text-gray-400">Joining group...</div>;

  const leaderboard = buildLeaderboard();
  const groupedMatches = groupMatchesByStage();
  const myRank = leaderboard.findIndex((e) => e.participantId === session.participantId) + 1;
  const myEntry = leaderboard.find((e) => e.participantId === session.participantId);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{group?.name}</h1>
          <p className="text-gray-400 text-sm">
            Welcome, <span className="text-white font-medium">{session.username}</span>
            {myEntry && <> · <span className="text-yellow-400">{myEntry.totalPoints} pts</span> · #{myRank}</>}
          </p>
        </div>
        <button
          onClick={copyInviteLink}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-4 py-2 text-sm transition"
        >
          <span>{copied ? "✓ Copied!" : "Share Invite"}</span>
          <span className="font-mono text-green-400">{code}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-800 p-1 mb-6 w-fit">
        {(["predictions", "leaderboard", "participants"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if ((t === "leaderboard" || t === "participants") && group) fetchGroupAndPredictions(group.id); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition capitalize ${tab === t ? "bg-green-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {tab === "leaderboard" && (
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="font-semibold">Standings</h2>
            <span className="text-xs text-gray-500">Auto-updates every 30s</span>
          </div>
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No matches finished yet.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {leaderboard.map((entry, i) => (
                <div key={entry.participantId} className={`flex items-center gap-4 px-4 py-3 ${entry.participantId === session.participantId ? "bg-green-900/20" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-gray-400 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-700 text-gray-300"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {entry.username}
                      {entry.participantId === session.participantId && <span className="text-green-400 text-xs ml-2">(you)</span>}
                    </div>
                    <div className="text-xs text-gray-400">{entry.matchesScored} scored · {entry.exactScores} exact</div>
                  </div>
                  <div className="text-xl font-bold text-yellow-400">{entry.totalPoints}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Participants */}
      {tab === "participants" && (
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="font-semibold">Participants ({group?.participants.length ?? 0})</h2>
            <span className="text-xs text-gray-500">Auto-updates every 30s</span>
          </div>
          <div className="divide-y divide-gray-800">
            {group?.participants.map((p) => {
              const predsCount = predictions.filter((pr) => pr.participant_id === p.id).length;
              const pts = leaderboard.find((l) => l.participantId === p.id)?.totalPoints ?? 0;
              const isMe = p.id === session.participantId;
              return (
                <div key={p.id} className={`flex items-center gap-4 px-4 py-3 ${isMe ? "bg-green-900/20" : ""}`}>
                  <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold shrink-0 text-gray-300">
                    {p.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {p.username}
                      {isMe && <span className="text-green-400 text-xs ml-2">(you)</span>}
                    </div>
                    <div className="text-xs text-gray-400">{predsCount} prediction{predsCount !== 1 ? "s" : ""} submitted</div>
                  </div>
                  <div className="text-sm font-bold text-yellow-400">{pts} pts</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Predictions */}
      {tab === "predictions" && (
        <div className="space-y-6">
          {matches.length === 0 && <div className="text-center py-12 text-gray-500">No matches added yet.</div>}
          {Object.entries(groupedMatches).map(([stageName, stageMatches]) => (
            <div key={stageName}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{stageName}</h3>
              <div className="space-y-3">
                {stageMatches.map((m) => {
                  const started = isPast(new Date(m.match_date));
                  const myPred = getMyPrediction(m.id);
                  const local = localPreds[m.id] ?? { home: "", away: "" };
                  const hasSaved = saved[m.id];
                  const isSaving = savingMatchId === m.id;
                  let earnedPts: number | null = null;
                  let breakdown = "";
                  if (m.is_finished && m.home_score != null && myPred) {
                    earnedPts = calculatePoints({ home: myPred.home_score, away: myPred.away_score }, { home: m.home_score!, away: m.away_score! });
                    breakdown = pointsBreakdown({ home: myPred.home_score, away: myPred.away_score }, { home: m.home_score!, away: m.away_score! });
                  }
                  return (
                    <div key={m.id} className={`bg-gray-900 rounded-xl border ${m.is_finished ? "border-gray-700" : "border-gray-800"} p-4`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500">{format(new Date(m.match_date), "d MMM, HH:mm")}</span>
                        {!started && !m.is_finished && <span className="text-xs text-green-400">in {formatDistanceToNow(new Date(m.match_date))}</span>}
                        {started && !m.is_finished && <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full">Live / Finished</span>}
                        {m.is_finished && <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">Final</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center justify-between gap-3">
                          <span className="font-semibold text-sm flex-1 text-right">{m.home_team}</span>
                          {m.is_finished ? (
                            <div className="flex items-center gap-1 font-mono font-bold text-lg">
                              <span className="bg-gray-800 rounded px-2 py-1 min-w-[2rem] text-center">{m.home_score}</span>
                              <span className="text-gray-500">–</span>
                              <span className="bg-gray-800 rounded px-2 py-1 min-w-[2rem] text-center">{m.away_score}</span>
                            </div>
                          ) : (
                            <span className="text-gray-600 font-mono text-sm">vs</span>
                          )}
                          <span className="font-semibold text-sm flex-1">{m.away_team}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {started ? (
                            myPred ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Predicted:</span>
                                <span className="font-mono text-sm bg-gray-800 rounded px-2 py-1">{myPred.home_score}–{myPred.away_score}</span>
                              </div>
                            ) : <span className="text-xs text-gray-600 italic">No prediction</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input type="number" min={0} max={20} value={local.home}
                                onChange={(e) => setLocalPreds((prev) => ({ ...prev, [m.id]: { ...prev[m.id] ?? { away: "" }, home: e.target.value } }))}
                                className="w-10 text-center bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-green-500" placeholder="0" />
                              <span className="text-gray-500">–</span>
                              <input type="number" min={0} max={20} value={local.away}
                                onChange={(e) => setLocalPreds((prev) => ({ ...prev, [m.id]: { ...prev[m.id] ?? { home: "" }, away: e.target.value } }))}
                                className="w-10 text-center bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white text-sm focus:outline-none focus:border-green-500" placeholder="0" />
                              <button onClick={() => savePrediction(m.id)} disabled={isSaving || local.home === "" || local.away === ""}
                                className={`text-xs px-3 py-1.5 rounded font-medium transition min-w-[52px] ${hasSaved ? "bg-green-700 text-white" : "bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white"}`}>
                                {hasSaved ? "Saved!" : isSaving ? "..." : "Save"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {earnedPts !== null && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-sm font-bold px-2 py-0.5 rounded ${earnedPts === 10 ? "bg-yellow-500 text-black" : earnedPts >= 7 ? "bg-green-700 text-white" : earnedPts >= 5 ? "bg-blue-800 text-white" : earnedPts > 0 ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-500"}`}>
                            +{earnedPts} pts
                          </span>
                          <span className="text-xs text-gray-500">{breakdown}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
