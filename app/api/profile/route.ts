import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

const noCache = { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } };

// GET /api/profile?accountId=xxx
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const db = getServiceClient();

  // Step 1: get group_participants for this account
  const { data: gps, error: gpErr } = await db
    .from("group_participants")
    .select("id, group_id, account_id, joined_at")
    .eq("account_id", accountId);

  if (gpErr) return NextResponse.json({ error: gpErr.message }, { status: 500 });
  if (!gps?.length) return NextResponse.json({ participants: [], predictions: [], matches: [] }, noCache);

  // Step 2: fetch groups separately
  const groupIds = gps.map((g) => g.group_id);
  const { data: groups, error: grpErr } = await db
    .from("groups")
    .select("id, name, invite_code")
    .in("id", groupIds);

  if (grpErr) return NextResponse.json({ error: grpErr.message }, { status: 500 });

  // Step 3: get account username
  const { data: account } = await db
    .from("accounts")
    .select("username")
    .eq("id", accountId)
    .single();

  // Step 4: fetch predictions + matches in parallel
  const gpIds = gps.map((g) => g.id);
  const [predsRes, matchesRes] = await Promise.all([
    db.from("predictions").select("*").in("participant_id", gpIds),
    db.from("matches").select("*").order("match_date", { ascending: true }),
  ]);

  // Assemble participants with group data
  const groupMap = Object.fromEntries((groups ?? []).map((g) => [g.id, g]));
  const participants = gps.map((gp) => ({
    id: gp.id,
    group_id: gp.group_id,
    account_id: gp.account_id,
    username: account?.username ?? "Unknown",
    groups: groupMap[gp.group_id] ?? null,
  }));

  return NextResponse.json(
    { participants, predictions: predsRes.data ?? [], matches: matchesRes.data ?? [] },
    noCache
  );
}
