"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────

const LEAD_SOURCE_OPTIONS = [
  { value: "phone_call",      label: "Phone Call"        },
  { value: "walk_in",         label: "Walk In"           },
  { value: "saw_truck",       label: "Saw Our Truck"     },
  { value: "in_neighborhood", label: "In Neighborhood"   },
  { value: "referral",        label: "Referral"          },
  { value: "google",          label: "Google / Internet" },
  { value: "valpak",          label: "Valpak / Flyer"    },
  { value: "facebook",        label: "Facebook"          },
  { value: "repeat",          label: "Repeat Customer"   },
  { value: "other",           label: "Other"             },
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

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const encodedPhone = params.phone as string;
  const phone = decodeURIComponent(encodedPhone);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [address, setAddress]         = useState("");
  const [leadSource, setLeadSource]   = useState("");
  const [referredBy, setReferredBy]   = useState("");
  const [otherSource, setOtherSource] = useState("");
  const [salesRep, setSalesRep]       = useState("");
  const [notes, setNotes]             = useState("");

  useEffect(() => {
    fetch(`/api/admin/customers/${encodedPhone}`)
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setAddress(data.address ?? "");
        setLeadSource(data.lead_source ?? "");
        setReferredBy(data.referred_by ?? "");
        setOtherSource(data.other_source ?? "");
        setSalesRep(data.sales_rep ?? "");
        setNotes(data.notes ?? "");
      })
      .catch(() => {
        // No profile yet — start with empty fields
      })
      .finally(() => setLoading(false));
  }, [encodedPhone]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${encodedPhone}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          address,
          leadSource,
          referredBy:  leadSource === "referral" ? referredBy  : "",
          otherSource: leadSource === "other"    ? otherSource : "",
          salesRep,
          notes,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save customer");
      }

      router.push(`/dashboard/customers/${encodedPhone}`);
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
        href={`/dashboard/customers/${encodedPhone}`}
        className="inline-flex items-center gap-2 mb-6 group"
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
      >
        <ChevronLeft size={16} />
        <span className="group-hover:text-[#1A1A1A] transition-colors">Back to Customer</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
        >
          Edit Customer
        </h1>
        <p
          className="mt-1"
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
        >
          {phone}
        </p>
      </div>

      {/* Form card */}
      <div
        className="bg-white rounded-2xl border p-8 shadow-sm space-y-8"
        style={{ borderColor: "#E5E7EB" }}
      >
        {/* ── Contact Information ── */}
        <div>
          <SectionHeader>Contact Information</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <input
                type="text"
                value={phone}
                disabled
                className={inputClass}
                style={{ ...inputStyle, background: "#F9F9F8", color: "#888780" }}
              />
            </div>
            <div>
              <Label>Email</Label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={inputClass}
                style={inputStyle}
              />
            </div>
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
          </div>
        </div>

        {/* ── Lead Information ── */}
        <div>
          <SectionHeader>Lead Information</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <Label>Sales Rep</Label>
              <input
                type="text"
                value={salesRep}
                onChange={(e) => setSalesRep(e.target.value)}
                placeholder="Rep name"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            {leadSource === "referral" && (
              <div className="md:col-span-2">
                <Label>Referred By</Label>
                <input
                  type="text"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  placeholder="Name of referring customer"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            )}
            {leadSource === "other" && (
              <div className="md:col-span-2">
                <Label>Other Source</Label>
                <input
                  type="text"
                  value={otherSource}
                  onChange={(e) => setOtherSource(e.target.value)}
                  placeholder="Describe how they found us"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Internal Notes ── */}
        <div>
          <SectionHeader>Internal Notes</SectionHeader>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any internal notes about this customer..."
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
          href={`/dashboard/customers/${encodedPhone}`}
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
