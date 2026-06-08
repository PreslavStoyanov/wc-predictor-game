import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
export const dynamic = "force-dynamic";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// POST /api/auth/reset — admin-controlled password reset
// { username, adminPassword, newPassword }
export async function POST(req: NextRequest) {
  const { username, adminPassword, newPassword } = await req.json();

  if (!username?.trim() || !adminPassword || !newPassword?.trim()) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
  }
  if (newPassword.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const db = getServiceClient();
  const hash = await hashPassword(newPassword);

  const { data, error } = await db
    .from("accounts")
    .update({ password_hash: hash })
    .eq("username", username.trim())
    .select("id, username")
    .single();

  if (error || !data) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({ success: true, username: data.username });
}
