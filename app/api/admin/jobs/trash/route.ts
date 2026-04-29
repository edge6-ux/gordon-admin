import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET() {
  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  // Purge expired items (best-effort, non-blocking to response)
  const { data: expired } = await supabaseAdmin
    .from("jobs")
    .select("id, submission_id")
    .not("deleted_at", "is", null)
    .lt("deleted_at", thirtyDaysAgo);

  if (expired && expired.length > 0) {
    const expiredIds = expired.map((j: { id: string }) => j.id);
    const subIds = expired
      .map((j: { submission_id: string | null }) => j.submission_id)
      .filter(Boolean) as string[];

    await supabaseAdmin.from("jobs").delete().in("id", expiredIds);
    if (subIds.length > 0) {
      await supabaseAdmin.from("submissions").delete().in("id", subIds);
    }
  }

  // Return remaining trash
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("*, submission:submissions!submission_id(*)")
    .not("deleted_at", "is", null)
    .gte("deleted_at", thirtyDaysAgo)
    .order("deleted_at", { ascending: false });

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    action: "restore" | "delete";
    ids: string[];
  };

  const { action, ids } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  if (action === "restore") {
    const { error } = await supabaseAdmin
      .from("jobs")
      .update({ deleted_at: null })
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ restored: ids.length });
  }

  if (action === "delete") {
    const { data: jobs } = await supabaseAdmin
      .from("jobs")
      .select("id, submission_id")
      .in("id", ids);

    const { error } = await supabaseAdmin.from("jobs").delete().in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const subIds = (jobs ?? [])
      .map((j: { submission_id: string | null }) => j.submission_id)
      .filter(Boolean) as string[];

    if (subIds.length > 0) {
      await supabaseAdmin.from("submissions").delete().in("id", subIds);
    }

    return NextResponse.json({ deleted: ids.length });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
