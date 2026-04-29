"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SearchX,
  Briefcase,
  Users,
  FileText,
  Plus,
  UserPlus,
  HardHat,
  Loader2,
} from "lucide-react";
import type { JobStatus, Customer, Quote } from "@/lib/types";
import { formatPhone, formatCurrency } from "@/lib/utils";

// ─── Result types ─────────────────────────────────────────────────────────────

type JobResult = {
  id:               string;
  customer_name:    string;
  customer_phone:   string;
  property_address: string;
  status:           JobStatus;
  reference_code:   string;
  submission:       { service_type: string } | null;
};

type Results = {
  jobs:      JobResult[];
  customers: Customer[];
  quotes:    Quote[];
};

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<JobStatus, { bg: string; color: string; label: string }> = {
  submitted:   { bg: "#E6F1FB", color: "#185FA5", label: "Submitted"   },
  reviewed:    { bg: "#F3EFFE", color: "#5B21B6", label: "Reviewed"    },
  quoted:      { bg: "#FAEEDA", color: "#633806", label: "Quoted"      },
  assigned:    { bg: "#FFF0E6", color: "#C2410C", label: "Assigned"    },
  in_progress: { bg: "#FEF3CD", color: "#92400E", label: "In Progress" },
  complete:    { bg: "#EAF3DE", color: "#27500A", label: "Complete"    },
  cancelled:   { bg: "#F3F4F6", color: "#4A4A4A", label: "Cancelled"  },
};

const QUOTE_STATUS_CONFIG: Record<Quote["status"], { bg: string; color: string; label: string }> = {
  draft:     { bg: "#F3F4F6", color: "#4A4A4A", label: "Draft"     },
  presented: { bg: "#E6F1FB", color: "#185FA5", label: "Presented" },
  accepted:  { bg: "#EAF3DE", color: "#27500A", label: "Accepted"  },
  declined:  { bg: "#FCEBEB", color: "#791F1F", label: "Declined"  },
};

// ─── Quick links shown when query is empty ────────────────────────────────────

const QUICK_LINKS = [
  { label: "All Jobs",     href: "/dashboard/jobs",           icon: Briefcase  },
  { label: "Customers",    href: "/dashboard/customers",       icon: Users      },
  { label: "New Quote",    href: "/dashboard/quotes/new",      icon: Plus       },
  { label: "Add Customer", href: "/dashboard/customers/new",   icon: UserPlus   },
  { label: "Crew View",    href: "/dashboard/crew",            icon: HardHat    },
];

// ─── Avatar initials ──────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Row wrapper ──────────────────────────────────────────────────────────────

function ResultRow({
  onClick,
  last = false,
  children,
}: {
  onClick: () => void;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#F9F9F8] transition-colors"
      style={{ borderBottom: last ? "none" : "1px solid #F3F4F6" }}
    >
      {children}
    </button>
  );
}

// ─── Group header ─────────────────────────────────────────────────────────────

function GroupHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        padding:       "6px 16px",
        background:    "#F9F9F8",
        fontFamily:    "var(--font-inter)",
        fontSize:      "11px",
        color:         "#888780",
        textTransform: "uppercase",
        fontWeight:    600,
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </div>
  );
}

// ─── Icon circle ─────────────────────────────────────────────────────────────

