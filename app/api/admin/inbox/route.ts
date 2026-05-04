import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const [assignedRes, submittedRes, reviewedRes, todayRes, profilesRes] =
    await Promise.all([
      // "assigned" status jobs — we split these client-side into needs-crew vs needs-date
      supabaseAdmin
        .from("jobs")
        .select("*")
        .eq("status", "assigned")
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),

      // Waiting to be reviewed
      supabaseAdmin
        .from("jobs")
        .select("*")
        .eq("status", "submitted")
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),

      // Reviewed but no quote sent yet
      supabaseAdmin
        .from("jobs")
        .select("*")
        .eq("status", "reviewed")
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),

      // Today's scheduled jobs (any non-terminal status)
      supabaseAdmin
        .from("jobs")
        .select("*")
        .eq("scheduled_date", todayStr)
        .not("status", "in", '("complete","cancelled")')
        .is("deleted_at", null)
        .order("scheduled_time", { ascending: true, nullsFirst: false }),

      // Crew name lookup
      supabaseAdmin
        .from("user_profiles")
        .select("id, name, role"),
    ]);

  const allAssigned = assignedRes.data ?? [];
  const profiles = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p as { id: string; name: string; role: string }])
  );

  return NextResponse.json({
    needsAssignment: allAssigned.filter((j) => !j.assigned_to),
    needsScheduling: allAssigned.filter((j) => j.assigned_to && !j.scheduled_date),
    pendingReview:   submittedRes.data ?? [],
    needsQuote:      reviewedRes.data  ?? [],
    today:           todayRes.data     ?? [],
    profiles,
  });
}
