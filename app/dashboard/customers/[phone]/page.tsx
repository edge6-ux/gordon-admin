import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { fmtDate, formatPhone } from "@/lib/utils";
import type { Job, Submission, JobStatus, AIResult, Flag, Message, CustomerProfile } from "@/lib/types";
import { ChevronLeft, Phone, Mail, MapPin, FileText, Pencil } from "lucide-react";
import ComposeMessage from "@/components/customers/ComposeMessage";
import CustomerNotes from "@/components/customers/CustomerNotes";
import DeleteButton from "@/components/ui/DeleteButton";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobWithSubmission = Job & { submission: Submission | null };

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  JobStatus,
  { bg: string; color: string; label: string }
> = {
  submitted: { bg: "#E6F1FB", color: "#185FA5", label: "Submitted" },
  reviewed: { bg: "#F3EFFE", color: "#5B21B6", label: "Reviewed" },
  quoted: { bg: "#FAEEDA", color: "#633806", label: "Quoted" },
  assigned: { bg: "#FFF0E6", color: "#C2410C", label: "Assigned" },
  in_progress: { bg: "#FEF3CD", color: "#92400E", label: "In Progress" },
  complete: { bg: "#EAF3DE", color: "#27500A", label: "Complete" },
  cancelled: { bg: "#F3F4F6", color: "#4A4A4A", label: "Cancelled" },
};

