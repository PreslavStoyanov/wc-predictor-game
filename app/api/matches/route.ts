import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const db = getServiceClient();
  const { data, error } = await db
    .from("matches")
    .select("*")
    .order("match_date", { ascending: true });

  const noCache = { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, noCache);
}
