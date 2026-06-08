import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

// GET /api/profile?accountId=xxx
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  const db = getServiceClient();

  // Get all participants linked to this account
  const { data: participants, error: pErr } = await db
    .from("participants")
    .select("*, groups(*)")
    .eq("account_id", accountId);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!participants?.length) return NextResponse.json({ participants: [], predictions: [], matches: [] });

  const participantIds = participants.map((p) => p.id);

  // Get all predictions for these participants
  const { data: predictions } = await db
    .from("predictions")
    .select("*")
    .in("participant_id", participantIds);

  // Get all matches
  const { data: matches } = await db
    .from("matches")
    .select("*")
    .order("match_date", { ascending: true });

  return NextResponse.json({ participants, predictions: predictions ?? [], matches: matches ?? [] });
}
