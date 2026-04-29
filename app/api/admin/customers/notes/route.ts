import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest) {
  const { customerPhone, notes } = await req.json();

  // Get most recent job for this customer
  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select("id")
    .eq("customer_phone", customerPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabaseAdmin.from("messages").insert({
    job_id: job?.id || null,
    direction: "internal",
    channel: "email",
    subject: "Customer Note",
    body: notes,
    sent_by: "office",
    status: "sent",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
