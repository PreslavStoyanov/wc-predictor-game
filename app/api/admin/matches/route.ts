import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

function checkAdmin(req: NextRequest): boolean {
  const password = req.headers.get("x-admin-password");
  return password === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServiceClient();
  const { data, error } = await db
    .from("matches")
    .select("*")
    .order("match_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { homeTeam, awayTeam, matchDate, stage, groupLabel } = body;

  if (!homeTeam || !awayTeam || !matchDate) {
    return NextResponse.json({ error: "homeTeam, awayTeam, matchDate required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from("matches")
    .insert({ home_team: homeTeam, away_team: awayTeam, match_date: matchDate, stage, group_label: groupLabel })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, homeTeam, awayTeam, matchDate, stage, groupLabel } = body;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getServiceClient();
  const updates: Record<string, unknown> = {};
  if (homeTeam !== undefined) updates.home_team = homeTeam;
  if (awayTeam !== undefined) updates.away_team = awayTeam;
  if (matchDate !== undefined) updates.match_date = matchDate;
  if (stage !== undefined) updates.stage = stage;
  if (groupLabel !== undefined) updates.group_label = groupLabel;

  const { data, error } = await db
    .from("matches")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getServiceClient();
  const { error } = await db.from("matches").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
