import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  const { name, accountId } = await req.json();
  if (!name?.trim() || !accountId) {
    return NextResponse.json({ error: "Name and accountId required" }, { status: 400 });
  }

  const db = getServiceClient();
  let code = generateCode();

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

  const { data: gp, error: gpError } = await db
    .from("group_participants")
    .insert({ group_id: group.id, account_id: accountId })
    .select("*, accounts(username)")
    .single();

  if (gpError) return NextResponse.json({ error: gpError.message }, { status: 500 });

  return NextResponse.json({
    group,
    participant: { id: gp.id, group_id: gp.group_id, account_id: gp.account_id, username: (gp.accounts as { username: string }).username },
  });
}
