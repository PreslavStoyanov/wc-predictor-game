import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const { accountId } = await req.json();
  if (!accountId) return NextResponse.json({ error: "accountId required — please sign in first" }, { status: 400 });

  const db = getServiceClient();

  const { data: group } = await db
    .from("groups")
    .select("id")
    .eq("invite_code", params.code)
    .single();

  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Get username
  const { data: account } = await db
    .from("accounts")
    .select("username")
    .eq("id", accountId)
    .single();

  const username = account?.username ?? "Unknown";

  // Check if already joined
  const { data: existing } = await db
    .from("group_participants")
    .select("id, group_id, account_id")
    .eq("group_id", group.id)
    .eq("account_id", accountId)
    .single();

  if (existing) {
    return NextResponse.json({ participant: { ...existing, username }, rejoined: true });
  }

  const { data: gp, error } = await db
    .from("group_participants")
    .insert({ group_id: group.id, account_id: accountId })
    .select("id, group_id, account_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ participant: { ...gp, username }, rejoined: false });
}
