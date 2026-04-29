import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const {
    jobId,
    customerName,
    customerPhone,
    customerEmail,
    propertyAddress,
    date,
    salesRep,
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

  const { data: quote, error } = await supabaseAdmin
    .from("quotes")
    .insert({
      job_id: jobId || null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || "",
      property_address: propertyAddress,
      date,
      sales_rep: salesRep || "",
      wet_dry: wetDry || "",
      lead_source: leadSource || "",
      hours_estimate: hoursEstimate || "",
      pending_hoa: pendingHoa ?? false,
      city_permit: cityPermit ?? false,
      locate_811: locate811 ?? false,
      main_lines: mainLines ?? false,
      power_drop: powerDrop ?? false,
      arborist_onsite: arboristOnsite ?? false,
      description_of_work: descriptionOfWork || "",
      equipment: equipment || [],
      tree_services_cost: treeServicesCost || 0,
      stump_removal_cost: stumpRemovalCost || 0,
      discount: discount || 0,
      total_cost: totalCost || 0,
      card_fee_applied: cardFeeApplied ?? false,
      customer_signature: customerSignature || null,
      signed_at: signedAt || null,
      status,
      site_notes: "",
      site_photo_urls: [],
      site_map_pins: siteMapPins || [],
    })
    .select()
    .single();

  if (error || !quote) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create quote" },
      { status: 500 }
    );
  }

  if (jobId) {
    await supabaseAdmin.from("jobs").update({ status: "quoted" }).eq("id", jobId);
  }

  return NextResponse.json({ id: quote.id });
}
