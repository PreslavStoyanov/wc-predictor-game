import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { username } = await req.json();
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

  if (existing) return NextResponse.json({ participant: existing, rejoined: true });

  const { data: participant, error } = await db
    .from("participants")
    .insert({ username: username.trim(), group_id: group.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ participant, rejoined: false });
}
