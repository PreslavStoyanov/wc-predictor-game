import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

// GET /api/profile?accountId=xxx
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const db = getServiceClient();

  const { data: gps, error: gpErr } = await db
    .from("group_participants")
    .select("id, group_id, account_id, joined_at, groups(*)")
    .eq("account_id", accountId);

  if (gpErr) return NextResponse.json({ error: gpErr.message }, { status: 500 });
  if (!gps?.length) return NextResponse.json({ participants: [], predictions: [], matches: [] });

  const gpIds = gps.map((g) => g.id);

  const [predsRes, matchesRes] = await Promise.all([
    db.from("predictions").select("*").in("participant_id", gpIds),
    db.from("matches").select("*").order("match_date", { ascending: true }),
  ]);

  // Normalize: add username from account
  const { data: account } = await db.from("accounts").select("username").eq("id", accountId).single();

  const participants = gps.map((gp) => ({
    id: gp.id,
    group_id: gp.group_id,
    account_id: gp.account_id,
    username: account?.username ?? "Unknown",
    groups: gp.groups,
  }));

  return NextResponse.json({ participants, predictions: predsRes.data ?? [], matches: matchesRes.data ?? [] });
}
