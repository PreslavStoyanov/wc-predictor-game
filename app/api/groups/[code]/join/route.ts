import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { username, accountId } = await req.json();
  if (!username?.trim()) return NextResponse.json({ error: "Username required" }, { status: 400 });

  const db = getServiceClient();
  const { data: group } = await db
    .from("groups")
    .select("id")
    .eq("invite_code", params.code)
    .single();

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Check if username already exists in this group
  const { data: existing } = await db
    .from("participants")
    .select("*")
    .eq("username", username.trim())
    .eq("group_id", group.id)
    .single();

  if (existing) {
    // If account not yet linked, link it now
    if (accountId && !existing.account_id) {
      await db.from("participants").update({ account_id: accountId }).eq("id", existing.id);
    }
    return NextResponse.json({ participant: { ...existing, account_id: accountId ?? existing.account_id }, rejoined: true });
  }

  const { data: participant, error } = await db
    .from("participants")
    .insert({ username: username.trim(), group_id: group.id, account_id: accountId ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ participant, rejoined: false });
}
