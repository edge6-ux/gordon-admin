import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
  // Resolve the current user so we can auto-assign the sales rep
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabaseAdmin.from("user_profiles").select("name").eq("id", user.id).single()
    : { data: null };
  const salesRep = profile?.name ?? "";

  const {
    jobId,
    customerName,
    customerPhone,
    customerEmail,
    propertyAddress,
    date,
    wetDry,
    leadSource,
    hoursEstimate,
    pendingHoa,
    cityPermit,
    locate811,
    mainLines,
    powerDrop,
    arboristOnsite,
    descriptionOfWork,
    equipment,
    treeServicesCost,
    stumpRemovalCost,
    discount,
    totalCost,
    cardFeeApplied,
    customerSignature,
    signedAt,
    status,
    siteMapPins,
  } = await req.json();

  // Resolve the job this quote belongs to.
  // If a jobId was passed, use it. Otherwise create a job + submission now so the
  // quote is always linked to a trackable job from the moment it's saved.
  let resolvedJobId: string | null = jobId || null;

  if (!resolvedJobId) {
    const referenceCode = generateReferenceCode();
    const phone = (customerPhone as string ?? "").replace(/\D/g, "");

    const { data: submission } = await supabaseAdmin
      .from("submissions")
      .insert({
        customer_name:    customerName,
        customer_phone:   phone,
        customer_email:   customerEmail  ?? "",
        property_address: propertyAddress ?? "",
        service_type:     "tree_service",
        additional_notes: descriptionOfWork ?? "",
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
          customer_name:    customerName,
          customer_phone:   phone,
          customer_email:   customerEmail  ?? "",
          property_address: propertyAddress ?? "",
          status:           "quoted",
          reference_code:   referenceCode,
        })
        .select()
        .single();

      resolvedJobId = newJob?.id ?? null;
    }
  }

  const { data: quote, error } = await supabaseAdmin
    .from("quotes")
    .insert({
      job_id:             resolvedJobId,
      customer_name:      customerName,
      customer_phone:     customerPhone,
      customer_email:     customerEmail     ?? "",
      property_address:   propertyAddress,
      date,
      sales_rep:          salesRep          ?? "",
      wet_dry:            wetDry            ?? "",
      lead_source:        leadSource        ?? "",
      hours_estimate:     hoursEstimate     ?? "",
      pending_hoa:        pendingHoa        ?? false,
      city_permit:        cityPermit        ?? false,
      locate_811:         locate811         ?? false,
      main_lines:         mainLines         ?? false,
      power_drop:         powerDrop         ?? false,
      arborist_onsite:    arboristOnsite    ?? false,
      description_of_work: descriptionOfWork ?? "",
      equipment:          equipment         ?? [],
      tree_services_cost: treeServicesCost  || 0,
      stump_removal_cost: stumpRemovalCost  || 0,
      discount:           discount          || 0,
      total_cost:         totalCost         || 0,
      card_fee_applied:   cardFeeApplied    ?? false,
      customer_signature: customerSignature || null,
      signed_at:          signedAt          || null,
      status,
      site_notes:         "",
      site_photo_urls:    [],
      site_map_pins:      siteMapPins       || [],
    })
    .select()
    .single();

  if (error || !quote) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create quote" },
      { status: 500 }
    );
  }

  // If the job already existed and wasn't newly created, sync its status to "quoted"
  if (jobId) {
    await supabaseAdmin.from("jobs").update({ status: "quoted" }).eq("id", jobId);
  }

  return NextResponse.json({ id: quote.id, job_id: resolvedJobId });
}
