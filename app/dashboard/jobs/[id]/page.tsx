import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { fmtDateTime, timeAgo, formatPhone } from "@/lib/utils";
import type { Job, Submission, AIResult, Flag, SitePin } from "@/lib/types";
import JobManagement from "@/components/jobs/JobManagement";
import PhotoLightbox from "@/components/jobs/PhotoLightbox";
import SiteMap from "@/components/quotes/SiteMap";
import DeleteButton from "@/components/ui/DeleteButton";
import {
  ChevronLeft,
  MapPin,
  TreePine,
  AlertTriangle,
  Info,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  Pencil,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobWithSubmission = Job & { submission: Submission | null };

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
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

const FLAG_CONFIG: Record<
  Flag["severity"],
  { bg: string; color: string; label: string; Icon: typeof AlertTriangle }
> = {
  stop: { bg: "#FCEBEB", color: "#791F1F", label: "Stop", Icon: AlertTriangle },
  caution: { bg: "#FAEEDA", color: "#C8922A", label: "Caution", Icon: AlertTriangle },
  info: { bg: "#E6F1FB", color: "#185FA5", label: "Info", Icon: Info },
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="uppercase tracking-wider mb-4"
      style={{
        fontFamily: "var(--font-inter)",
        fontSize: "11px",
        color: "#888780",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-1"
      style={{
        fontFamily: "var(--font-inter)",
        fontSize: "11px",
        color: "#888780",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </div>
  );
}

// ─── AI Assessment sub-section ────────────────────────────────────────────────

function AIAssessment({ ai }: { ai: AIResult }) {
  const confidenceStyle =
    ai.species_confidence?.toLowerCase() === "high"
      ? { bg: "#EAF3DE", color: "#27500A" }
      : ai.species_confidence?.toLowerCase() === "medium"
      ? { bg: "#FAEEDA", color: "#633806" }
      : { bg: "#F3F4F6", color: "#4A4A4A" };

  return (
    <div>
      {/* Species */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 40, height: 40, borderRadius: "50%", background: "#EAF3DE" }}
        >
          <TreePine size={20} style={{ color: "#1C3A2B" }} />
        </div>
        <div>
          <div
            className="font-bold"
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: "18px",
              color: "#1A1A1A",
            }}
          >
            {ai.species_name}
          </div>
          {ai.species_confidence && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full mt-0.5"
              style={{
                background: confidenceStyle.bg,
                color: confidenceStyle.color,
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
              }}
            >
              {ai.species_confidence} confidence
            </span>
          )}
        </div>
      </div>

      {/* Key Characteristics */}
      {ai.key_characteristics?.length > 0 && (
        <div className="mb-4">
          <FieldLabel>Key Characteristics</FieldLabel>
          <ul className="space-y-1">
            {ai.key_characteristics.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "13px",
                  color: "#4A4A4A",
                }}
              >
                <span
                  className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#1C3A2B" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Flags */}
      {ai.flags?.length > 0 && (
        <div className="mb-4">
          <FieldLabel>Flags</FieldLabel>
          <div>
            {ai.flags.map((flag, i) => {
              const cfg = FLAG_CONFIG[flag.severity];
              const FlagIcon = cfg.Icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 py-3"
                  style={{
                    borderBottom:
                      i < ai.flags.length - 1 ? "1px solid #F3F4F6" : "none",
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: cfg.bg,
                    }}
                  >
                    <FlagIcon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <div
                      className="font-bold"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "12px",
                        color: cfg.color,
                      }}
                    >
                      {cfg.label}
                    </div>
                    <div
                      className="mt-0.5"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "13px",
                        color: "#4A4A4A",
                      }}
                    >
                      {flag.message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Crew Tips */}
      {ai.crew_tips?.length > 0 && (
        <div className="mb-4">
          <FieldLabel>Crew Tips</FieldLabel>
          <ol className="space-y-2">
            {ai.crew_tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "13px",
                  color: "#4A4A4A",
                }}
              >
                <span
                  className="flex-shrink-0 font-bold"
                  style={{ color: "#1C3A2B", minWidth: "1.2rem" }}
                >
                  {i + 1}.
                </span>
                {tip}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Site Considerations */}
      {ai.site_considerations?.length > 0 && (
        <div>
          <FieldLabel>Site Considerations</FieldLabel>
          <ul className="space-y-1">
            {ai.site_considerations.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2"
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "13px",
                  color: "#4A4A4A",
                }}
              >
                <span
                  className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#888780" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ job }: { job: JobWithSubmission }) {
  const events: { label: string; timestamp: string }[] = [
    { label: "Submitted", timestamp: job.created_at },
    ...(job.completed_at
      ? [{ label: "Completed", timestamp: job.completed_at }]
      : []),
  ];

  return (
    <div>
      {events.map((event, i) => (
        <div key={event.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className="flex-shrink-0 rounded-full mt-1"
              style={{ width: 8, height: 8, background: "#1C3A2B" }}
            />
            {i < events.length - 1 && (
              <div
                className="flex-1 my-1"
                style={{ width: 1, background: "#E5E7EB" }}
              />
            )}
          </div>
          <div className="pb-4">
            <div
              className="font-bold"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                color: "#1A1A1A",
              }}
            >
              {event.label}
            </div>
            <div
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                color: "#888780",
              }}
            >
              {fmtDateTime(event.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data }, { data: quoteData }] = await Promise.all([
    supabaseAdmin
      .from("jobs")
      .select("*, submission:submissions!submission_id(*)")
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("quotes")
      .select("site_map_pins")
      .eq("job_id", id)
      .maybeSingle(),
  ]);

  const job = data as JobWithSubmission | null;
  if (!job) redirect("/dashboard/jobs");

  const siteMapPins: SitePin[] = (quoteData?.site_map_pins ?? []) as SitePin[];

  const submission = job.submission;
  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.submitted;
  const fieldAppUrl = process.env.NEXT_PUBLIC_FIELD_APP_URL ?? "";
  const urgencyCfg = submission?.urgency
    ? URGENCY_CONFIG[submission.urgency.toLowerCase()]
    : null;

  const aiResult =
    submission?.ai_result && !submission.ai_result.no_tree_detected
      ? (submission.ai_result as AIResult)
      : null;

  const photoUrls = submission?.photo_urls ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-2 mb-6 transition-colors group"
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "14px",
          color: "#888780",
        }}
      >
        <ChevronLeft size={16} />
        <span className="group-hover:text-[#1A1A1A] transition-colors">
          Back to Jobs
        </span>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "13px",
              color: "#888780",
              marginBottom: "4px",
            }}
          >
            {job.reference_code}
          </div>
          <h1
            className="font-bold"
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: "28px",
              color: "#1A1A1A",
            }}
          >
            {job.customer_name}
          </h1>
          <div
            className="flex items-center gap-1.5 mt-1"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "15px",
              color: "#4A4A4A",
            }}
          >
            <MapPin size={16} style={{ color: "#888780" }} className="flex-shrink-0" />
            {job.property_address}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className="inline-flex items-center px-4 py-2 rounded-xl font-bold"
            style={{
              background: statusCfg.bg,
              color: statusCfg.color,
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            }}
          >
            {statusCfg.label}
          </span>
          <div
            className="mt-2"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              color: "#888780",
            }}
          >
            Submitted {timeAgo(job.created_at)}
          </div>
        </div>
      </div>

      {/* Admin actions */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Link
          href={`/dashboard/jobs/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors hover:bg-[#F5F2ED]"
          style={{
            borderColor: "#D3D1C7",
            color:       "#4A4A4A",
            fontFamily:  "var(--font-inter)",
            fontSize:    "14px",
            background:  "white",
          }}
        >
          <Pencil size={15} />
          Edit Job
        </Link>
        <DeleteButton
          deleteUrl={`/api/admin/jobs/${id}`}
          redirectTo="/dashboard/jobs"
          label="Delete Job"
          confirmMessage="Delete this job permanently?"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-6">
        {/* ── Left column ── */}
        <div>
          {/* Card 1: Customer Information */}
          <div
            className="bg-white rounded-2xl border p-6 mb-4"
            style={{ borderColor: "#E5E7EB" }}
          >
            <SectionLabel>Customer Information</SectionLabel>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact */}
              <div>
                <FieldLabel>Contact</FieldLabel>
                <div
                  className="font-bold"
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "15px",
                    color: "#1A1A1A",
                  }}
                >
                  {job.customer_name}
                </div>
                <a
                  href={`tel:${job.customer_phone}`}
                  className="flex items-center gap-1.5 mt-1 hover:underline"
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "14px",
                    color: "#1C3A2B",
                  }}
                >
                  <Phone size={13} />
                  {formatPhone(job.customer_phone)}
                </a>
                {job.customer_email && (
                  <a
                    href={`mailto:${job.customer_email}`}
                    className="flex items-center gap-1.5 mt-1 hover:underline"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "14px",
                      color: "#1C3A2B",
                    }}
                  >
                    <Mail size={13} />
                    {job.customer_email}
                  </a>
                )}
              </div>

              {/* Service Request */}
              {submission && (
                <div>
                  <FieldLabel>Service Request</FieldLabel>
                  <div
                    className="font-bold"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "15px",
                      color: "#1A1A1A",
                    }}
                  >
                    {submission.service_type || "—"}
                  </div>
                  {submission.tree_count && (
                    <div
                      className="mt-1"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "14px",
                        color: "#888780",
                      }}
                    >
                      Trees: {submission.tree_count}
                    </div>
                  )}
                  {submission.best_time_to_call && (
                    <div
                      className="mt-0.5"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "14px",
                        color: "#888780",
                      }}
                    >
                      Best time: {submission.best_time_to_call}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Urgency */}
            {urgencyCfg && (
              <div className="mt-4">
                <FieldLabel>Urgency</FieldLabel>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full"
                  style={{
                    background: urgencyCfg.bg,
                    color: urgencyCfg.color,
                    fontFamily: "var(--font-inter)",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {urgencyCfg.label}
                </span>
              </div>
            )}

            {/* Additional Notes */}
            {submission?.additional_notes && (
              <div className="mt-4">
                <FieldLabel>Customer Notes</FieldLabel>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: "#F9F9F8",
                    fontFamily: "var(--font-inter)",
                    fontSize: "14px",
                    color: "#1A1A1A",
                  }}
                >
                  {submission.additional_notes}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: AI Assessment */}
          <div
            className="bg-white rounded-2xl border p-6 mb-4"
            style={{ borderColor: "#E5E7EB" }}
          >
            <SectionLabel>AI Assessment</SectionLabel>
            {aiResult ? (
              <AIAssessment ai={aiResult} />
            ) : (
              <div
                className="rounded-xl px-4 py-4 text-center"
                style={{
                  background: "#F9F9F8",
                  fontFamily: "var(--font-inter)",
                  fontSize: "14px",
                  color: "#888780",
                }}
              >
                No AI assessment on file
              </div>
            )}
          </div>

          {/* Card 3: Photos */}
          {photoUrls.length > 0 && (
            <div
              className="bg-white rounded-2xl border p-6 mb-4"
              style={{ borderColor: "#E5E7EB" }}
            >
              <SectionLabel>
                Photos{" "}
                <span style={{ textTransform: "none" }}>
                  ({photoUrls.length})
                </span>
              </SectionLabel>
              <PhotoLightbox urls={photoUrls} />
            </div>
          )}

          {/* Card 4: Site Map */}
          {siteMapPins.length > 0 && (
            <div
              className="bg-white rounded-2xl border p-6 mb-4"
              style={{ borderColor: "#E5E7EB" }}
            >
              <SectionLabel>Site Map</SectionLabel>
              <SiteMap
                address={job.property_address}
                initialPins={siteMapPins}
                readOnly
              />
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div>
          {/* Job Management (client component) */}
          <JobManagement job={job} />

          {/* Quick Actions */}
          <div
            className="bg-white rounded-2xl border p-5 mb-4"
            style={{ borderColor: "#E5E7EB" }}
          >
            <SectionLabel>Actions</SectionLabel>
            <div className="space-y-2">
              {/* Call */}
              <a
                href={`tel:${job.customer_phone}`}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{
                  background: "#1C3A2B",
                  fontFamily: "var(--font-inter)",
                  fontSize: "14px",
                }}
              >
                <Phone size={15} />
                Call {formatPhone(job.customer_phone)}
              </a>

              {/* Email */}
              <a
                href={`mailto:${job.customer_email}`}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border transition-colors hover:bg-[#F0F7F3]"
                style={{
                  background: "white",
                  borderColor: "#1C3A2B",
                  color: "#1C3A2B",
                  fontFamily: "var(--font-inter)",
                  fontSize: "14px",
                }}
              >
                <Mail size={15} />
                Send Email
              </a>

              {/* Create Quote */}
              <Link
                href={`/dashboard/quotes/new?jobId=${job.id}`}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border transition-colors hover:opacity-90"
                style={{
                  background: "white",
                  borderColor: "#C8922A",
                  color: "#C8922A",
                  fontFamily: "var(--font-inter)",
                  fontSize: "14px",
                }}
              >
                <FileText size={15} />
                Create Quote
              </Link>

              {/* Customer Results */}
              <a
                href={`${fieldAppUrl}/results/customer/${job.submission_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border transition-colors hover:bg-[#F9F9F8]"
                style={{
                  background: "white",
                  borderColor: "#D3D1C7",
                  color: "#4A4A4A",
                  fontFamily: "var(--font-inter)",
                  fontSize: "14px",
                }}
              >
                <ExternalLink size={15} />
                View Customer Page
              </a>
            </div>
          </div>

          {/* Timeline */}
          <div
            className="bg-white rounded-2xl border p-5"
            style={{ borderColor: "#E5E7EB" }}
          >
            <SectionLabel>Timeline</SectionLabel>
            <Timeline job={job} />
          </div>
        </div>
      </div>
    </div>
  );
}
