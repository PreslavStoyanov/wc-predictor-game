import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NOT SET";
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const db = getServiceClient();
  const { data, error, count } = await db
    .from("matches")
    .select("*", { count: "exact" })
    .limit(1);

  return NextResponse.json({ url, hasServiceKey, hasAnonKey, matchCount: count, firstRow: data?.[0] ?? null, queryError: error?.message ?? null });
}
