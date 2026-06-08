import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServiceClient } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const db = getServiceClient();
  const { data: group, error } = await db
    .from("groups")
    .select("*, participants(*)")
    .eq("invite_code", params.code)
    .single();

  if (error || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
  return NextResponse.json(group);
}
