import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NOT SET";
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return NextResponse.json({ url, hasServiceKey, hasAnonKey });
}
