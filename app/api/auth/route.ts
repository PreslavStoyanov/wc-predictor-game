import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// POST /api/auth  { username, password }
// Auto-detects: creates account if new, verifies if existing
export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const db = getServiceClient();
  const hash = await hashPassword(password);

  const { data: existing } = await db
    .from("accounts")
    .select("*")
    .eq("username", username.trim())
    .single();

  if (!existing) {
    // Register
    const { data: account, error } = await db
      .from("accounts")
      .insert({ username: username.trim(), password_hash: hash })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ account, isNew: true });
  }

  // Login — verify password
  if (existing.password_hash !== hash) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  return NextResponse.json({ account: existing, isNew: false });
}
