import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select(
      `
      *,
      submission:submissions!submission_id(*)
    `
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}
