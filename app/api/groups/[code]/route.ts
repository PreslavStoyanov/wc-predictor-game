import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const db = getServiceClient();

  // Step 1: get the group
  const { data: group, error: grpErr } = await db
    .from("groups")
    .select("id, name, invite_code, created_at")
    .eq("invite_code", params.code)
    .single();

  if (grpErr || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Step 2: get group_participants separately
  const { data: gps, error: gpErr } = await db
    .from("group_participants")
    .select("id, group_id, account_id")
    .eq("group_id", group.id);

  if (gpErr) return NextResponse.json({ error: gpErr.message }, { status: 500 });

  // Step 3: fetch usernames from accounts
  const accountIds = (gps ?? []).map((g) => g.account_id);
  const { data: accounts } = accountIds.length
    ? await db.from("accounts").select("id, username").in("id", accountIds)
    : { data: [] };

  const accountMap = Object.fromEntries((accounts ?? []).map((a) => [a.id, a.username]));

  const participants = (gps ?? []).map((gp) => ({
    id: gp.id,
    group_id: gp.group_id,
    account_id: gp.account_id,
    username: accountMap[gp.account_id] ?? "Unknown",
  }));

  return NextResponse.json(
    { ...group, participants },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
