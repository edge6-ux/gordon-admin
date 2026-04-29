import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

function generateReferenceCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GP-${y}${m}${d}-${rand}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    customerName,
    customerPhone,
    customerEmail    = "",
    propertyAddress  = "",
    serviceType      = "",
    additionalNotes  = "",
    internalNotes    = "",
    assignedTo       = "",
    scheduledDate    = null,
    scheduledTime    = null,
  } = body as Record<string, string | null>;

  if (!customerName || !customerPhone) {
    return NextResponse.json(
      { error: "Customer name and phone are required" },
      { status: 400 }
    );
  }

  const referenceCode = generateReferenceCode();
  const phone = (customerPhone as string).replace(/\D/g, "");

  const { data: submission, error: subError } = await supabaseAdmin
    .from("submissions")
    .insert({
      customer_name:    customerName,
      customer_phone:   phone,
      customer_email:   customerEmail,
      property_address: propertyAddress,
      service_type:     serviceType,
      additional_notes: additionalNotes,
      source:           "manual",
      status:           "new",
      reference_code:   referenceCode,
    })
    .select()
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: subError?.message ?? "Failed to create submission" },
      { status: 500 }
    );
  }

  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .insert({
      submission_id:    submission.id,
      customer_name:    customerName,
      customer_phone:   phone,
      customer_email:   customerEmail,
      property_address: propertyAddress,
      status:           "submitted",
      reference_code:   referenceCode,
      assigned_to:      assignedTo || null,
      scheduled_date:   scheduledDate || null,
      scheduled_time:   scheduledTime || null,
      internal_notes:   internalNotes || null,
    })
    .select()
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message ?? "Failed to create job" },
      { status: 500 }
    );
  }

  return NextResponse.json(job, { status: 201 });
}
