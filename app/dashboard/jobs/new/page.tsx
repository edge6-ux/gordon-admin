"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import type { Job } from "@/lib/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const SERVICE_TYPE_OPTIONS = [
  "Tree Removal",
  "Tree Trimming",
  "Stump Removal",
  "Emergency Tree Service",
  "Lot Clearing",
  "Tree Planting",
  "Tree Assessment",
  "Other",
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

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      className="block mb-1.5 font-medium"
      style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
    >
      {children}
      {required && <span style={{ color: "#DC2626" }}> *</span>}
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

export default function NewJobPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [customerName, setCustomerName]       = useState("");
  const [customerPhone, setCustomerPhone]     = useState("");
  const [customerEmail, setCustomerEmail]     = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [serviceType, setServiceType]         = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [internalNotes, setInternalNotes]     = useState("");
  const [assignedTo, setAssignedTo]           = useState("");
  const [scheduledDate, setScheduledDate]     = useState("");
  const [scheduledTime, setScheduledTime]     = useState("");

  async function handleSave() {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Customer name and phone are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/jobs/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone: customerPhone.replace(/\D/g, ""),
          customerEmail,
          propertyAddress,
          serviceType,
          additionalNotes,
          internalNotes,
          assignedTo,
          scheduledDate: scheduledDate || null,
          scheduledTime: scheduledTime || null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create job");
      }

      const job = (await res.json()) as Job;
      router.push(`/dashboard/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-2 mb-6 group"
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
      >
        <ChevronLeft size={16} />
        <span className="group-hover:text-[#1A1A1A] transition-colors">Back to Jobs</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
        >
          New Job
        </h1>
        <p
          className="mt-1"
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
        >
          Create a job manually
        </p>
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
              <Label required>Customer Name</Label>
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
              <Label required>Phone</Label>
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

        {/* ── Service Details ── */}
        <div>
          <SectionHeader>Service Details</SectionHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Type</Label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className={`${inputClass} bg-white appearance-none`}
                style={inputStyle}
              >
                <option value="">Select service type...</option>
                {SERVICE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Customer Notes</Label>
              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any notes from the customer..."
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

        {/* ── Scheduling ── */}
        <div>
          <SectionHeader>Scheduling (Optional)</SectionHeader>
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

        {/* ── Internal Notes ── */}
        <div>
          <SectionHeader>Internal Notes</SectionHeader>
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
      </div>

      {/* Sticky bottom bar */}
      <div
        className="sticky bottom-0 mt-8 flex items-center justify-between px-8 py-4"
        style={{ background: "white", borderTop: "1px solid #E5E7EB" }}
      >
        <Link
          href="/dashboard/jobs"
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
            {saving ? "Creating..." : "Create Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
