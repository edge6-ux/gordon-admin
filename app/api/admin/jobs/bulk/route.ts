import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { JobStatus } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    action: "delete" | "update";
    ids: string[];
    fields?: { status?: JobStatus };
  };

  const { action, ids, fields } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  if (action === "delete") {
    const { error } = await supabaseAdmin
      .from("jobs")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: ids.length });
  }

  if (action === "update") {
    if (!fields || Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {};
    if (fields.status) {
      updateFields.status = fields.status;
      if (fields.status === "complete") {
        updateFields.completed_at = new Date().toISOString();
      }
    }

    const { error } = await supabaseAdmin
      .from("jobs")
      .update(updateFields)
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updated: ids.length });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
