"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Users, RefreshCw, UserPlus } from "lucide-react";
import type { Customer } from "@/lib/types";
import { fmtDate, formatPhone } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

function Avatar({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: "#EAF3DE",
      }}
    >
      <span
        className="font-bold"
        style={{
          fontFamily: "var(--font-oswald)",
          fontSize: size === 44 ? "16px" : "14px",
          color: "#1C3A2B",
        }}
      >
        {getInitials(name)}
      </span>
    </div>
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data: Customer[]) => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const repeatCount = customers.filter((c) => c.total_jobs > 1).length;
  const newThisMonth = customers.filter(
    (c) => new Date(c.created_at) >= firstOfMonth
  ).length;

  const stats = [
    {
      label: "Total Customers",
      value: customers.length,
      icon: Users,
      iconBg: "#EAF3DE",
      iconColor: "#1C3A2B",
    },
    {
      label: "Repeat Customers",
      value: repeatCount,
      icon: RefreshCw,
      iconBg: "#FAEEDA",
      iconColor: "#C8922A",
    },
    {
      label: "New This Month",
      value: newThisMonth,
      icon: UserPlus,
      iconBg: "#E6F1FB",
      iconColor: "#185FA5",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-bold"
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: "24px",
              color: "#1A1A1A",
            }}
          >
            Customers
          </h1>
          <p
            className="mt-1"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              color: "#888780",
            }}
          >
            {customers.length} total customers
          </p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-colors hover:bg-[#2D5A40]"
          style={{
            background: "#1C3A2B",
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
          }}
        >
          <UserPlus size={16} />
          Add Customer
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#888780" }}
        />
        <input
          type="text"
          placeholder="Search by name, phone, or address..."
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

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3"
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
                style={{
                  fontFamily: "var(--font-oswald)",
                  fontSize: "20px",
                  color: "#1A1A1A",
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "12px",
                  color: "#888780",
                }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div
          className="bg-white rounded-2xl border p-12 flex flex-col items-center text-center"
          style={{ borderColor: "#E5E7EB" }}
        >
          <Users size={40} style={{ color: "#888780" }} />
          <p
            className="mt-3"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "15px",
              color: "#888780",
            }}
          >
            No customers yet
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((customer) => (
              <Link
                key={customer.id}
                href={`/dashboard/customers/${encodeURIComponent(customer.phone)}`}
                className="block bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={customer.name} size={44} />
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "15px",
                        color: "#1A1A1A",
                        fontWeight: 700,
                      }}
                    >
                      {customer.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "13px",
                        color: "#888780",
                      }}
                    >
                      {formatPhone(customer.phone)}
                    </div>
                  </div>
                </div>

                <div
                  className="mt-3 flex gap-4"
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "13px",
                    color: "#888780",
                  }}
                >
                  <span>
                    <span
                      className="font-bold"
                      style={{ color: "#1A1A1A" }}
                    >
                      {customer.total_jobs}
                    </span>{" "}
                    jobs
                  </span>
                  <span>
                    Last:{" "}
                    {customer.last_job_at ? fmtDate(customer.last_job_at) : "—"}
                  </span>
                </div>

                {customer.total_jobs > 1 && (
                  <div className="mt-2">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full"
                      style={{
                        background: "#EAF3DE",
                        color: "#27500A",
                        fontFamily: "var(--font-inter)",
                        fontSize: "11px",
                      }}
                    >
                      Repeat Customer
                    </span>
                  </div>
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
                  {[
                    "Customer",
                    "Phone",
                    "Email",
                    "Jobs",
                    "Last Service",
                    "Action",
                  ].map((h) => (
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
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                    style={{ borderTop: "1px solid #F3F4F6" }}
                    onClick={() =>
                      (window.location.href = `/dashboard/customers/${encodeURIComponent(customer.phone)}`)
                    }
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} size={36} />
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: "14px",
                              color: "#1A1A1A",
                              fontWeight: 500,
                            }}
                          >
                            {customer.name}
                          </div>
                          <div
                            className="truncate max-w-xs"
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize: "12px",
                              color: "#888780",
                            }}
                          >
                            {customer.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "14px",
                          color: "#4A4A4A",
                        }}
                      >
                        {formatPhone(customer.phone)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="truncate max-w-xs block"
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "13px",
                          color: "#4A4A4A",
                        }}
                      >
                        {customer.email || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold"
                          style={{
                            fontFamily: "var(--font-oswald)",
                            fontSize: "16px",
                            color: "#1A1A1A",
                          }}
                        >
                          {customer.total_jobs}
                        </span>
                        {customer.total_jobs > 1 && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full"
                            style={{
                              background: "#EAF3DE",
                              color: "#27500A",
                              fontFamily: "var(--font-inter)",
                              fontSize: "11px",
                            }}
                          >
                            Repeat
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize: "13px",
                          color: "#888780",
                        }}
                      >
                        {customer.last_job_at
                          ? fmtDate(customer.last_job_at)
                          : "—"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/customers/${encodeURIComponent(customer.phone)}`}
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
