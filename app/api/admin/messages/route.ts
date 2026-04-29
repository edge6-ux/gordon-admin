import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { jobId, channel, subject, body, sentBy, customerEmail, customerName } =
    await req.json();

  // 1. Save to messages table
  const { data: message, error } = await supabaseAdmin
    .from("messages")
    .insert({
      job_id: jobId || null,
      direction: "outbound",
      channel,
      subject: subject || null,
      body,
      sent_by: sentBy,
      status: channel === "sms" ? "pending_twilio" : "sent",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Send via Resend if email
  if (channel === "email" && customerEmail) {
    try {
      await resend.emails.send({
        from: "Gordon Pro Tree Service <jobs@gordonprotreeservice.com>",
        to: customerEmail,
        subject: subject || "Message from Gordon Pro Tree Service",
        text: body,
      });
    } catch (emailErr) {
      console.error("Resend failed:", emailErr);
      // Don't block — message already saved
    }
  }

  // 3. SMS — log only, Twilio future
  if (channel === "sms") {
    console.log(
      `[SMS pending] To: ${customerName ?? "customer"} — ${body.slice(0, 50)}...`
    );
  }

  return NextResponse.json(message);
}
