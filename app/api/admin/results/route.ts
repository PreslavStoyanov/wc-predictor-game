import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

function checkAdmin(req: NextRequest): boolean {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// PUT — update match result
export async function PUT(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, homeScore, awayScore, isFinished } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getServiceClient();
  const updates: Record<string, unknown> = {};
  if (homeScore !== undefined) updates.home_score = homeScore;
  if (awayScore !== undefined) updates.away_score = awayScore;
  if (isFinished !== undefined) updates.is_finished = isFinished;

  const { data, error } = await db
    .from("matches")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
