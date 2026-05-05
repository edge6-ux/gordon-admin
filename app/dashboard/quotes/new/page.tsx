"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import SignaturePad from "@/components/quotes/SignaturePad";
import SiteMap from "@/components/quotes/SiteMap";
import { formatCurrency } from "@/lib/utils";
import type { Job, Submission, SitePin } from "@/lib/types";

// ─── Data ─────────────────────────────────────────────────────────────────────

const LEAD_SOURCE_OPTIONS = [
  { value: "phone_call",      label: "Phone Call"       },
  { value: "walk_in",         label: "Walk In"          },
  { value: "saw_truck",       label: "Saw Our Truck"    },
  { value: "in_neighborhood", label: "In Neighborhood"  },
  { value: "referral",        label: "Referral"         },
  { value: "google",          label: "Google / Internet"},
  { value: "valpak",          label: "Valpak / Flyer"   },
  { value: "facebook",        label: "Facebook"         },
  { value: "repeat",          label: "Repeat Customer"  },
  { value: "other",           label: "Other"            },
];

const NOTES_ITEMS = [
  { label: "Pending HOA",     key: "pendingHoa"      },
  { label: "City Permit",     key: "cityPermit"      },
  { label: "811 Locate",      key: "locate811"       },
  { label: "Main Lines",      key: "mainLines"       },
  { label: "Power Drop",      key: "powerDrop"       },
  { label: "Arborist Onsite", key: "arboristOnsite"  },
] as const;

const EQUIPMENT_ITEMS = [
  "Chipper", "Pole Pruner",
  "Loader", "Pole Saw",
  "Mini Loader", "Ladder",
  "Climber", "Hedge Trimmers",
  "Grapple", "Cones",
  "Alturnamats", "Lift",
];

type NotesKey = typeof NOTES_ITEMS[number]["key"];
type JobWithSub = Job & { submission: Submission | null };

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

const inputClass =
  "w-full border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1C3A2B]";

const inputStyle = {
  borderColor: "#D3D1C7",
  fontFamily: "var(--font-inter)",
  fontSize: "14px",
  color: "#1A1A1A",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block mb-1.5 font-medium"
      style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
    >
      {children}
    </label>
  );
}

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

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className="flex items-center justify-center flex-shrink-0 rounded transition-colors"
        style={{
          width: 16,
          height: 16,
          border: checked ? "none" : "1.5px solid #D3D1C7",
          background: checked ? "#1C3A2B" : "white",
        }}
        onClick={onChange}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}
        onClick={onChange}
      >
        {label}
      </span>
    </label>
  );
}

function Toggle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-3">
      <div
        className="relative transition-colors"
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? "#1C3A2B" : "#D3D1C7",
        }}
      >
        <div
          className="absolute top-1 transition-transform"
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "white",
            transform: checked ? "translateX(22px)" : "translateX(4px)",
          }}
        />
      </div>
      <span
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}
      >
        {label}
      </span>
    </button>
  );
}

function CurrencyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
        >
          $
        </span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
          style={{
            paddingLeft: 28,
            paddingRight: 12,
            borderColor: "#D3D1C7",
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            color: "#1A1A1A",
          }}
        />
      </div>
    </div>
  );
}

// ─── Inner page (needs useSearchParams) ───────────────────────────────────────

function NewQuoteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = new Date().toISOString().split("T")[0];

  // Customer info
  const [customerName, setCustomerName]     = useState("");
  const [customerPhone, setCustomerPhone]   = useState("");
  const [customerEmail, setCustomerEmail]   = useState("");
  const [address, setAddress]               = useState("");
  const [city, setCity]                     = useState("");

  // Quote metadata
  const [date, setDate]               = useState(today);
  const [wetDry, setWetDry]           = useState<"wet" | "dry" | "">("");
  const [leadSource, setLeadSource]   = useState("");
  const [hoursEstimate, setHoursEstimate] = useState("");

  // Notes checkboxes
  const [notes, setNotes] = useState<Record<NotesKey, boolean>>({
    pendingHoa: false,
    cityPermit: false,
    locate811: false,
    mainLines: false,
    powerDrop: false,
    arboristOnsite: false,
  });

  // Description
  const [descriptionOfWork, setDescriptionOfWork] = useState("");

  // Site map
  const [siteMapPins, setSiteMapPins] = useState<SitePin[]>([]);

  // Equipment
  const [equipmentNeeded, setEquipmentNeeded] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);

  // Costs
  const [treeServicesCost, setTreeServicesCost]   = useState(0);
  const [stumpRemovalCost, setStumpRemovalCost]   = useState(0);
  const [discount, setDiscount]                   = useState(0);
  const [cardFeeApplied, setCardFeeApplied]       = useState(false);

  // Signature
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [signedAt, setSignedAt]                   = useState<string | null>(null);

  // UI
  const [saving, setSaving] = useState<"draft" | "presented" | null>(null);
  const [error, setError]   = useState<string | null>(null);

  // Prefill from URL params on mount
  useEffect(() => {
    const jobId = searchParams.get("jobId");
    const phone = searchParams.get("phone");

    if (jobId) {
      fetch(`/api/admin/jobs/${jobId}`)
        .then((r) => r.json())
        .then((job: JobWithSub) => {
          setCustomerName(job.customer_name ?? "");
          setCustomerPhone(job.customer_phone ?? "");
          setCustomerEmail(job.customer_email ?? "");
          setAddress(job.property_address ?? "");
          if (job.submission?.service_type) {
            setDescriptionOfWork(job.submission.service_type);
          }
        })
        .catch(() => {});
    } else if (phone) {
      const decoded = decodeURIComponent(phone);
      fetch(`/api/admin/customers/${encodeURIComponent(decoded)}`)
        .then((r) => r.json())
        .then((c: { name?: string; phone?: string; email?: string; address?: string }) => {
          setCustomerName(c.name ?? "");
          setCustomerPhone(c.phone ?? "");
          setCustomerEmail(c.email ?? "");
          setAddress(c.address ?? "");
        })
        .catch(() => {});
    }
  }, [searchParams]);

  // Calculated totals
  const baseTotal = Math.max(
    0,
    (treeServicesCost || 0) + (stumpRemovalCost || 0) - (discount || 0)
  );
  const cardFeeAmount = parseFloat((baseTotal * 0.03).toFixed(2));
  const totalCost = cardFeeApplied ? baseTotal + cardFeeAmount : baseTotal;

  const handleSignature = useCallback((dataUrl: string | null) => {
    setCustomerSignature(dataUrl);
    setSignedAt(dataUrl ? new Date().toISOString().split("T")[0] : null);
  }, []);

  function toggleEquipment(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  async function handleSave(status: "draft" | "presented") {
    setSaving(status);
    setError(null);

    const propertyAddress = [address, city].filter(Boolean).join(", ");

    try {
      const res = await fetch("/api/admin/quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: searchParams.get("jobId") || null,
          customerName,
          customerPhone: customerPhone.replace(/\D/g, ""),
          customerEmail,
          propertyAddress,
          date,
          wetDry,
          leadSource,
          hoursEstimate,
          pendingHoa: notes.pendingHoa,
          cityPermit: notes.cityPermit,
          locate811: notes.locate811,
          mainLines: notes.mainLines,
          powerDrop: notes.powerDrop,
          arboristOnsite: notes.arboristOnsite,
          descriptionOfWork,
          siteMapPins,
          equipment: equipmentNeeded ? equipment : [],
          treeServicesCost,
          stumpRemovalCost,
          discount,
          totalCost,
          cardFeeApplied,
          customerSignature,
          signedAt,
          status,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save quote");
      }

      const { id } = (await res.json()) as { id: string };
      router.push(`/dashboard/quotes/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save quote. Please try again."
      );
      setSaving(null);
    }
  }

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
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
        >
          New Quote
        </h1>
        <p
          className="mt-1"
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
        >
          Gordon Pro Tree Service Contract Agreement
        </p>
      </div>

      {/* Form card */}
      <div
        className="bg-white rounded-2xl border p-8 shadow-sm space-y-8"
        style={{ borderColor: "#E5E7EB" }}
      >
        {/* ── Section 1: Customer Information ── */}
        <div>
          <SectionHeader>Customer Information</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <Label>Date</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Customer Name */}
            <div>
              <Label>Customer Name</Label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Address */}
            <div>
              <Label>Address</Label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* City */}
            <div>
              <Label>City</Label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Phone */}
            <div>
              <Label>Phone</Label>
              <PhoneInput
                value={customerPhone}
                onChange={setCustomerPhone}
                placeholder="(555) 555-5555"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <Label>Email</Label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@example.com"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Hours Estimate */}
            <div>
              <Label>Est. Hours</Label>
              <input
                type="text"
                value={hoursEstimate}
                onChange={(e) => setHoursEstimate(e.target.value)}
                placeholder="e.g. 4-6"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Conditions */}
            <div>
              <Label>Conditions</Label>
              <div className="flex gap-2 mt-1">
                {(["wet", "dry"] as const).map((cond) => {
                  const isSelected = wetDry === cond;
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setWetDry(isSelected ? "" : cond)}
                      className="px-4 py-1.5 rounded-full border transition-colors font-medium uppercase"
                      style={{
                        background: isSelected ? "#1C3A2B" : "white",
                        borderColor: isSelected ? "#1C3A2B" : "#D3D1C7",
                        color: isSelected ? "white" : "#888780",
                        fontFamily: "var(--font-inter)",
                        fontSize: "13px",
                      }}
                    >
                      {cond.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lead Source */}
            <div>
              <Label>Lead Source</Label>
              <select
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className={`${inputClass} bg-white appearance-none`}
                style={inputStyle}
              >
                <option value="">Select source...</option>
                {LEAD_SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 2: Notes ── */}
        <div>
          <SectionHeader>Notes</SectionHeader>
          <div className="grid grid-cols-2 gap-3">
            {NOTES_ITEMS.map(({ label, key }) => (
              <CheckboxItem
                key={key}
                label={label}
                checked={notes[key]}
                onChange={() => setNotes((prev) => ({ ...prev, [key]: !prev[key] }))}
              />
            ))}
          </div>
        </div>

        {/* ── Section 3: Description of Work ── */}
        <div>
          <SectionHeader>Description of Work</SectionHeader>
          <textarea
            rows={6}
            value={descriptionOfWork}
            onChange={(e) => setDescriptionOfWork(e.target.value)}
            placeholder="Describe the work to be performed in detail..."
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1C3A2B] resize-none"
            style={{
              borderColor: "#D3D1C7",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              color: "#1A1A1A",
            }}
          />
        </div>

        {/* ── Section 4: Site Map ── */}
        <div>
          <SectionHeader>Site Map</SectionHeader>
          <SiteMap
            address={[address, city].filter(Boolean).join(", ")}
            initialPins={[]}
            onChange={setSiteMapPins}
          />
        </div>

        {/* ── Section 5: Equipment Needed ── */}
        <div>
          <SectionHeader>Equipment Needed</SectionHeader>
          <Toggle
            checked={equipmentNeeded}
            onToggle={() => setEquipmentNeeded((v) => !v)}
            label="Equipment needed"
          />
          {equipmentNeeded && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {EQUIPMENT_ITEMS.map((item) => (
                <CheckboxItem
                  key={item}
                  label={item}
                  checked={equipment.includes(item)}
                  onChange={() => toggleEquipment(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Section 6: Cost Summary ── */}
        <div>
          <SectionHeader>Cost Summary</SectionHeader>
          <p
            className="mb-4"
            style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
          >
            Price is based on cash/check payments
          </p>

          <div className="space-y-3">
            <CurrencyInput
              label="Tree Services"
              value={treeServicesCost}
              onChange={setTreeServicesCost}
            />
            <CurrencyInput
              label="Stump Removal"
              value={stumpRemovalCost}
              onChange={setStumpRemovalCost}
            />
            <CurrencyInput
              label="Discount"
              value={discount}
              onChange={setDiscount}
            />
          </div>

          <div
            className="my-4"
            style={{ borderTop: "1px solid #E5E7EB" }}
          />

          {/* Total */}
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
            <div className="text-right">
              <span
                className="font-bold block"
                style={{ fontFamily: "var(--font-oswald)", fontSize: "22px", color: "#1C3A2B" }}
              >
                {formatCurrency(totalCost)}
              </span>
              {cardFeeApplied && (
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "11px",
                    color: "#888780",
                  }}
                >
                  incl. 3% card fee (+{formatCurrency(cardFeeAmount)})
                </span>
              )}
            </div>
          </div>

          {/* Card fee checkbox */}
          <div className="mt-3">
            <CheckboxItem
              label="Apply 3% card/debit fee"
              checked={cardFeeApplied}
              onChange={() => setCardFeeApplied((v) => !v)}
            />
          </div>
        </div>

        {/* ── Section 7: Customer Acceptance ── */}
        <div>
          <SectionHeader>Customer Acceptance</SectionHeader>

          {/* Legal text */}
          <div
            className="rounded-xl p-4 mb-6"
            style={{ background: "#F9F9F8" }}
          >
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

          {/* Signature pad */}
          <SignaturePad onSignature={handleSignature} />

          {/* Date signed */}
          {signedAt && (
            <p
              className="mt-3"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
            >
              Date: {signedAt}
            </p>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        className="sticky bottom-0 mt-8 flex items-center justify-end gap-3 px-8 py-4"
        style={{ background: "white", borderTop: "1px solid #E5E7EB" }}
      >
        {error && (
          <p
            className="mr-auto"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#DC2626" }}
          >
            {error}
          </p>
        )}

        {/* Save as Draft */}
        <button
          type="button"
          onClick={() => handleSave("draft")}
          disabled={saving !== null}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-colors disabled:opacity-60"
          style={{
            borderColor: "#D3D1C7",
            background: "white",
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
            color: "#4A4A4A",
          }}
        >
          {saving === "draft" && <Loader2 size={14} className="animate-spin" />}
          Save as Draft
        </button>

        {/* Save & Present */}
        <button
          type="button"
          onClick={() => handleSave("presented")}
          disabled={saving !== null}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition-opacity disabled:opacity-60"
          style={{
            background: "#1C3A2B",
            fontFamily: "var(--font-oswald)",
            fontSize: "15px",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {saving === "presented" && <Loader2 size={14} className="animate-spin" />}
          Save &amp; Present to Customer
        </button>
      </div>
    </div>
  );
}

// ─── Page wrapper (Suspense for useSearchParams) ───────────────────────────────

export default function NewQuotePage() {
  return (
    <Suspense fallback={null}>
      <NewQuoteInner />
    </Suspense>
  );
}
