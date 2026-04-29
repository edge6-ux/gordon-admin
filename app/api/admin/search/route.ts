import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const empty = { jobs: [], customers: [], quotes: [] };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) return NextResponse.json(empty);

  const [jobsRes, customersRes, quotesRes] = await Promise.all([
    supabaseAdmin
      .from("jobs")
      .select(
        "id, customer_name, customer_phone, property_address, status, reference_code, submission:submissions(service_type)"
      )
      .or(
        `customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,property_address.ilike.%${query}%,reference_code.ilike.%${query}%`
      )
      .limit(5),

    supabaseAdmin
      .from("customers")
      .select("*")
      .or(
        `name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%,address.ilike.%${query}%`
      )
      .limit(5),

    supabaseAdmin
      .from("quotes")
      .select("id, customer_name, customer_phone, total_cost, status, created_at")
      .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
      .limit(5),
  ]);

  return NextResponse.json({
    jobs:      jobsRes.data      ?? [],
    customers: customersRes.data ?? [],
    quotes:    quotesRes.data    ?? [],
  });
}
