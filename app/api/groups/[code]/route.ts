import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const db = getServiceClient();

  const { data: group, error } = await db
    .from("groups")
    .select("*, group_participants(id, group_id, account_id, accounts(username))")
    .eq("invite_code", params.code)
    .single();

  if (error || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  // Flatten username for frontend
  const participants = (group.group_participants as Array<{ id: string; group_id: string; account_id: string; accounts: { username: string } }>)
    .map((gp) => ({ id: gp.id, group_id: gp.group_id, account_id: gp.account_id, username: gp.accounts?.username ?? "Unknown" }));

  return NextResponse.json({ ...group, participants }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
