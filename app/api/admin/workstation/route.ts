import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  // Resolve current user from session
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "viewer";

  // ─── Admin / Master Admin ────────────────────────────────────────────────────
  if (role === "master_admin" || role === "admin") {
    const now = new Date();
    const todayStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const [assignedRes, submittedRes, reviewedRes, todayRes, profilesRes] =
      await Promise.all([
        supabaseAdmin.from("jobs").select("*").eq("status", "assigned").is("deleted_at", null).order("created_at", { ascending: true }),
        supabaseAdmin.from("jobs").select("*").eq("status", "submitted").is("deleted_at", null).order("created_at", { ascending: true }),
        supabaseAdmin.from("jobs").select("*").eq("status", "reviewed").is("deleted_at", null).order("created_at", { ascending: true }),
        supabaseAdmin.from("jobs").select("*").eq("scheduled_date", todayStr).not("status", "in", '("complete","cancelled")').is("deleted_at", null).order("scheduled_time", { ascending: true, nullsFirst: false }),
        supabaseAdmin.from("user_profiles").select("id, name, role"),
      ]);

    const allAssigned = assignedRes.data ?? [];
    const profiles = Object.fromEntries((profilesRes.data ?? []).map((p) => [p.id, p]));

    return NextResponse.json({
      role,
      sections: {
        // Jobs where quote was accepted but crew or schedule not yet confirmed
        readyToAssign: allAssigned.filter((j) => !j.assigned_to || !j.scheduled_date),
        pendingReview: submittedRes.data ?? [],
        needsQuote:    reviewedRes.data  ?? [],
        today:         todayRes.data     ?? [],
      },
      profiles,
    });
  }

  // ─── Sales ──────────────────────────────────────────────────────────────────
  if (role === "sales") {
    const [queueRes, quotesRes] = await Promise.all([
      // Jobs pushed to sales queue (reviewed status, no quote yet)
      supabaseAdmin
        .from("jobs")
        .select("*")
        .eq("status", "reviewed")
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),

      // Quotes this sales rep has created (all statuses)
      supabaseAdmin
        .from("quotes")
        .select("*")
        .in("status", ["draft", "presented"])
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      role,
      queue:       queueRes.data  ?? [],
      activeQuotes: quotesRes.data ?? [],
    });
  }

  // ─── Crew Leader ─────────────────────────────────────────────────────────────
  if (role === "crew_leader") {
    const [jobsRes, crewRes] = await Promise.all([
      // Jobs assigned to this crew leader
      supabaseAdmin
        .from("jobs")
        .select("*")
        .eq("assigned_to", user.id)
        .in("status", ["assigned", "in_progress"])
        .is("deleted_at", null)
        .order("scheduled_date", { ascending: true, nullsFirst: false }),

      // Available crew members
      supabaseAdmin
        .from("user_profiles")
        .select("id, name, role")
        .eq("role", "crew_member"),
    ]);

    return NextResponse.json({
      role,
      userId:      user.id,
      jobs:        jobsRes.data  ?? [],
      crewMembers: crewRes.data  ?? [],
    });
  }

  // ─── Crew Member ─────────────────────────────────────────────────────────────
  if (role === "crew_member") {
    const [jobsRes, profilesRes] = await Promise.all([
      supabaseAdmin
        .from("jobs")
        .select("*")
        .contains("report_data", { crew_member_ids: [user.id] })
        .in("status", ["assigned", "in_progress"])
        .is("deleted_at", null)
        .order("scheduled_date", { ascending: true, nullsFirst: false }),
      supabaseAdmin
        .from("user_profiles")
        .select("id, name, role"),
    ]);

    const profiles = Object.fromEntries(
      (profilesRes.data ?? []).map((p) => [p.id, p])
    );

    return NextResponse.json({
      role,
      userId:   user.id,
      jobs:     jobsRes.data ?? [],
      profiles,
    });
  }

  return NextResponse.json({ role, sections: {}, profiles: {} });
}
