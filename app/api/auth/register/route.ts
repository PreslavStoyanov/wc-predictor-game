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
  if (password.length < 4)
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });

  const db = getServiceClient();

  const { data: existing } = await db.from("accounts").select("id").eq("username", username.trim()).single();
  if (existing) return NextResponse.json({ error: "Username already taken. Try signing in instead." }, { status: 409 });

  const hash = await hashPassword(password);
  const { data: account, error } = await db
    .from("accounts").insert({ username: username.trim(), password_hash: hash }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Link any existing participants with this username
  await db.from("participants").update({ account_id: account.id }).eq("username", username.trim()).is("account_id", null);

  return NextResponse.json({ account });
}
