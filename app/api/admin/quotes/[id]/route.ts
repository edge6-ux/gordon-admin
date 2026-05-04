import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateReferenceCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GP-${y}${m}${d}-${rand}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Fetch current quote to detect status change for job sync
  const { data: current } = await supabaseAdmin
    .from("quotes")
    .select("status, job_id")
    .eq("id", id)
    .single();

  // Build update object only from fields present in the body (supports partial updates)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = { updated_at: new Date().toISOString() };

  if ("customerName"      in body) fields.customer_name        = body.customerName;
  if ("customerPhone"     in body) fields.customer_phone       = body.customerPhone;
  if ("customerEmail"     in body) fields.customer_email       = body.customerEmail ?? "";
  if ("propertyAddress"   in body) fields.property_address     = body.propertyAddress;
  if ("date"              in body) fields.date                 = body.date;
  if ("salesRep"          in body) fields.sales_rep            = body.salesRep ?? "";
  if ("wetDry"            in body) fields.wet_dry              = body.wetDry ?? "";
  if ("leadSource"        in body) fields.lead_source          = body.leadSource ?? "";
  if ("hoursEstimate"     in body) fields.hours_estimate       = body.hoursEstimate ?? "";
  if ("pendingHoa"        in body) fields.pending_hoa          = body.pendingHoa ?? false;
  if ("cityPermit"        in body) fields.city_permit          = body.cityPermit ?? false;
  if ("locate811"         in body) fields.locate_811           = body.locate811 ?? false;
  if ("mainLines"         in body) fields.main_lines           = body.mainLines ?? false;
  if ("powerDrop"         in body) fields.power_drop           = body.powerDrop ?? false;
  if ("arboristOnsite"    in body) fields.arborist_onsite      = body.arboristOnsite ?? false;
  if ("descriptionOfWork" in body) fields.description_of_work  = body.descriptionOfWork ?? "";
  if ("equipment"         in body) fields.equipment            = body.equipment ?? [];
  if ("treeServicesCost"  in body) fields.tree_services_cost   = body.treeServicesCost ?? 0;
  if ("stumpRemovalCost"  in body) fields.stump_removal_cost   = body.stumpRemovalCost ?? 0;
  if ("discount"          in body) fields.discount             = body.discount ?? 0;
  if ("totalCost"         in body) fields.total_cost           = body.totalCost ?? 0;
  if ("cardFeeApplied"    in body) fields.card_fee_applied     = body.cardFeeApplied ?? false;
  if ("customerSignature" in body) fields.customer_signature   = body.customerSignature ?? null;
  if ("signedAt"          in body) fields.signed_at            = body.signedAt ?? null;
  if ("status"            in body) fields.status               = body.status;
  if ("siteMapPins"       in body) fields.site_map_pins        = body.siteMapPins ?? [];

  const { data: quote, error } = await supabaseAdmin
    .from("quotes")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error || !quote) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to update quote" },
      { status: 500 }
    );
  }

  // Sync job status when quote status changes
  const newStatus = body.status as string | undefined;
  const jobId = current?.job_id;

  if (newStatus && current && newStatus !== current.status) {
    if (jobId) {
      // Quote already linked to a job — just sync status
      if (newStatus === "accepted") {
        await supabaseAdmin.from("jobs").update({ status: "assigned" }).eq("id", jobId);
      } else if (newStatus === "declined") {
        await supabaseAdmin.from("jobs").update({ status: "reviewed" }).eq("id", jobId);
      }
    } else if (newStatus === "accepted") {
      // No linked job — create one automatically from the quote data
      const referenceCode = generateReferenceCode();
      const phone = (quote.customer_phone as string ?? "").replace(/\D/g, "");

      const { data: submission } = await supabaseAdmin
        .from("submissions")
        .insert({
          customer_name:    quote.customer_name,
          customer_phone:   phone,
          customer_email:   quote.customer_email ?? "",
          property_address: quote.property_address ?? "",
          service_type:     "tree_service",
          additional_notes: quote.description_of_work ?? "",
          source:           "quote",
          status:           "new",
          reference_code:   referenceCode,
        })
        .select()
        .single();

      if (submission) {
        const { data: newJob } = await supabaseAdmin
          .from("jobs")
          .insert({
            submission_id:    submission.id,
            customer_name:    quote.customer_name,
            customer_phone:   phone,
            customer_email:   quote.customer_email ?? "",
            property_address: quote.property_address ?? "",
            status:           "assigned",
            reference_code:   referenceCode,
          })
          .select()
          .single();

        if (newJob) {
          // Link job back to quote
          await supabaseAdmin
            .from("quotes")
            .update({ job_id: newJob.id })
            .eq("id", id);

          // Notify admin
          const adminEmail = process.env.ADMIN_EMAIL;
          if (adminEmail) {
            await resend.emails.send({
              from: "Gordon Pro Tree Service <jobs@gordonprotreeservice.com>",
              to:   adminEmail,
              subject: `Quote Accepted — Job ${referenceCode} Ready to Assign`,
              text: [
                `A quote has been accepted and a new job has been created.`,
                ``,
                `Customer: ${quote.customer_name}`,
                `Phone:    ${quote.customer_phone}`,
                `Address:  ${quote.property_address ?? "N/A"}`,
                `Job Ref:  ${referenceCode}`,
                `Total:    $${(quote.total_cost ?? 0).toFixed(2)}`,
                ``,
                `Please log in to assign this job to a crew.`,
              ].join("\n"),
            }).catch((err: unknown) => console.error("Admin notify email failed:", err));
          }
        }
      }
    }
  }

  return NextResponse.json(quote);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("quotes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
