import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const {
    customerName,
    customerPhone,
    customerEmail,
    propertyAddress,
    leadSource,
    referredBy,
    otherSource,
    salesRep,
  } = await req.json();

  const { data: customer, error } = await supabaseAdmin
    .from("customer_profiles")
    .insert({
      name: customerName,
      phone: customerPhone,
      email: customerEmail || "",
      address: propertyAddress,
      lead_source: leadSource || "",
      referred_by: referredBy || "",
      other_source: otherSource || "",
      sales_rep: salesRep || "",
    })
    .select()
    .single();

  if (error || !customer) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create customer" },
      { status: 500 }
    );
  }

  return NextResponse.json({ customerId: customer.id });
}