function IconCircle({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ width: 36, height: 36, borderRadius: "50%", background: bg }}
    >
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function SearchModal({
  open,
  onClose,
}: {
  open:    boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setLoading(false);
    } else {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as Results;
        setResults(data);
      } catch {
        setResults({ jobs: [], customers: [], quotes: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  if (!open) return null;

  const hasResults =
    results &&
    (results.jobs.length > 0 || results.customers.length > 0 || results.quotes.length > 0);

  return (
    /* Overlay */
    <div
      style={{
        position:  "fixed",
        inset:     0,
        zIndex:    50,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      {/* Modal */}
      <div
        style={{
          position:  "fixed",
          top:       "20%",
          left:      "50%",
          transform: "translateX(-50%)",
          width:     "min(600px, 90vw)",
          background: "white",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow:  "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input row */}
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          12,
            padding:      "14px 16px",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <Search size={20} style={{ color: "#888780", flexShrink: 0 }} />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, customers, quotes..."
            style={{
              flex:       1,
              border:     "none",
              outline:    "none",
              background: "transparent",
              fontFamily: "var(--font-inter)",
              fontSize:   "16px",
              color:      "#1A1A1A",
            }}
          />

          {query === "" ? (
            <span
              style={{
                background:   "#F3F4F6",
                borderRadius: 6,
                padding:      "3px 8px",
                fontFamily:   "var(--font-inter)",
                fontSize:     "11px",
                color:        "#888780",
                flexShrink:   0,
              }}
            >
              ESC
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize:   "18px",
                color:      "#888780",
                cursor:     "pointer",
                lineHeight: 1,
                flexShrink: 0,
                background: "none",
                border:     "none",
                padding:    0,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Results area */}
        <div style={{ maxHeight: 440, overflowY: "auto" }}>

          {/* Empty state — quick links */}
          {query === "" && (
            <div style={{ padding: "16px 16px 8px" }}>
              <p
                style={{
                  fontFamily:    "var(--font-inter)",
                  fontSize:      "11px",
                  color:         "#888780",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight:    600,
                  marginBottom:  8,
                }}
              >
                Quick Links
              </p>
              {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => navigate(href)}
                  className="w-full text-left flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#F9F9F8] transition-colors"
                >
                  <Icon size={18} style={{ color: "#888780" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize:   "14px",
                      color:      "#4A4A4A",
                    }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div
              style={{
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                padding:        "32px 16px",
              }}
            >
              <Loader2 size={24} className="animate-spin" style={{ color: "#1C3A2B" }} />
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize:   "14px",
                  color:      "#888780",
                  marginTop:  12,
                }}
              >
                Searching...
              </p>
            </div>
          )}

          {/* No results */}
          {!loading && results && !hasResults && (
            <div
              style={{
                display:        "flex",
                flexDirection:  "column",
                alignItems:     "center",
                justifyContent: "center",
                padding:        "32px 16px",
              }}
            >
              <SearchX size={32} style={{ color: "#D3D1C7" }} />
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize:   "14px",
                  color:      "#888780",
                  marginTop:  8,
                }}
              >
                No results for &ldquo;{query}&rdquo;
              </p>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize:   "13px",
                  color:      "#888780",
                  marginTop:  4,
                }}
              >
                Try name, phone, or reference number
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && hasResults && (
            <>
              {/* Jobs */}
              {results.jobs.length > 0 && (
                <>
                  <GroupHeader label="Jobs" />
                  {results.jobs.map((job, i) => {
                    const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.submitted;
                    return (
                      <ResultRow
                        key={job.id}
                        onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                        last={i === results.jobs.length - 1}
                      >
                        <IconCircle bg="#EAF3DE">
                          <Briefcase size={16} style={{ color: "#1C3A2B" }} />
                        </IconCircle>
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize:   "14px",
                              fontWeight: 600,
                              color:      "#1A1A1A",
                            }}
                          >
                            {job.customer_name}
                          </p>
                          <div
                            style={{
                              display:    "flex",
                              gap:        6,
                              alignItems: "center",
                              marginTop:  2,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize:   "12px",
                                color:      "#888780",
                              }}
                            >
                              {job.reference_code}
                            </span>
                            {job.submission?.service_type && (
                              <>
                                <span style={{ color: "#D3D1C7", fontSize: "12px" }}>·</span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-inter)",
                                    fontSize:   "12px",
                                    color:      "#888780",
                                  }}
                                >
                                  {job.submission.service_type}
                                </span>
                              </>
                            )}
                          </div>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full font-medium mt-1"
                            style={{
                              background: cfg.bg,
                              color:      cfg.color,
                              fontFamily: "var(--font-inter)",
                              fontSize:   "11px",
                            }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </ResultRow>
                    );
                  })}
                </>
              )}

              {/* Customers */}
              {results.customers.length > 0 && (
                <>
                  <GroupHeader label="Customers" />
                  {results.customers.map((customer, i) => (
                    <ResultRow
                      key={customer.id}
                      onClick={() =>
                        navigate(`/dashboard/customers/${encodeURIComponent(customer.phone)}`)
                      }
                      last={i === results.customers.length - 1}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width:        36,
                          height:       36,
                          borderRadius: "50%",
                          background:   "#1C3A2B",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-oswald)",
                            fontSize:   "13px",
                            fontWeight: 700,
                            color:      "white",
                          }}
                        >
                          {initials(customer.name ?? "")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize:   "14px",
                            fontWeight: 600,
                            color:      "#1A1A1A",
                          }}
                        >
                          {customer.name}
                        </p>
                        <div
                          style={{
                            display:    "flex",
                            gap:        6,
                            alignItems: "center",
                            marginTop:  2,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize:   "12px",
                              color:      "#888780",
                            }}
                          >
                            {formatPhone(customer.phone)}
                          </span>
                          <span style={{ color: "#D3D1C7", fontSize: "12px" }}>·</span>
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize:   "12px",
                              color:      "#888780",
                            }}
                          >
                            {customer.total_jobs} {customer.total_jobs === 1 ? "job" : "jobs"}
                          </span>
                        </div>
                      </div>
                    </ResultRow>
                  ))}
                </>
              )}

              {/* Quotes */}
              {results.quotes.length > 0 && (
                <>
                  <GroupHeader label="Quotes" />
                  {results.quotes.map((quote, i) => {
                    const cfg = QUOTE_STATUS_CONFIG[quote.status];
                    return (
                      <ResultRow
                        key={quote.id}
                        onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}
                        last={i === results.quotes.length - 1}
                      >
                        <IconCircle bg="#FAEEDA">
                          <FileText size={16} style={{ color: "#C8922A" }} />
                        </IconCircle>
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize:   "14px",
                              fontWeight: 600,
                              color:      "#1A1A1A",
                            }}
                          >
                            {quote.customer_name}
                          </p>
                          <div
                            style={{
                              display:    "flex",
                              gap:        6,
                              alignItems: "center",
                              marginTop:  2,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-inter)",
                                fontSize:   "12px",
                                color:      "#888780",
                              }}
                            >
                              {formatCurrency(quote.total_cost)}
                            </span>
                            <span style={{ color: "#D3D1C7", fontSize: "12px" }}>·</span>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full font-medium"
                              style={{
                                background: cfg.bg,
                                color:      cfg.color,
                                fontFamily: "var(--font-inter)",
                                fontSize:   "11px",
                              }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                        </div>
                      </ResultRow>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
