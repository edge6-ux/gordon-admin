"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Briefcase,
  LayoutDashboard,
  List,
  MapPin,
  Plus,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import type { Job, JobStatus } from "@/lib/types";
import { fmtDate, timeAgo } from "@/lib/utils";
import { usePermissions } from "@/lib/permissions-context";

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  JobStatus,
  { bg: string; color: string; label: string }
> = {
  submitted:   { bg: "#E6F1FB", color: "#185FA5", label: "Submitted"   },
  reviewed:    { bg: "#F3EFFE", color: "#5B21B6", label: "Reviewed"    },
  quoted:      { bg: "#FAEEDA", color: "#633806", label: "Quoted"      },
  assigned:    { bg: "#FFF0E6", color: "#C2410C", label: "Assigned"    },
  in_progress: { bg: "#FEF3CD", color: "#92400E", label: "In Progress" },
  complete:    { bg: "#EAF3DE", color: "#27500A", label: "Complete"    },
  cancelled:   { bg: "#F3F4F6", color: "#4A4A4A", label: "Cancelled"  },
};

const URGENCY_CONFIG: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  emergency: { bg: "#FCEBEB", color: "#791F1F", label: "Emergency" },
  soon:      { bg: "#FAEEDA", color: "#633806", label: "Soon"      },
  routine:   { bg: "#EAF3DE", color: "#27500A", label: "Routine"   },
};

const STATUS_FILTERS: { label: string; value: JobStatus | "all" }[] = [
  { label: "All",         value: "all"         },
  { label: "Submitted",   value: "submitted"   },
  { label: "Reviewed",    value: "reviewed"    },
  { label: "Quoted",      value: "quoted"      },
  { label: "Assigned",    value: "assigned"    },
  { label: "In Progress", value: "in_progress" },
  { label: "Complete",    value: "complete"    },
  { label: "Cancelled",   value: "cancelled"   },
];

const PIPELINE_STATUSES: JobStatus[] = [
  "submitted",
  "reviewed",
  "quoted",
  "assigned",
  "in_progress",
  "complete",
  "cancelled",
];

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
      style={{
        background:  cfg.bg,
        color:       cfg.color,
        fontFamily:  "var(--font-inter)",
        fontSize:    "12px",
      }}
    >
      {cfg.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const cfg = URGENCY_CONFIG[urgency?.toLowerCase()];
  if (!cfg) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full"
      style={{
        background: cfg.bg,
        color:      cfg.color,
        fontFamily: "var(--font-inter)",
        fontSize:   "11px",
      }}
    >
      {cfg.label}
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-100 rounded-2xl h-20" />
      ))}
    </div>
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function MobileCard({
  job,
  selectMode = false,
  selected = false,
  onToggle,
}: {
  job: Job;
  selectMode?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl border p-4 shadow-sm transition-colors"
      style={{
        borderColor: selected ? "#1C3A2B" : "#E5E7EB",
        background:  selected ? "#F0F4F1" : "white",
        cursor:      selectMode ? "pointer" : "default",
      }}
      onClick={selectMode ? () => onToggle?.(job.id) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        {selectMode && (
          <div className="flex-shrink-0 mt-0.5">
            {selected ? (
              <CheckSquare size={18} style={{ color: "#1C3A2B" }} />
            ) : (
              <Square size={18} style={{ color: "#888780" }} />
            )}
          </div>
        )}
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize:   "15px",
            color:      "#1A1A1A",
            fontWeight: 700,
          }}
        >
          {job.customer_name}
        </span>
        <StatusBadge status={job.status} />
      </div>

      <div
        className="mt-1"
        style={{ fontFamily: "monospace", fontSize: "12px", color: "#888780" }}
      >
        {job.reference_code}
      </div>

      <div className="mt-2 flex gap-2 flex-wrap">
        {job.submission?.service_type && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full"
            style={{
              background: "#F3F4F6",
              color:      "#4A4A4A",
              fontFamily: "var(--font-inter)",
              fontSize:   "11px",
            }}
          >
            {job.submission.service_type}
          </span>
        )}
        {job.submission?.urgency && (
          <UrgencyBadge urgency={job.submission.urgency} />
        )}
      </div>

      <div
        className="mt-2 flex items-center gap-1"
        style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
      >
        <MapPin size={12} className="flex-shrink-0" />
        {job.property_address}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}>
          {fmtDate(job.created_at)}
        </span>
        {!selectMode && (
          <Link
            href={`/dashboard/jobs/${job.id}`}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ background: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "13px" }}
          >
            View Job
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Desktop table ────────────────────────────────────────────────────────────

