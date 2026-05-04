import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_FIELD_APP_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean) as string[];

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] ?? "*");
  return {
    "Access-Control-Allow-Origin":  allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

// ─── Reference code ───────────────────────────────────────────────────────────

function generateReferenceCode(): string {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = String(now.getMonth() + 1).padStart(2, "0");
  const d    = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GP-${y}${m}${d}-${rand}`;
}

// ─── Timeframe label ──────────────────────────────────────────────────────────

function formatTimeframe(date?: string, slot?: string): string {
  if (!date && !slot) return "Flexible";
  const parts: string[] = [];
  if (date) {
    const [y, mo, d] = date.split("-").map(Number);
    parts.push(new Date(y, mo - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
  }
  if (slot) parts.push(slot.charAt(0).toUpperCase() + slot.slice(1));
  return parts.join(" – ");
}

// ─── POST /api/public/request-quote ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  const {
    customerName,
    customerPhone,
    customerEmail    = "",
    propertyAddress  = "",
    serviceType      = "tree_service",
    serviceDescription = "",
    preferredDate,
    preferredTimeframe,
    photoUrls        = [],
    aiResult         = null,
    treeCount        = "",
    urgency          = "",
  } = body as {
    customerName:       string;
    customerPhone:      string;
    customerEmail?:     string;
    propertyAddress?:   string;
    serviceType?:       string;
    serviceDescription?: string;
    preferredDate?:     string;
    preferredTimeframe?: string;
    photoUrls?:         string[];
    aiResult?:          unknown;
    treeCount?:         string;
    urgency?:           string;
  };

  if (!customerName || !customerPhone) {
    return NextResponse.json(
      { error: "Customer name and phone are required" },
      { status: 400, headers }
    );
  }

  const phone         = (customerPhone as string).replace(/\D/g, "");
  const referenceCode = generateReferenceCode();
  const timeframeLabel = formatTimeframe(preferredDate as string | undefined, preferredTimeframe as string | undefined);

  const bestTimeToCall = timeframeLabel !== "Flexible"
    ? `Preferred service date: ${timeframeLabel}`
    : "Flexible";

  const internalNotes = [
    preferredDate || preferredTimeframe
      ? `Customer prefers: ${timeframeLabel}`
      : null,
    aiResult ? "Submitted with AI tree assessment." : null,
  ].filter(Boolean).join("\n");

  // ── 1. Create submission ────────────────────────────────────────────────────

  const { data: submission, error: subError } = await supabaseAdmin
    .from("submissions")
    .insert({
      customer_name:    customerName,
      customer_phone:   phone,
      customer_email:   customerEmail,
      property_address: propertyAddress,
      service_type:     serviceType,
      tree_count:       treeCount,
      urgency:          urgency || "standard",
      best_time_to_call: bestTimeToCall,
      additional_notes: serviceDescription,
      photo_urls:       photoUrls,
      ai_result:        aiResult,
      source:           "customer",
      status:           "new",
      reference_code:   referenceCode,
      internal_notes:   internalNotes,
    })
    .select()
    .single();

  if (subError || !submission) {
    console.error("Submission insert error:", subError);
    return NextResponse.json(
      { error: subError?.message ?? "Failed to save request" },
      { status: 500, headers }
    );
  }

  // ── 2. Create job ───────────────────────────────────────────────────────────

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
      internal_notes:   internalNotes,
    })
    .select()
    .single();

  if (jobError || !job) {
    console.error("Job insert error:", jobError);
    return NextResponse.json(
      { error: jobError?.message ?? "Failed to create job record" },
      { status: 500, headers }
    );
  }

  // ── 3. Notify admin ─────────────────────────────────────────────────────────

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUrl   = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://gordon-admin.vercel.app";

  if (adminEmail) {
    await resend.emails.send({
      from:    "Gordon Pro Tree Service <jobs@gordonprotreeservice.com>",
      to:      adminEmail,
      subject: `New Quote Request — ${referenceCode} (${customerName})`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1A1A1A">
          <div style="background:#1C3A2B;padding:20px 24px;border-radius:12px 12px 0 0">
            <p style="margin:0;color:white;font-size:18px;font-weight:700">New Quote Request</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${referenceCode}</p>
          </div>
          <div style="background:white;padding:24px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px 0;color:#888780;width:140px">Customer</td><td style="padding:6px 0;font-weight:600">${customerName}</td></tr>
              <tr><td style="padding:6px 0;color:#888780">Phone</td><td style="padding:6px 0">${phone}</td></tr>
              ${customerEmail ? `<tr><td style="padding:6px 0;color:#888780">Email</td><td style="padding:6px 0">${customerEmail}</td></tr>` : ""}
              ${propertyAddress ? `<tr><td style="padding:6px 0;color:#888780">Property</td><td style="padding:6px 0">${propertyAddress}</td></tr>` : ""}
              <tr><td style="padding:6px 0;color:#888780">Preferred Date</td><td style="padding:6px 0;font-weight:600;color:#C8922A">${timeframeLabel}</td></tr>
              ${serviceDescription ? `<tr><td style="padding:6px 0;color:#888780;vertical-align:top">Details</td><td style="padding:6px 0">${serviceDescription}</td></tr>` : ""}
              ${aiResult ? `<tr><td style="padding:6px 0;color:#888780">AI Assessment</td><td style="padding:6px 0">Included ✓</td></tr>` : ""}
              ${photoUrls && (photoUrls as string[]).length > 0 ? `<tr><td style="padding:6px 0;color:#888780">Photos</td><td style="padding:6px 0">${(photoUrls as string[]).length} attached</td></tr>` : ""}
            </table>
            <div style="margin-top:20px">
              <a href="${adminUrl}/dashboard/jobs/${job.id}" style="display:inline-block;background:#1C3A2B;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">View Job in Admin →</a>
            </div>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error("Admin email failed:", err));
  }

  // ── 4. Confirm to customer ──────────────────────────────────────────────────

  if (customerEmail) {
    await resend.emails.send({
      from:    "Gordon Pro Tree Service <jobs@gordonprotreeservice.com>",
      to:      customerEmail,
      subject: `We received your quote request — ${referenceCode}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1A1A1A">
          <div style="background:#1C3A2B;padding:20px 24px;border-radius:12px 12px 0 0">
            <p style="margin:0;color:white;font-size:18px;font-weight:700">Gordon Pro Tree Service</p>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">Quote Request Received</p>
          </div>
          <div style="background:white;padding:24px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px">
            <p style="font-size:15px;line-height:1.6">Hi <strong>${customerName}</strong>,</p>
            <p style="font-size:15px;line-height:1.6">Thanks for reaching out! We've received your quote request and one of our team members will follow up with you shortly.</p>
            <div style="background:#F5F2ED;border-radius:10px;padding:16px 20px;margin:20px 0">
              <p style="margin:0 0 8px;font-size:12px;color:#888780;text-transform:uppercase;letter-spacing:0.05em">Your Request Summary</p>
              <p style="margin:0;font-size:14px"><strong>Reference:</strong> ${referenceCode}</p>
              ${propertyAddress ? `<p style="margin:4px 0 0;font-size:14px"><strong>Property:</strong> ${propertyAddress}</p>` : ""}
              <p style="margin:4px 0 0;font-size:14px"><strong>Preferred Date:</strong> ${timeframeLabel}</p>
            </div>
            <p style="font-size:14px;color:#4A4A4A;line-height:1.6">We'll reach out to confirm your appointment. If you need to reach us sooner, call us directly and mention your reference number above.</p>
            <p style="font-size:14px;color:#888780;margin-top:24px">— The Gordon Pro Tree Service Team</p>
          </div>
        </div>
      `,
    }).catch((err: unknown) => console.error("Customer confirmation email failed:", err));
  }

  return NextResponse.json(
    { success: true, referenceCode, message: "Your quote request has been received." },
    { status: 201, headers }
  );
}
