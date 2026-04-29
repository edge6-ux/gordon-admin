import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("customers")
    .select("*")
    .order("last_job_at", { ascending: false });

  if (error) {
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}
