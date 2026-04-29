import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
    // New leads today
    supabaseAdmin
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString()),

    // Active jobs
    supabaseAdmin
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .in("status", ["assigned", "in_progress"])
      .is("deleted_at", null),

    // Pending quotes
    supabaseAdmin
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .in("status", ["draft", "presented"]),

    // Completed this month
    supabaseAdmin
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "complete")
      .gte("completed_at", firstOfMonth.toISOString())
      .is("deleted_at", null),

    // Upcoming scheduled jobs — soonest first
    supabaseAdmin
      .from("jobs")
      .select("*")
      .in("status", ["assigned", "in_progress"])
      .gte("scheduled_date", todayStr)
      .is("deleted_at", null)
      .order("scheduled_date", { ascending: true })
      .limit(5),

    // Jobs needing attention — oldest first (longest wait)
    supabaseAdmin
      .from("jobs")
      .select("*")
      .in("status", ["submitted", "reviewed"])
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(5),

    // Accepted quotes this month for revenue
    supabaseAdmin
      .from("quotes")
      .select("total_cost")
      .eq("status", "accepted")
      .gte("created_at", firstOfMonth.toISOString()),
  ]);

  const revenueThisMonth = ((r7.data ?? []) as Array<{ total_cost: number }>).reduce(
    (sum, q) => sum + (q.total_cost ?? 0),
    0
  );

  return NextResponse.json({
    metrics: {
      newLeadsToday:      r1.count ?? 0,
      activeJobs:         r2.count ?? 0,
      pendingQuotes:      r3.count ?? 0,
      completedThisMonth: r4.count ?? 0,
      revenueThisMonth,
    },
    upcomingJobs:  r5.data ?? [],
    attentionJobs: r6.data ?? [],
  });
}
