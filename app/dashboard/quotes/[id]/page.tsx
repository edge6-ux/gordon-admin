import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatPhone, formatCurrency, fmtDate } from "@/lib/utils";
import SiteMap from "@/components/quotes/SiteMap";
import QuoteActions from "@/components/quotes/QuoteActions";
import DownloadQuoteButton from "@/components/quotes/DownloadQuoteButton";
import PrintQuoteButton from "@/components/quotes/PrintQuoteButton";
import DeleteButton from "@/components/ui/DeleteButton";
import type { Quote } from "@/lib/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const LEAD_SOURCE_LABELS: Record<string, string> = {
  phone_call:      "Phone Call",
  walk_in:         "Walk In",
  saw_truck:       "Saw Our Truck",
  in_neighborhood: "In Neighborhood",
  referral:        "Referral",
  google:          "Google / Internet",
  valpak:          "Valpak / Flyer",
  facebook:        "Facebook",
  repeat:          "Repeat Customer",
  other:           "Other",
};

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  draft:     { bg: "#F5F2ED", color: "#888780", label: "Draft"     },
  presented: { bg: "#E6F1FB", color: "#185FA5", label: "Presented" },
  accepted:  { bg: "#F0FDF4", color: "#16A34A", label: "Accepted"  },
  declined:  { bg: "#FCEBEB", color: "#E24B4A", label: "Declined"  },
};

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="uppercase pb-3 mb-5"
      style={{
        fontFamily: "var(--font-inter)",
        fontSize: "11px",
        color: "#888780",
        letterSpacing: "0.08em",
        fontWeight: 600,
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      {children}
    </p>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "12px",
          color: "#888780",
          marginBottom: 2,
        }}
      >
        {label}
      </p>
      <p
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#1A1A1A" }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function LineItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "14px",
          color: accent ? "#E24B4A" : "#1A1A1A",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: quote, error } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !quote) notFound();

  const q = quote as Quote;
  const statusStyle = STATUS_STYLES[q.status] ?? STATUS_STYLES.draft;

  const activeNotes = [
    q.pending_hoa    && "Pending HOA",
    q.city_permit    && "City Permit",
    q.locate_811     && "811 Locate",
    q.main_lines     && "Main Lines",
    q.power_drop     && "Power Drop",
    q.arborist_onsite && "Arborist Onsite",
  ].filter(Boolean) as string[];

  const baseTotal      = Math.max(0, (q.tree_services_cost || 0) + (q.stump_removal_cost || 0) - (q.discount || 0));
  const cardFeeAmount  = parseFloat((baseTotal * 0.03).toFixed(2));
  const siteMapPins    = q.site_map_pins ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/quotes"
        className="inline-flex items-center gap-2 mb-6 group"
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
      >
        <ChevronLeft size={16} />
        <span className="group-hover:text-[#1A1A1A] transition-colors">Back to Quotes</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="font-bold"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
            >
              {q.customer_name || "Quote"}
            </h1>
            <p
              className="mt-1"
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
            >
              {fmtDate(q.date)} &middot; {q.property_address || "No address"}
            </p>
          </div>
          <span
            className="px-3 py-1 rounded-full font-medium flex-shrink-0"
            style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
            }}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* Actions */}
        <div className="print-hide mt-4 flex flex-wrap items-center gap-2">
          <QuoteActions quoteId={q.id} jobId={q.job_id} status={q.status} />
          <Link
            href={`/dashboard/quotes/${q.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors"
            style={{
              borderColor: "#D3D1C7",
              color:       "#4A4A4A",
              fontFamily:  "var(--font-inter)",
              fontSize:    "14px",
              background:  "white",
              whiteSpace:  "nowrap",
              textDecoration: "none",
            }}
          >
            <Pencil size={15} />
            Edit Quote
          </Link>
          <DownloadQuoteButton quote={q} />
          <PrintQuoteButton />
          <DeleteButton
            deleteUrl={`/api/admin/quotes/${q.id}`}
            redirectTo="/dashboard/quotes"
            label="Delete"
            confirmMessage="Delete this quote permanently?"
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-2xl border p-8 shadow-sm space-y-8"
        style={{ borderColor: "#E5E7EB" }}
      >
        {/* ── Section 1: Customer Information ── */}
        <div>
          <SectionHeader>Customer Information</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date"        value={q.date} />
            <Field label="Sales Rep"   value={q.sales_rep} />
            <Field label="Name"        value={q.customer_name} />
            <Field label="Phone"       value={formatPhone(q.customer_phone)} />
            <Field label="Email"       value={q.customer_email} />
            <Field label="Address"     value={q.property_address} />
            <Field label="Est. Hours"  value={q.hours_estimate} />
            <Field label="Conditions"  value={q.wet_dry ? q.wet_dry.toUpperCase() : undefined} />
            <Field label="Lead Source" value={LEAD_SOURCE_LABELS[q.lead_source] ?? q.lead_source} />
          </div>
        </div>

        {/* ── Section 2: Notes ── */}
        {activeNotes.length > 0 && (
          <div>
            <SectionHeader>Notes</SectionHeader>
            <div className="flex flex-wrap gap-2">
              {activeNotes.map((note) => (
                <span
                  key={note}
                  className="px-3 py-1 rounded-full"
                  style={{
                    background: "#F5F2ED",
                    color: "#4A4A4A",
                    fontFamily: "var(--font-inter)",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 3: Description of Work ── */}
        <div>
          <SectionHeader>Description of Work</SectionHeader>
          <p
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              color: "#1A1A1A",
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
            }}
          >
            {q.description_of_work || "—"}
          </p>
        </div>

        {/* ── Section 4: Site Map ── */}
        {siteMapPins.length > 0 && (
          <div>
            <SectionHeader>Site Map</SectionHeader>
            <SiteMap
              address={q.property_address}
              initialPins={siteMapPins}
              readOnly
            />
          </div>
        )}

        {/* ── Section 5: Equipment ── */}
        {q.equipment?.length > 0 && (
          <div>
            <SectionHeader>Equipment</SectionHeader>
            <div className="flex flex-wrap gap-2">
              {q.equipment.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-full"
                  style={{
                    background: "#F5F2ED",
                    color: "#4A4A4A",
                    fontFamily: "var(--font-inter)",
                    fontSize: "13px",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 6: Cost Summary ── */}
        <div>
          <SectionHeader>Cost Summary</SectionHeader>
          <div className="space-y-3">
            <LineItem label="Tree Services"   value={formatCurrency(q.tree_services_cost)} />
            {q.stump_removal_cost > 0 && (
              <LineItem label="Stump Removal" value={formatCurrency(q.stump_removal_cost)} />
            )}
            {q.discount > 0 && (
              <LineItem label="Discount" value={`−${formatCurrency(q.discount)}`} accent />
            )}
            {q.card_fee_applied && (
              <LineItem label="Card Fee (3%)" value={formatCurrency(cardFeeAmount)} />
            )}
          </div>

          <div className="my-4" style={{ borderTop: "1px solid #E5E7EB" }} />

          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "#F5F2ED" }}
          >
            <span
              className="font-bold"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "16px", color: "#1A1A1A" }}
            >
              Total Cost
            </span>
            <span
              className="font-bold"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "22px", color: "#1C3A2B" }}
            >
              {formatCurrency(q.total_cost)}
            </span>
          </div>
        </div>

        {/* ── Section 7: Customer Acceptance ── */}
        <div>
          <SectionHeader>Customer Acceptance</SectionHeader>

          <div className="rounded-xl p-4 mb-6" style={{ background: "#F9F9F8" }}>
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                color: "#4A4A4A",
                lineHeight: 1.7,
              }}
            >
              By signing this agreement, I authorize Gordon Pro Tree Service to do the work
              as specified. Furthermore, I have read and agree to the terms and conditions.
              A cancellation charge of 20% of the contract agreement total cost will apply,
              if canceled due to no fault of GPTS.
            </p>
          </div>

          {q.customer_signature ? (
            <div>
              <div
                className="rounded-xl overflow-hidden border"
                style={{ borderColor: "#E5E7EB" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.customer_signature}
                  alt="Customer signature"
                  style={{ width: "100%", background: "white", display: "block" }}
                />
              </div>
              {q.signed_at && (
                <p
                  className="mt-2"
                  style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
                >
                  Signed: {q.signed_at}
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}>
              Not yet signed
            </p>
          )}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