const URGENCY_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  emergency: { bg: "#FCEBEB", color: "#791F1F", label: "Emergency" },
  soon: { bg: "#FAEEDA", color: "#633806", label: "Soon" },
  routine: { bg: "#EAF3DE", color: "#27500A", label: "Routine" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

function flagBadge(flags: Flag[]): { bg: string; color: string; label: string } | null {
  if (!flags?.length) return null;
  const hasStop = flags.some((f) => f.severity === "stop");
  const hasCaution = flags.some((f) => f.severity === "caution");
  if (hasStop) return { bg: "#FCEBEB", color: "#791F1F", label: `${flags.length} flag${flags.length > 1 ? "s" : ""}` };
  if (hasCaution) return { bg: "#FAEEDA", color: "#633806", label: `${flags.length} flag${flags.length > 1 ? "s" : ""}` };
  return { bg: "#F3F4F6", color: "#4A4A4A", label: `${flags.length} flag${flags.length > 1 ? "s" : ""}` };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone: encodedPhone } = await params;
  const phone = decodeURIComponent(encodedPhone);

  const [{ data: jobsData }, { data: submissionsData }, { data: profileData }] = await Promise.all([
    supabaseAdmin
      .from("jobs")
      .select("*, submission:submissions!submission_id(*)")
      .eq("customer_phone", phone)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("customer_profiles")
      .select("*")
      .eq("phone", phone)
      .maybeSingle(),
  ]);

  const jobs = (jobsData ?? []) as JobWithSubmission[];
  const submissions = (submissionsData ?? []) as Submission[];
  const profile = profileData as CustomerProfile | null;

  // Fetch messages for all jobs belonging to this customer
  const jobIds = jobs.map((j) => j.id);
  const { data: messagesData } = jobIds.length > 0
    ? await supabaseAdmin
        .from("messages")
        .select("*")
        .in("job_id", jobIds)
        .order("created_at", { ascending: true })
    : { data: [] };
  const messages = (messagesData ?? []) as Message[];

  // Most recent internal note body
  const internalMessages = messages.filter((m) => m.direction === "internal");
  const internalNotes = internalMessages.length > 0
    ? internalMessages[internalMessages.length - 1].body
    : "";

  if (jobs.length === 0 && submissions.length === 0 && !profile) {
    redirect("/dashboard/customers");
  }

  // Derive customer info — jobs/submissions first, fall back to profile record
  const firstJob = jobs[0];
  const firstSub = submissions[0];
  const name = firstJob?.customer_name ?? firstSub?.customer_name ?? profile?.name ?? "";
  const email = firstJob?.customer_email ?? firstSub?.customer_email ?? profile?.email ?? "";
  const address = firstJob?.property_address ?? firstSub?.property_address ?? profile?.address ?? "";

  // Earliest date for "Customer since"
  const allDates = [
    ...jobs.map((j) => j.created_at),
    ...submissions.map((s) => s.created_at),
    ...(profile ? [profile.created_at] : []),
  ].sort();
  const earliestDate = allDates[0];

  // Lead source label map
  const LEAD_SOURCE_LABELS: Record<string, string> = {
    phone_call: "Phone Call",
    walk_in: "Walk In",
    saw_truck: "Saw Our Truck",
    in_neighborhood: "In Neighborhood",
    referral: "Referral",
    google: "Google / Internet",
    valpak: "Valpak / Flyer",
    repeat: "Repeat Customer",
    other: "Other",
  };
  const leadSourceLabel = profile?.lead_source
    ? (LEAD_SOURCE_LABELS[profile.lead_source] ?? profile.lead_source)
    : null;
  const referredBy = profile?.lead_source === "referral" && profile.referred_by
    ? profile.referred_by
    : null;
  const otherSource = profile?.lead_source === "other" && profile.other_source
    ? profile.other_source
    : null;

  // Stats
  const completedCount = jobs.filter((j) => j.status === "complete").length;
  const lastService = jobs[0]?.created_at ?? null;
  const firstService = jobs.length > 0 ? jobs[jobs.length - 1].created_at : null;

  // Assessment history — submissions with AI results
  const assessments = submissions.filter(
    (s) => s.ai_result !== null && !(s.ai_result as AIResult).no_tree_detected
  );

  const stats = [
    { label: "Total Jobs", value: jobs.length },
    { label: "Completed", value: completedCount },
    { label: "Last Service", value: lastService ? fmtDate(lastService) : "—" },
    { label: "First Service", value: firstService ? fmtDate(firstService) : "—" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 mb-6 group"
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
      >
        <ChevronLeft size={16} />
        <span className="group-hover:text-[#1A1A1A] transition-colors">
          Back to Customers
        </span>
      </Link>

      {/* Header card */}
      <div
        className="bg-white rounded-2xl border p-6 mb-6 shadow-sm"
        style={{ borderColor: "#E5E7EB" }}
      >
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-full"
            style={{ width: 72, height: 72, background: "#1C3A2B" }}
          >
            <span
              className="font-bold"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "white" }}
            >
              {getInitials(name)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + repeat badge */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1
                  className="font-bold"
                  style={{ fontFamily: "var(--font-oswald)", fontSize: "26px", color: "#1A1A1A" }}
                >
                  {name}
                </h1>
                {earliestDate && (
                  <div
                    className="mt-1"
                    style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
                  >
                    Customer since {fmtDate(earliestDate)}
                  </div>
                )}
              </div>
              {jobs.length > 1 && (
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-xl flex-shrink-0 font-bold"
                  style={{
                    background: "#EAF3DE",
                    color: "#27500A",
                    fontFamily: "var(--font-inter)",
                    fontSize: "13px",
                  }}
                >
                  Repeat Customer
                </span>
              )}
            </div>

            {/* Contact row */}
            <div className="mt-4 flex gap-6 flex-wrap">
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 hover:underline"
                style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#1C3A2B" }}
              >
                <Phone size={16} style={{ color: "#888780" }} />
                {formatPhone(phone)}
              </a>

              <a
                href={email ? `mailto:${email}` : undefined}
                className="inline-flex items-center gap-2 hover:underline"
                style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: email ? "#1C3A2B" : "#888780" }}
              >
                <Mail size={16} style={{ color: "#888780" }} />
                {email || "Not provided"}
              </a>

              {address && (
                <div
                  className="inline-flex items-center gap-2"
                  style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}
                >
                  <MapPin size={16} style={{ color: "#888780" }} />
                  {address}
                </div>
              )}
            </div>

            {/* Lead source row */}
            {(leadSourceLabel || profile?.sales_rep) && (
              <div className="mt-3 flex gap-4 flex-wrap">
                {leadSourceLabel && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{
                      background: "#F3F4F6",
                      fontFamily: "var(--font-inter)",
                      fontSize: "12px",
                      color: "#4A4A4A",
                    }}
                  >
                    Source:{" "}
                    <strong>
                      {referredBy
                        ? `Referral — ${referredBy}`
                        : otherSource
                        ? otherSource
                        : leadSourceLabel}
                    </strong>
                  </span>
                )}
                {profile?.sales_rep && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{
                      background: "#F3F4F6",
                      fontFamily: "var(--font-inter)",
                      fontSize: "12px",
                      color: "#4A4A4A",
                    }}
                  >
                    Taken by: <strong>{profile.sales_rep}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Stats row */}
            <div
              className="mt-4 pt-4 flex gap-6 flex-wrap"
              style={{ borderTop: "1px solid #F3F4F6" }}
            >
              {stats.map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span
                    className="font-bold"
                    style={{ fontFamily: "var(--font-oswald)", fontSize: "22px", color: "#1A1A1A" }}
                  >
                    {value}
                  </span>
                  <span
                    style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Admin actions */}
            <div
              className="mt-4 pt-4 flex items-center gap-2 flex-wrap"
              style={{ borderTop: "1px solid #F3F4F6" }}
            >
              <Link
                href={`/dashboard/customers/${encodedPhone}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors"
                style={{
                  borderColor: "#D3D1C7",
                  color:       "#4A4A4A",
                  fontFamily:  "var(--font-inter)",
                  fontSize:    "14px",
                  background:  "white",
                  textDecoration: "none",
                }}
              >
                <Pencil size={14} />
                Edit Profile
              </Link>
              <DeleteButton
                deleteUrl={`/api/admin/customers/${encodedPhone}`}
                redirectTo="/dashboard/customers"
                label="Delete Profile"
                confirmMessage="Delete this customer profile? Their jobs will remain."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div
        className="bg-white rounded-2xl border p-4 mb-6"
        style={{ borderColor: "#E5E7EB" }}
      >
        <div className="flex gap-3 flex-wrap">
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity"
            style={{ background: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "14px" }}
          >
            <Phone size={15} />
            Call Customer
          </a>
          <a
            href={email ? `mailto:${email}` : undefined}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors hover:bg-[#F0F7F3]"
            style={{
              borderColor: "#1C3A2B",
              color: "#1C3A2B",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            }}
          >
            <Mail size={15} />
            Send Email
          </a>
          <Link
            href={`/dashboard/quotes/new?phone=${encodeURIComponent(phone)}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors hover:opacity-90"
            style={{
              borderColor: "#C8922A",
              color: "#C8922A",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            }}
          >
            <FileText size={15} />
            New Quote
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ── Left column ── */}
        <div>
          {/* Job History */}
          <div
            className="bg-white rounded-2xl border p-6 mb-4"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-bold"
                style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1A1A1A" }}
              >
                Job History
              </h2>
              <span
                style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
              >
                {jobs.length} jobs
              </span>
            </div>

            {jobs.length === 0 ? (
              <div
                className="py-8 text-center"
                style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
              >
                No jobs on record
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const cfg = STATUS_CONFIG[job.status];
                  const urgencyKey = job.submission?.urgency?.toLowerCase() ?? "";
                  const urgency = URGENCY_CONFIG[urgencyKey];

                  return (
                    <Link
                      key={job.id}
                      href={`/dashboard/jobs/${job.id}`}
                      className="block rounded-xl border p-4 hover:shadow-sm transition-shadow cursor-pointer"
                      style={{ borderColor: "#E5E7EB" }}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: "11px",
                              color: "#888780",
                              marginBottom: "2px",
                            }}
                          >
                            {job.reference_code}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: "14px",
                              color: "#1A1A1A",
                              fontWeight: 500,
                            }}
                          >
                            {job.submission?.service_type || job.property_address}
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            fontFamily: "var(--font-inter)",
                            fontSize: "12px",
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      {/* Middle — pills */}
                      {(job.submission?.tree_count || urgency) && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {job.submission?.tree_count && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full"
                              style={{
                                background: "#F3F4F6",
                                color: "#4A4A4A",
                                fontFamily: "var(--font-inter)",
                                fontSize: "11px",
                              }}
                            >
                              {job.submission.tree_count} tree{job.submission.tree_count !== "1" ? "s" : ""}
                            </span>
                          )}
                          {urgency && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full"
                              style={{
                                background: urgency.bg,
                                color: urgency.color,
                                fontFamily: "var(--font-inter)",
                                fontSize: "11px",
                              }}
                            >
                              {urgency.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bottom row */}
                      <div
                        className="mt-3 pt-3 flex items-center justify-between"
                        style={{ borderTop: "1px solid #F9F9F8" }}
                      >
                        <span
                          style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
                        >
                          {fmtDate(job.created_at)}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: "12px",
                            color: "#1C3A2B",
                            fontWeight: 500,
                          }}
                        >
                          View Job →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assessment History */}
          <div
            className="bg-white rounded-2xl border p-6 mb-4"
            style={{ borderColor: "#E5E7EB" }}
          >
            <h2
              className="font-bold mb-4"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1A1A1A" }}
            >
              Assessment History
            </h2>

            {assessments.length === 0 ? (
              <div
                className="py-6 text-center"
                style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
              >
                No AI assessments on file
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((sub) => {
                  const ai = sub.ai_result as AIResult;
                  const confKey = ai.species_confidence?.toLowerCase() ?? "";
                  const confStyle =
                    confKey === "high"
                      ? { bg: "#EAF3DE", color: "#27500A" }
                      : confKey === "medium"
                      ? { bg: "#FAEEDA", color: "#633806" }
                      : { bg: "#F3F4F6", color: "#4A4A4A" };
                  const fb = flagBadge(ai.flags ?? []);

                  return (
                    <div
                      key={sub.id}
                      className="rounded-xl p-4"
                      style={{ background: "#F9F9F8" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className="font-bold"
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: "14px",
                            color: "#1A1A1A",
                          }}
                        >
                          {ai.species_name}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: "12px",
                            color: "#888780",
                          }}
                        >
                          {fmtDate(sub.created_at)}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {ai.species_confidence && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full"
                            style={{
                              background: confStyle.bg,
                              color: confStyle.color,
                              fontFamily: "var(--font-inter)",
                              fontSize: "11px",
                            }}
                          >
                            {ai.species_confidence} confidence
                          </span>
                        )}
                        {fb && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full"
                            style={{
                              background: fb.bg,
                              color: fb.color,
                              fontFamily: "var(--font-inter)",
                              fontSize: "11px",
                            }}
                          >
                            {fb.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div>
          <ComposeMessage
            jobIds={jobIds}
            customerEmail={email}
            customerName={name}
            initialMessages={messages}
          />
          <CustomerNotes
            customerPhone={phone}
            initialNotes={internalNotes}
          />
        </div>
      </div>
    </div>
  );
}
