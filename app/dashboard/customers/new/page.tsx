"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneInput from "@/components/ui/PhoneInput";
import {
  ChevronLeft,
  UserPlus,
  Loader2,
  Phone,
  Users,
  Truck,
  MapPin,
  Share2,
  Globe,
  Mail,
  Star,
  HelpCircle,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const LEAD_SOURCES = [
  { value: "phone_call", label: "Phone Call", icon: Phone },
  { value: "walk_in", label: "Walk In", icon: Users },
  { value: "saw_truck", label: "Saw Our Truck", icon: Truck },
  { value: "in_neighborhood", label: "In Neighborhood", icon: MapPin },
  { value: "referral", label: "Referral", icon: Share2 },
  { value: "google", label: "Google / Internet", icon: Globe },
  { value: "valpak", label: "Valpak / Flyer", icon: Mail },
  { value: "repeat", label: "Repeat Customer", icon: Star },
  { value: "other", label: "Other", icon: HelpCircle },
] as const;

// ─── Shared styles ────────────────────────────────────────────────────────────

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

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mt-1"
      style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
    >
      {children}
    </p>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="uppercase pb-3 mb-4"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCustomerPage() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [otherSource, setOtherSource] = useState("");
  const [salesRep, setSalesRep] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    customerName.trim() !== "" &&
    customerPhone.trim() !== "" &&
    propertyAddress.trim() !== "";

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.replace(/\D/g, ""),
          customerEmail: customerEmail.trim(),
          propertyAddress: propertyAddress.trim(),
          leadSource,
          referredBy: leadSource === "referral" ? referredBy : "",
          otherSource: leadSource === "other" ? otherSource : "",
          salesRep,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create customer");
      }

      router.push(
        `/dashboard/customers/${encodeURIComponent(customerPhone.replace(/\D/g, ""))}`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create customer. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 mb-6 group"
        style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
      >
        <ChevronLeft size={16} />
        <span className="group-hover:text-[#1A1A1A] transition-colors">Back to Customers</span>
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
        >
          Add Customer
        </h1>
        <p
          className="mt-1"
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
        >
          Manually create a customer profile
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
          <div className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Smith"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <div>
              <Label>Phone Number *</Label>
              <PhoneInput
                value={customerPhone}
                onChange={setCustomerPhone}
                placeholder="(555) 555-5555"
                className={inputClass}
                style={inputStyle}
              />
              <Helper>Used as unique customer identifier</Helper>
            </div>

            <div>
              <Label>Email Address</Label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jane@example.com"
                className={inputClass}
                style={inputStyle}
              />
              <Helper>Optional — for email correspondence</Helper>
            </div>

            <div>
              <Label>Property Address *</Label>
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="123 Main St, Gainesville, GA"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Lead Source ── */}
        <div>
          <SectionHeader>Lead Source</SectionHeader>
          <p
            className="mb-4"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
          >
            How did this customer find us?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {LEAD_SOURCES.map((src) => {
              const isSelected = leadSource === src.value;
              return (
                <button
                  key={src.value}
                  type="button"
                  onClick={() => setLeadSource(isSelected ? "" : src.value)}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
                  style={{
                    border: `${isSelected ? "2px" : "1.5px"} solid ${
                      isSelected ? "#1C3A2B" : "#E5E7EB"
                    }`,
                    background: isSelected ? "#F0F7F3" : "white",
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 36, height: 36, background: "#EAF3DE" }}
                  >
                    <src.icon size={16} style={{ color: "#1C3A2B" }} />
                  </div>
                  <span
                    className="font-bold"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "13px",
                      color: "#1A1A1A",
                    }}
                  >
                    {src.label}
                  </span>
                </button>
              );
            })}
          </div>

          {leadSource === "referral" && (
            <div className="mt-3">
              <Label>Referred by</Label>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                placeholder="Who referred them?"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          {leadSource === "other" && (
            <div className="mt-3">
              <Label>Specify source</Label>
              <input
                type="text"
                value={otherSource}
                onChange={(e) => setOtherSource(e.target.value)}
                placeholder="Describe the lead source"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {/* ── Section 3: Internal Details ── */}
        <div>
          <SectionHeader>Internal Details</SectionHeader>
          <div>
            <Label>Taken by</Label>
            <input
              type="text"
              value={salesRep}
              onChange={(e) => setSalesRep(e.target.value)}
              placeholder="Who took this call?"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        className="sticky bottom-0 mt-8 flex items-center justify-between px-8 py-4"
        style={{ background: "white", borderTop: "1px solid #E5E7EB" }}
      >
        <Link
          href="/dashboard/customers"
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
        >
          Cancel
        </Link>

        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-opacity disabled:opacity-60"
            style={{
              background: "#1C3A2B",
              fontFamily: "var(--font-oswald)",
              fontSize: "15px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create Customer
              </>
            )}
          </button>

          {error && (
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#DC2626" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
