import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username?.trim() || !password?.trim())
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });

  const db = getServiceClient();
  const hash = await hashPassword(password);

  const { data: account } = await db.from("accounts").select("*").eq("username", username.trim()).single();
  if (!account) return NextResponse.json({ error: "Account not found. Did you mean to register?" }, { status: 404 });
  if (account.password_hash !== hash) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

  // Auto-link unlinked participants
  await db.from("participants").update({ account_id: account.id }).eq("username", username.trim()).is("account_id", null);

  return NextResponse.json({ account });
}
