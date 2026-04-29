"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import type { Quote } from "@/lib/types";
import { fmtDate, formatCurrency, formatPhone } from "@/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "draft" | "presented" | "accepted" | "declined";

const STATUS_CONFIG: Record<
  Quote["status"],
  { bg: string; color: string; label: string }
> = {
  draft:     { bg: "#F3F4F6", color: "#4A4A4A",  label: "Draft"     },
  presented: { bg: "#E6F1FB", color: "#185FA5",  label: "Presented" },
  accepted:  { bg: "#EAF3DE", color: "#27500A",  label: "Accepted"  },
  declined:  { bg: "#FCEBEB", color: "#791F1F",  label: "Declined"  },
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all",       label: "All"       },
  { value: "draft",     label: "Draft"     },
  { value: "presented", label: "Presented" },
  { value: "accepted",  label: "Accepted"  },
  { value: "declined",  label: "Declined"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Quote["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full font-medium"
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontFamily: "var(--font-inter)",
        fontSize: "12px",
      }}
    >
      {cfg.label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-100 rounded-2xl h-20" />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((data: Quote[]) => {
        setQuotes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = quotes.filter((q) => {
    const q2 = search.toLowerCase().trim();
    const matchesSearch =
      !q2 ||
      q.customer_name.toLowerCase().includes(q2) ||
      q.customer_phone.includes(q2) ||
      q.property_address.toLowerCase().includes(q2);

    const matchesStatus =
      statusFilter === "all" || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats derived client-side
  const acceptedCount = quotes.filter((q) => q.status === "accepted").length;
  const pendingCount  = quotes.filter((q) => q.status === "draft" || q.status === "presented").length;
  const declinedCount = quotes.filter((q) => q.status === "declined").length;

  const stats = [
    {
      label: "Total Quotes",
      value: quotes.length,
      icon: FileText,
      iconBg: "#EAF3DE",
      iconColor: "#1C3A2B",
    },
    {
      label: "Accepted",
      value: acceptedCount,
      icon: CheckCircle,
      iconBg: "#EAF3DE",
      iconColor: "#27500A",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
      iconBg: "#FAEEDA",
      iconColor: "#C8922A",
    },
    {
      label: "Declined",
      value: declinedCount,
      icon: XCircle,
      iconBg: "#FCEBEB",
      iconColor: "#791F1F",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-bold"
            style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
          >
            Quotes
          </h1>
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
          >
            {quotes.length} total quotes
          </p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
          style={{ background: "#C8922A", fontFamily: "var(--font-inter)", fontSize: "14px" }}
        >
          <Plus size={16} />
          New Quote
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3 shadow-sm"
            style={{ borderColor: "#E5E7EB" }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0 rounded-full"
              style={{ width: 36, height: 36, background: iconBg }}
            >
              <Icon size={16} style={{ color: iconColor }} />
            </div>
            <div>
              <div
                className="font-bold leading-tight"
                style={{ fontFamily: "var(--font-oswald)", fontSize: "20px", color: "#1A1A1A" }}
              >
                {value}
              </div>
              <div
                style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-5">
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#888780" }}
          />
          <input
            type="text"
            placeholder="Search by customer name, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
            style={{
              borderColor: "#D3D1C7",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            }}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => {
            const isActive = statusFilter === value;
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className="px-4 py-1.5 rounded-full border transition-colors font-medium"
                style={{
                  background: isActive ? "#1C3A2B" : "white",
                  borderColor: isActive ? "#1C3A2B" : "#D3D1C7",
                  color: isActive ? "white" : "#888780",
                  fontFamily: "var(--font-inter)",
                  fontSize: "13px",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div
          className="bg-white rounded-2xl border p-12 flex flex-col items-center text-center"
          style={{ borderColor: "#E5E7EB" }}
        >
          <FileText size={40} style={{ color: "#888780" }} />
          <p
            className="mt-3"
            style={{ fontFamily: "var(--font-inter)", fontSize: "15px", color: "#888780" }}
          >
            No quotes yet
          </p>
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
          >
            Create your first quote to get started
          </p>
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
            style={{ background: "#C8922A", fontFamily: "var(--font-inter)", fontSize: "14px" }}
          >
            <Plus size={15} />
            Create your first quote
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((quote) => (
              <Link
                key={quote.id}
                href={`/dashboard/quotes/${quote.id}`}
                className="block bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "15px",
                        color: "#1A1A1A",
                        fontWeight: 700,
                      }}
                    >
                      {quote.customer_name}
                    </div>
                    <div
                      className="truncate"
                      style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
                    >
                      {quote.property_address}
                    </div>
                  </div>
                  <StatusBadge status={quote.status} />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="font-bold"
                    style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1A1A1A" }}
                  >
                    {quote.total_cost ? formatCurrency(quote.total_cost) : "—"}
                  </span>
                  <span
                    style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
                  >
                    {fmtDate(quote.created_at)}
                  </span>
                </div>

                {quote.description_of_work && (
                  <p
                    className="mt-2 truncate"
                    style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
                  >
                    {quote.description_of_work}
                  </p>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div
            className="hidden md:block bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: "#E5E7EB" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9F9F8" }}>
                  {["Customer", "Address", "Service", "Total", "Status", "Date", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left"
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "12px",
                          color: "#888780",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                    style={{ borderTop: "1px solid #F3F4F6" }}
                    onClick={() =>
                      (window.location.href = `/dashboard/quotes/${quote.id}`)
                    }
                  >
                    {/* Customer */}
                    <td className="px-4 py-3.5">
                      <div
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "14px",
                          color: "#1A1A1A",
                          fontWeight: 500,
                        }}
                      >
                        {quote.customer_name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "12px",
                          color: "#888780",
                        }}
                      >
                        {formatPhone(quote.customer_phone)}
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-4 py-3.5">
                      <span
                        className="block truncate max-w-xs"
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "13px",
                          color: "#4A4A4A",
                        }}
                      >
                        {quote.property_address}
                      </span>
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3.5">
                      <span
                        className="block truncate max-w-xs"
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "13px",
                          color: "#4A4A4A",
                        }}
                      >
                        {quote.description_of_work
                          ? quote.description_of_work.slice(0, 30) +
                            (quote.description_of_work.length > 30 ? "…" : "")
                          : "—"}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5">
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "14px",
                          color: "#1A1A1A",
                          fontWeight: 500,
                        }}
                      >
                        {quote.total_cost ? formatCurrency(quote.total_cost) : "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={quote.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5">
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "13px",
                          color: "#888780",
                        }}
                      >
                        {fmtDate(quote.created_at)}
                      </span>
                    </td>

                    {/* Action */}
                    <td
                      className="px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/quotes/${quote.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#F5F5F5]"
                        style={{
                          borderColor: "#D3D1C7",
                          fontFamily: "var(--font-inter)",
                          fontSize: "13px",
                          color: "#4A4A4A",
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
