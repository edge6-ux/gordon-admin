import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch the job
  const { data: job, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Move to "reviewed" — signals it's been reviewed by admin and is now in sales queue
  const { error: updateError } = await supabaseAdmin
    .from("jobs")
    .update({ status: "reviewed" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Fetch all sales reps from user_profiles
  const { data: salesProfiles } = await supabaseAdmin
    .from("user_profiles")
    .select("id, name, role")
    .eq("role", "sales");

  if (!salesProfiles?.length) {
    return NextResponse.json({ success: true, notified: 0 });
  }

  // Get their email addresses from auth.admin
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const profileIds = new Set(salesProfiles.map((p) => p.id));
  const salesUsers = (authData?.users ?? []).filter((u) => profileIds.has(u.id) && u.email);

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://gordon-admin.vercel.app";

  // Notify each sales rep
  await Promise.all(
    salesUsers.map((user) => {
      const profile = salesProfiles.find((p) => p.id === user.id);
      return resend.emails.send({
        from:    "Gordon Pro Tree Service <jobs@gordonprotreeservice.com>",
        to:      user.email!,
        subject: `New quote needed — ${job.reference_code} (${job.customer_name})`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1A1A1A">
            <div style="background:#1C3A2B;padding:20px 24px;border-radius:12px 12px 0 0">
              <p style="margin:0;color:white;font-size:18px;font-weight:700">New Job Ready for Quote</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">${job.reference_code}</p>
            </div>
            <div style="background:white;padding:24px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px">
              <p style="font-size:15px">Hi <strong>${profile?.name ?? "there"}</strong>, a job has been assigned to your queue.</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
                <tr><td style="padding:6px 0;color:#888780;width:140px">Customer</td><td style="padding:6px 0;font-weight:600">${job.customer_name}</td></tr>
                <tr><td style="padding:6px 0;color:#888780">Phone</td><td style="padding:6px 0">${job.customer_phone}</td></tr>
                ${job.customer_email ? `<tr><td style="padding:6px 0;color:#888780">Email</td><td style="padding:6px 0">${job.customer_email}</td></tr>` : ""}
                ${job.property_address ? `<tr><td style="padding:6px 0;color:#888780">Property</td><td style="padding:6px 0">${job.property_address}</td></tr>` : ""}
                ${job.internal_notes ? `<tr><td style="padding:6px 0;color:#888780;vertical-align:top">Notes</td><td style="padding:6px 0">${job.internal_notes}</td></tr>` : ""}
              </table>
              <div style="margin-top:20px;display:flex;gap:10px">
                <a href="${adminUrl}/dashboard/jobs/${id}" style="display:inline-block;background:#1C3A2B;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">View Job →</a>
                <a href="${adminUrl}/dashboard/quotes/new?jobId=${id}" style="display:inline-block;background:#C8922A;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500">Create Quote →</a>
              </div>
            </div>
          </div>
        `,
      }).catch((err: unknown) => console.error(`Email to ${user.email} failed:`, err));
    })
  );

  return NextResponse.json({ success: true, notified: salesUsers.length });
}
