"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import { formatPhoneInput } from "@/lib/utils";
import type { Job, JobStatus } from "@/lib/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: {
  value: JobStatus;
  label: string;
  activeBg: string;
  activeBorder: string;
  activeColor: string;
}[] = [
  { value: "submitted",   label: "Submitted",   activeBg: "#E6F1FB", activeBorder: "#185FA5", activeColor: "#185FA5" },
  { value: "reviewed",    label: "Reviewed",    activeBg: "#F3EFFE", activeBorder: "#5B21B6", activeColor: "#5B21B6" },
  { value: "quoted",      label: "Quoted",      activeBg: "#FAEEDA", activeBorder: "#633806", activeColor: "#633806" },
  { value: "assigned",    label: "Assigned",    activeBg: "#FFF0E6", activeBorder: "#C2410C", activeColor: "#C2410C" },
  { value: "in_progress", label: "In Progress", activeBg: "#FEF3CD", activeBorder: "#92400E", activeColor: "#92400E" },
  { value: "complete",    label: "Complete",    activeBg: "#EAF3DE", activeBorder: "#27500A", activeColor: "#27500A" },
  { value: "cancelled",   label: "Cancelled",   activeBg: "#F3F4F6", activeBorder: "#9CA3AF", activeColor: "#4A4A4A" },
];

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const inputClass =
  "w-full border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1C3A2B]";

const inputStyle = {
  borderColor: "#D3D1C7",
  fontFamily:  "var(--font-inter)",
  fontSize:    "14px",
  color:       "#1A1A1A",
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
        fontFamily:   "var(--font-inter)",
        fontSize:     "11px",
        color:        "#888780",
        letterSpacing:"0.08em",
        fontWeight:   600,
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      {children}
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const [status, setStatus]               = useState<JobStatus>("submitted");
  const [customerName, setCustomerName]   = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [assignedTo, setAssignedTo]       = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [crewNotes, setCrewNotes]         = useState("");

  useEffect(() => {
    fetch(`/api/admin/jobs/${id}`)
      .then((r) => r.json())
      .then((job: Job) => {
        setStatus(job.status);
        setCustomerName(job.customer_name ?? "");
        setCustomerPhone(formatPhoneInput(job.customer_phone ?? ""));
        setCustomerEmail(job.customer_email ?? "");
        setPropertyAddress(job.property_address ?? "");
        setAssignedTo(job.assigned_to ?? "");
        setScheduledDate(job.scheduled_date ?? "");
        setScheduledTime(job.scheduled_time ?? "");
        setInternalNotes(job.internal_notes ?? "");
        setCrewNotes(job.crew_notes ?? "");
      })
      .catch(() => setError("Failed to load job."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          customer_name:    customerName,
          customer_phone:   customerPhone.replace(/\D/g, ""),
          customer_email:   customerEmail,
          property_address: propertyAddress,
          assigned_to:      assignedTo || null,
          scheduled_date:   scheduledDate || null,
          scheduled_time:   scheduledTime || null,
          internal_notes:   internalNotes,
          crew_notes:       crewNotes,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save job");
      }

      router.push(`/dashboard/jobs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "#1C3A2B" }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href={`/dashboard/jobs/${id}`}
        className="inline-flex items-center gap-2 mb-6 group"
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
      >
        <ChevronLeft size={16} />
        <span className="group-hover:text-[#1A1A1A] transition-colors">Back to Job</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
        >
          Edit Job
        </h1>
        {customerName && (
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
          >
            {customerName}
          </p>
        )}
      </div>

      {/* Status selector */}
      <div
        className="bg-white rounded-2xl border p-4 mb-6 flex items-center gap-3 flex-wrap"
        style={{ borderColor: "#E5E7EB" }}
      >
        <span
          className="font-medium flex-shrink-0"
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}
        >
          Status:
        </span>
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className="px-4 py-2 rounded-full font-medium transition-colors"
              style={{
                fontFamily:  "var(--font-inter)",
                fontSize:    "13px",
                border:      `1.5px solid ${isActive ? opt.activeBorder : "#E5E7EB"}`,
                background:  isActive ? opt.activeBg : "white",
                color:       isActive ? opt.activeColor : "#9CA3AF",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Form card */}
      <div
        className="bg-white rounded-2xl border p-8 shadow-sm space-y-8"
        style={{ borderColor: "#E5E7EB" }}
      >
        {/* ── Customer Information ── */}
        <div>
          <SectionHeader>Customer Information</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <Label>Property Address</Label>
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="Street address"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ── Scheduling ── */}
        <div>
          <SectionHeader>Scheduling</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Assigned To</Label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Crew leader name"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Scheduled Date</Label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Scheduled Time</Label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ── Notes ── */}
        <div>
          <SectionHeader>Notes</SectionHeader>
          <div className="space-y-4">
            <div>
              <Label>Internal Notes</Label>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notes visible only to admin..."
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1C3A2B] resize-none"
                style={{
                  borderColor: "#D3D1C7",
                  fontFamily:  "var(--font-inter)",
                  fontSize:    "14px",
                  color:       "#1A1A1A",
                }}
              />
            </div>
            <div>
              <Label>Crew Notes</Label>
              <textarea
                rows={3}
                value={crewNotes}
                onChange={(e) => setCrewNotes(e.target.value)}
                placeholder="Notes visible to crew in the field app..."
                className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1C3A2B] resize-none"
                style={{
                  borderColor: "#D3D1C7",
                  fontFamily:  "var(--font-inter)",
                  fontSize:    "14px",
                  color:       "#1A1A1A",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        className="sticky bottom-0 mt-8 flex items-center justify-between px-8 py-4"
        style={{ background: "white", borderTop: "1px solid #E5E7EB" }}
      >
        <Link
          href={`/dashboard/jobs/${id}`}
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
        >
          Cancel
        </Link>

        <div className="flex items-center gap-3">
          {error && (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#DC2626" }}>
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-opacity disabled:opacity-60"
            style={{
              background:    "#1C3A2B",
              fontFamily:    "var(--font-oswald)",
              fontSize:      "15px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
