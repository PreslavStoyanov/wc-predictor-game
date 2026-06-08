import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  const { name, username } = await req.json();
  if (!name?.trim() || !username?.trim()) {
    return NextResponse.json({ error: "Name and username required" }, { status: 400 });
  }

  const db = getServiceClient();
  let code = generateCode();

  // Ensure unique code
  let exists = true;
  while (exists) {
    const { data } = await db.from("groups").select("id").eq("invite_code", code).single();
    if (!data) exists = false;
    else code = generateCode();
  }

  const { data: group, error: groupError } = await db
    .from("groups")
    .insert({ name: name.trim(), invite_code: code })
    .select()
    .single();

  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 });

  const { data: participant, error: partError } = await db
    .from("participants")
    .insert({ username: username.trim(), group_id: group.id })
    .select()
    .single();

  if (partError) return NextResponse.json({ error: partError.message }, { status: 500 });

  return NextResponse.json({ group, participant });
}
