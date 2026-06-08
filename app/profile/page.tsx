"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculatePoints } from "@/lib/scoring";

interface Account { id: string; username: string; }
interface Group { id: string; name: string; invite_code: string; }
interface Participant { id: string; username: string; group_id: string; account_id: string; groups: Group; }
interface Match {
  id: string; home_team: string; away_team: string; match_date: string;
  home_score: number | null; away_score: number | null; is_finished: boolean;
}
interface Prediction { id: string; participant_id: string; match_id: string; home_score: number; away_score: number; }

interface GroupStats {
  participant: Participant;
  group: Group;
  totalPoints: number;
  predictedCount: number;
  totalFinished: number;
  exactScores: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [groupStats, setGroupStats] = useState<GroupStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (acc: Account) => {
    const res = await fetch(`/api/profile?accountId=${acc.id}`);
    const data = await res.json();
    if (!res.ok) { setLoading(false); return; }

    const finished = (data.matches as Match[]).filter(
      (m) => m.is_finished && m.home_score != null
    );

    const stats: GroupStats[] = (data.participants as Participant[]).map((p) => {
      let totalPoints = 0;
      let predictedCount = 0;
      let exactScores = 0;

      finished.forEach((m) => {
        const pred = (data.predictions as Prediction[]).find(
          (pr) => pr.participant_id === p.id && pr.match_id === m.id
        );
        if (!pred) return;
        predictedCount++;
        const pts = calculatePoints(
          { home: pred.home_score, away: pred.away_score },
          { home: m.home_score!, away: m.away_score! }
        );
        totalPoints += pts;
        if (pts === 10) exactScores++;
      });

      return {
        participant: p,
        group: p.groups,
        totalPoints,
        predictedCount,
        totalFinished: finished.length,
        exactScores,
      };
    });

    setGroupStats(stats);
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
    router.push("/login");
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{account?.username}</h1>
          <p className="text-gray-400 text-sm">{groupStats.length} group{groupStats.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-white transition border border-gray-700 rounded-lg px-4 py-2"
        >
          Sign Out
        </button>
      </div>

      {/* Groups grid */}
      {groupStats.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-5xl mb-4">🏟️</div>
          <p className="mb-5">You haven&apos;t joined any groups yet.</p>
          <Link href="/groups" className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition">
            Create or Join a Group
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {groupStats.map(({ group, totalPoints, predictedCount, totalFinished, exactScores }) => (
              <Link
                key={group.id}
                href={`/group/${group.invite_code}`}
                className="bg-gray-900 border border-gray-800 hover:border-green-700 rounded-2xl p-5 transition group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-bold text-lg leading-tight group-hover:text-green-400 transition">{group.name}</h2>
                  <span className="font-mono text-xs text-gray-500 bg-gray-800 rounded px-2 py-1 ml-2 shrink-0">{group.invite_code}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-yellow-400">{totalPoints} <span className="text-sm font-normal text-gray-400">pts</span></p>
                    <p className="text-xs text-gray-500">
                      {predictedCount}/{totalFinished} scored · {exactScores} exact
                    </p>
                  </div>
                  <span className="text-2xl opacity-30 group-hover:opacity-70 transition">→</span>
                </div>
              </Link>
            ))}

            {/* Add group card */}
            <Link
              href="/groups"
              className="border-2 border-dashed border-gray-800 hover:border-green-700 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-green-400 transition min-h-[140px]"
            >
              <span className="text-3xl">+</span>
              <span className="text-sm font-medium">Create or Join Group</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
