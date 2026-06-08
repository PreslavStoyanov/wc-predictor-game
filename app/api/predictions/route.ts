import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

// GET /api/predictions?groupId=xxx
export async function GET(req: NextRequest) {
  const groupId = req.nextUrl.searchParams.get("groupId");
  if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });

  const db = getServiceClient();
  // Get participant IDs for this group first
  const { data: participants } = await db
    .from("participants")
    .select("id")
    .eq("group_id", groupId);

  if (!participants?.length) return NextResponse.json([]);

  const participantIds = participants.map((p) => p.id);
  const { data, error } = await db
    .from("predictions")
    .select("*")
    .in("participant_id", participantIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/predictions — upsert a prediction
export async function POST(req: NextRequest) {
  const { participantId, matchId, homeScore, awayScore } = await req.json();

  if (!participantId || !matchId || homeScore == null || awayScore == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getServiceClient();

  // Check match hasn't started yet
  const { data: match } = await db
    .from("matches")
    .select("match_date, is_finished")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (new Date(match.match_date) <= new Date()) {
    return NextResponse.json({ error: "Match has already started" }, { status: 403 });
  }

  const { data, error } = await db
    .from("predictions")
    .upsert(
      {
        participant_id: participantId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "participant_id,match_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