function DesktopTable({
  jobs,
  selectMode = false,
  selectedIds = new Set<string>(),
  onToggle,
  onSelectAll,
}: {
  jobs: Job[];
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onSelectAll?: () => void;
}) {
  const allSelected = jobs.length > 0 && jobs.every((j) => selectedIds.has(j.id));

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden"
      style={{ borderColor: "#E5E7EB" }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ background: "#F9F9F8" }}>
            {selectMode && (
              <th className="px-4 py-3" style={{ width: 44 }}>
                <button
                  type="button"
                  onClick={onSelectAll}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                >
                  {allSelected ? (
                    <CheckSquare size={16} style={{ color: "#1C3A2B" }} />
                  ) : (
                    <Square size={16} style={{ color: "#888780" }} />
                  )}
                </button>
              </th>
            )}
            {["Customer", "Reference", "Service", "Urgency", "Status", "Date", "Action"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left"
                style={{
                  fontFamily:    "var(--font-inter)",
                  fontSize:      "12px",
                  color:         "#888780",
                  textTransform: "uppercase",
                  fontWeight:    600,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const isSelected = selectedIds.has(job.id);
            return (
              <tr
                key={job.id}
                className="hover:bg-[#FAFAFA] transition-colors"
                style={{
                  borderTop:  "1px solid #F3F4F6",
                  background: isSelected ? "#F0F4F1" : undefined,
                }}
              >
                {selectMode && (
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => onToggle?.(job.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      {isSelected ? (
                        <CheckSquare size={16} style={{ color: "#1C3A2B" }} />
                      ) : (
                        <Square size={16} style={{ color: "#888780" }} />
                      )}
                    </button>
                  </td>
                )}
                <td className="px-4 py-3.5">
                  <div
                    style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#1A1A1A", fontWeight: 500 }}
                  >
                    {job.customer_name}
                  </div>
                  <div style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}>
                    {job.customer_phone}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#4A4A4A" }}>
                    {job.reference_code}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}>
                    {(job.submission?.service_type ?? "").slice(0, 24) || "—"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {job.submission?.urgency ? (
                    <UrgencyBadge urgency={job.submission.urgency} />
                  ) : (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-4 py-3.5">
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}>
                    {fmtDate(job.created_at)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#F5F5F5]"
                    style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pipeline view ────────────────────────────────────────────────────────────

function PipelineView({ jobs }: { jobs: Job[] }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: "max-content" }}>
        {PIPELINE_STATUSES.map((status) => {
          const cfg         = STATUS_CONFIG[status];
          const columnJobs  = jobs.filter((j) => j.status === status);
          return (
            <div key={status} style={{ minWidth: 220, flexShrink: 0 }}>
              <div
                className="flex items-center gap-2 pb-3 mb-3"
                style={{ borderBottom: "1px solid #E5E7EB" }}
              >
                <span
                  style={{ fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 700, color: "#1A1A1A" }}
                >
                  {cfg.label}
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color, fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 500 }}
                >
                  {columnJobs.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnJobs.length === 0 && (
                  <div
                    className="py-4 text-center"
                    style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
                  >
                    No jobs
                  </div>
                )}
                {columnJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="block bg-white rounded-xl border p-3 hover:shadow-md transition-shadow"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <div
                      className="truncate"
                      style={{ fontFamily: "var(--font-inter)", fontSize: "13px", fontWeight: 700, color: "#1A1A1A" }}
                    >
                      {job.customer_name}
                    </div>
                    <div className="mt-0.5" style={{ fontFamily: "monospace", fontSize: "10px", color: "#888780" }}>
                      {job.reference_code}
                    </div>
                    <div
                      className="mt-1 flex items-center gap-1"
                      style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#888780" }}
                    >
                      <MapPin size={10} className="flex-shrink-0" />
                      <span className="truncate">{job.property_address}</span>
                    </div>
                    {job.submission?.service_type && (
                      <div
                        className="mt-1 truncate"
                        style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#888780" }}
                      >
                        {job.submission.service_type}
                      </div>
                    )}
                    <div
                      className="mt-2 text-right"
                      style={{ fontFamily: "var(--font-inter)", fontSize: "10px", color: "#888780" }}
                    >
                      {timeAgo(job.created_at)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main content (needs Suspense for useSearchParams) ────────────────────────

function JobsContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const permissions   = usePermissions();

  const viewParam = searchParams.get("view");
  const view      = viewParam === "pipeline" ? "pipeline" : "list";

  const [jobs,          setJobs]          = useState<Job[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState<JobStatus | "all">("all");

  // Bulk-select state
  const [selectMode,    setSelectMode]    = useState(false);
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkLoading,   setBulkLoading]   = useState(false);

  useEffect(() => {
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((data: Job[]) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      job.customer_name.toLowerCase().includes(q) ||
      job.customer_phone.includes(q) ||
      job.property_address.toLowerCase().includes(q) ||
      job.reference_code.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function setView(v: "list" | "pipeline") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.replace(`/dashboard/jobs?${params.toString()}`);
  }

  // ─── Bulk-select helpers ──────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    () => setSelectedIds(new Set(filteredJobs.map((j) => j.id))),
    [filteredJobs]
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  function handleSelectAll() {
    const allSelected = filteredJobs.every((j) => selectedIds.has(j.id));
    allSelected ? clearSelection() : selectAll();
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setConfirmDelete(false);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/jobs/bulk", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "delete", ids: [...selectedIds] }),
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => !selectedIds.has(j.id)));
        exitSelectMode();
      }
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkStatus(status: JobStatus) {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/jobs/bulk", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "update", ids: [...selectedIds], fields: { status } }),
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (selectedIds.has(j.id) ? { ...j, status } : j))
        );
        clearSelection();
      }
    } finally {
      setBulkLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: selectMode ? 88 : 0 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="font-bold"
            style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
          >
            Jobs
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}>
              {jobs.length} total jobs
            </p>
            <Link
              href="/dashboard/jobs/trash"
              className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
            >
              <Trash2 size={13} />
              Trash
            </Link>
          </div>
        </div>

        {/* Right side: Select + New Job + view toggle */}
        <div className="flex items-center gap-2">
          {permissions.canBulkEditJobs && view === "list" && !selectMode && (
            <button
              type="button"
              onClick={() => setSelectMode(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-colors hover:bg-[#F5F5F5]"
              style={{
                borderColor: "#D3D1C7",
                fontFamily:  "var(--font-inter)",
                fontSize:    "13px",
                color:       "#4A4A4A",
                background:  "white",
              }}
            >
              <CheckSquare size={15} />
              Select
            </button>
          )}

          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white"
            style={{
              background:     "#1C3A2B",
              fontFamily:     "var(--font-inter)",
              fontSize:       "14px",
              textDecoration: "none",
            }}
          >
            <Plus size={16} />
            New Job
          </Link>

          {/* View toggle — desktop only */}
          <div
            className="hidden md:flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "#F1EFE8" }}
          >
            {(["list", "pipeline"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background:  view === v ? "white" : "transparent",
                  boxShadow:   view === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  fontFamily:  "var(--font-inter)",
                  fontSize:    "13px",
                  color:       view === v ? "#1A1A1A" : "#888780",
                  fontWeight:  view === v ? 500 : 400,
                }}
              >
                {v === "list" ? <List size={14} /> : <LayoutDashboard size={14} />}
                {v === "list" ? "List" : "Pipeline"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#888780" }}
        />
        <input
          type="text"
          placeholder="Search by name, phone, address, or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
          style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "14px" }}
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_FILTERS.map(({ label, value }) => {
          const isActive = statusFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className="px-3 py-1.5 rounded-full border transition-colors"
              style={{
                background:  isActive ? "#1C3A2B" : "white",
                borderColor: isActive ? "#1C3A2B" : "#D3D1C7",
                color:       isActive ? "white" : "#4A4A4A",
                fontFamily:  "var(--font-inter)",
                fontSize:    "13px",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonList />
      ) : filteredJobs.length === 0 ? (
        <div
          className="bg-white rounded-2xl border p-12 flex flex-col items-center text-center"
          style={{ borderColor: "#E5E7EB" }}
        >
          <Briefcase size={40} style={{ color: "#888780" }} />
          <p className="mt-3" style={{ fontFamily: "var(--font-inter)", fontSize: "15px", color: "#888780" }}>
            No jobs found
          </p>
          <p className="mt-1" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}>
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <>
          {/* Mobile — always list view */}
          <div className="md:hidden space-y-3">
            {filteredJobs.map((job) => (
              <MobileCard
                key={job.id}
                job={job}
                selectMode={selectMode}
                selected={selectedIds.has(job.id)}
                onToggle={toggleSelect}
              />
            ))}
          </div>

          {/* Desktop — list or pipeline */}
          <div className="hidden md:block">
            {view === "pipeline" ? (
              <PipelineView jobs={filteredJobs} />
            ) : (
              <DesktopTable
                jobs={filteredJobs}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                onSelectAll={handleSelectAll}
              />
            )}
          </div>
        </>
      )}

      {/* ─── Bulk action bar ─────────────────────────────────────────────────── */}
      {selectMode && (
        <div
          className="fixed bottom-0 left-0 md:left-60 right-0 z-50 flex items-center gap-3 px-5 py-4"
          style={{
            background: "white",
            borderTop:  "1px solid #E5E7EB",
            boxShadow:  "0 -2px 16px rgba(0,0,0,0.08)",
          }}
        >
          {/* Left: count + select-all link */}
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "14px", fontWeight: 500, color: "#1A1A1A" }}>
            {selectedIds.size} selected
          </span>

          {selectedIds.size < filteredJobs.length && (
            <button
              type="button"
              onClick={selectAll}
              style={{
                fontFamily:  "var(--font-inter)",
                fontSize:    "13px",
                color:       "#185FA5",
                background:  "none",
                border:      "none",
                cursor:      "pointer",
                padding:     0,
              }}
            >
              Select all {filteredJobs.length}
            </button>
          )}

          {/* Right: status change + delete + done */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleBulkStatus(e.target.value as JobStatus);
              }}
              disabled={selectedIds.size === 0 || bulkLoading}
              className="border rounded-lg px-3 py-1.5"
              style={{
                borderColor: "#D3D1C7",
                fontFamily:  "var(--font-inter)",
                fontSize:    "13px",
                color:       "#4A4A4A",
                cursor:      selectedIds.size === 0 ? "default" : "pointer",
              }}
            >
              <option value="">Change status…</option>
              {PIPELINE_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>

            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#E24B4A" }}>
                  Delete {selectedIds.size} {selectedIds.size === 1 ? "job" : "jobs"}?
                </span>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 rounded-lg text-white"
                  style={{
                    background:  "#E24B4A",
                    fontFamily:  "var(--font-inter)",
                    fontSize:    "13px",
                    opacity:     bulkLoading ? 0.6 : 1,
                    cursor:      bulkLoading ? "default" : "pointer",
                  }}
                >
                  {bulkLoading ? "Deleting…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={selectedIds.size === 0 || bulkLoading}
                className="px-3 py-1.5 rounded-lg border transition-colors"
                style={{
                  borderColor: selectedIds.size > 0 ? "#E24B4A" : "#D3D1C7",
                  color:       selectedIds.size > 0 ? "#E24B4A" : "#888780",
                  fontFamily:  "var(--font-inter)",
                  fontSize:    "13px",
                  background:  "white",
                  cursor:      selectedIds.size === 0 ? "default" : "pointer",
                }}
              >
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={exitSelectMode}
              className="px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page export with Suspense boundary for useSearchParams ───────────────────

export default function JobsPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <JobsContent />
    </Suspense>
  );
}
