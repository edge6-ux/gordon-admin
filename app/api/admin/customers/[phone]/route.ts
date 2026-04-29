import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone: encodedPhone } = await params;
  const phone = decodeURIComponent(encodedPhone);

  // Try most recent job first
  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select("customer_name, customer_phone, customer_email, property_address")
    .eq("customer_phone", phone)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (job) {
    return NextResponse.json({
      name: job.customer_name,
      phone: job.customer_phone,
      email: job.customer_email,
      address: job.property_address,
    });
  }

  // Fall back to customer_profiles
  const { data: profile } = await supabaseAdmin
    .from("customer_profiles")
    .select("name, phone, email, address")
    .eq("phone", phone)
    .maybeSingle();

  if (profile) {
    return NextResponse.json(profile);
  }

  return NextResponse.json({ error: "Customer not found" }, { status: 404 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone: encodedPhone } = await params;
  const phone = decodeURIComponent(encodedPhone);
  const body = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {};
  if ("name"        in body) fields.name         = body.name;
  if ("email"       in body) fields.email        = body.email ?? "";
  if ("address"     in body) fields.address      = body.address ?? "";
  if ("leadSource"  in body) fields.lead_source  = body.leadSource ?? "";
  if ("referredBy"  in body) fields.referred_by  = body.referredBy ?? "";
  if ("otherSource" in body) fields.other_source = body.otherSource ?? "";
  if ("salesRep"    in body) fields.sales_rep    = body.salesRep ?? "";
  if ("notes"       in body) fields.notes        = body.notes ?? "";

  const { data, error } = await supabaseAdmin
    .from("customer_profiles")
    .upsert({ phone, ...fields }, { onConflict: "phone" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone: encodedPhone } = await params;
  const phone = decodeURIComponent(encodedPhone);

  const { error } = await supabaseAdmin
    .from("customer_profiles")
    .delete()
    .eq("phone", phone);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
