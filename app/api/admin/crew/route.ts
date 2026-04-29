import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*, submission:submissions!submission_id(*)")
    .in("status", ["assigned", "in_progress"])
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}
