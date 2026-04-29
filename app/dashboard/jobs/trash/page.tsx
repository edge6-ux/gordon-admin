"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, RotateCcw, Clock } from "lucide-react";
import type { Job, JobStatus } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<JobStatus, { bg: string; color: string; label: string }> = {
  submitted:   { bg: "#E6F1FB", color: "#185FA5", label: "Submitted"   },
  reviewed:    { bg: "#F3EFFE", color: "#5B21B6", label: "Reviewed"    },
  quoted:      { bg: "#FAEEDA", color: "#633806", label: "Quoted"      },
  assigned:    { bg: "#FFF0E6", color: "#C2410C", label: "Assigned"    },
  in_progress: { bg: "#FEF3CD", color: "#92400E", label: "In Progress" },
  complete:    { bg: "#EAF3DE", color: "#27500A", label: "Complete"    },
  cancelled:   { bg: "#F3F4F6", color: "#4A4A4A", label: "Cancelled"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysRemaining(deletedAt: string): number {
  const ms = 30 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(deletedAt).getTime());
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function ExpiryBadge({ deletedAt }: { deletedAt: string }) {
  const days = daysRemaining(deletedAt);
  let bg    = "#F3F4F6";
  let color = "#4A4A4A";
  let label = `${days}d left`;

  if (days <= 3) {
    bg    = "#FCEBEB";
    color = "#791F1F";
    label = days === 0 ? "Expires today" : `${days}d left`;
  } else if (days <= 7) {
    bg    = "#FEF3CD";
    color = "#92400E";
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: bg, color, fontFamily: "var(--font-inter)", fontSize: "11px" }}
    >
      <Clock size={10} />
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrashPage() {
  const [jobs,       setJobs]       = useState<Job[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string | null>(null);
  const [restoreAll, setRestoreAll] = useState(false);
  const [emptyConfirm, setEmptyConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/jobs/trash")
      .then((r) => r.json())
      .then((data: Job[]) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function setProcessingFor(ids: string[], on: boolean) {
    setProcessing((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  async function restore(ids: string[]) {
    setProcessingFor(ids, true);
    await fetch("/api/admin/jobs/trash", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "restore", ids }),
    });
    setJobs((prev) => prev.filter((j) => !ids.includes(j.id)));
    setProcessingFor(ids, false);
  }

  async function deletePermanently(ids: string[]) {
    setProcessingFor(ids, true);
    await fetch("/api/admin/jobs/trash", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "delete", ids }),
    });
    setJobs((prev) => prev.filter((j) => !ids.includes(j.id)));
    setProcessingFor(ids, false);
    setConfirming(null);
    setEmptyConfirm(false);
  }

  const allIds = jobs.map((j) => j.id);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
            >
              <ArrowLeft size={14} />
              Jobs
            </Link>
          </div>
          <h1
            className="font-bold flex items-center gap-2"
            style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
          >
            <Trash2 size={22} style={{ color: "#888780" }} />
            Trash
          </h1>
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
          >
            {jobs.length} {jobs.length === 1 ? "job" : "jobs"} · Items are permanently deleted after 30 days
          </p>
        </div>

        {/* Bulk actions */}
        {jobs.length > 0 && (
          <div className="flex items-center gap-2">
            {restoreAll ? (
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}>
                  Restore all {jobs.length} jobs?
                </span>
                <button
                  type="button"
                  onClick={async () => { setRestoreAll(false); await restore(allIds); }}
                  className="px-3 py-1.5 rounded-lg text-white"
                  style={{ background: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "13px" }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreAll(false)}
                  className="px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
                >
                  Cancel
                </button>
              </div>
            ) : emptyConfirm ? (
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#E24B4A" }}>
                  Permanently delete all {jobs.length} jobs?
                </span>
                <button
                  type="button"
                  onClick={() => deletePermanently(allIds)}
                  className="px-3 py-1.5 rounded-lg text-white"
                  style={{ background: "#E24B4A", fontFamily: "var(--font-inter)", fontSize: "13px" }}
                >
                  Empty Trash
                </button>
                <button
                  type="button"
                  onClick={() => setEmptyConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRestoreAll(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#F5F5F5]"
                  style={{ borderColor: "#1C3A2B", color: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "13px" }}
                >
                  <RotateCcw size={13} />
                  Restore All
                </button>
                <button
                  type="button"
                  onClick={() => setEmptyConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors hover:bg-[#FEF2F2]"
                  style={{ borderColor: "#E24B4A", color: "#E24B4A", fontFamily: "var(--font-inter)", fontSize: "13px" }}
                >
                  <Trash2 size={13} />
                  Empty Trash
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-gray-100 rounded-2xl h-16" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div
          className="bg-white rounded-2xl border p-16 flex flex-col items-center text-center"
          style={{ borderColor: "#E5E7EB" }}
        >
          <Trash2 size={40} style={{ color: "#D1D5DB" }} />
          <p className="mt-3" style={{ fontFamily: "var(--font-inter)", fontSize: "15px", color: "#888780" }}>
            Trash is empty
          </p>
          <p className="mt-1" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}>
            Deleted jobs will appear here for 30 days
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F9F9F8" }}>
                  {["Customer", "Reference", "Status", "Deleted", "Expires", ""].map((h) => (
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
                  const isProcessing = processing.has(job.id);
                  const isConfirming = confirming === job.id;
                  const cfg = STATUS_CONFIG[job.status];
                  return (
                    <tr
                      key={job.id}
                      className="transition-colors"
                      style={{ borderTop: "1px solid #F3F4F6", opacity: isProcessing ? 0.5 : 1 }}
                    >
                      <td className="px-4 py-3.5">
                        <div style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#1A1A1A", fontWeight: 500 }}>
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
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full font-medium"
                          style={{ background: cfg.bg, color: cfg.color, fontFamily: "var(--font-inter)", fontSize: "12px" }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}>
                          {job.deleted_at ? fmtDate(job.deleted_at) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {job.deleted_at && <ExpiryBadge deletedAt={job.deleted_at} />}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          {isConfirming ? (
                            <>
                              <span style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#E24B4A" }}>
                                Delete forever?
                              </span>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => deletePermanently([job.id])}
                                className="px-2.5 py-1 rounded-lg text-white"
                                style={{ background: "#E24B4A", fontFamily: "var(--font-inter)", fontSize: "12px" }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirming(null)}
                                className="px-2.5 py-1 rounded-lg border"
                                style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "12px", color: "#4A4A4A" }}
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => restore([job.id])}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors hover:bg-[#F0F4F1]"
                                style={{ borderColor: "#1C3A2B", color: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "12px" }}
                              >
                                <RotateCcw size={12} />
                                Restore
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => setConfirming(job.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors hover:bg-[#FEF2F2]"
                                style={{ borderColor: "#E24B4A", color: "#E24B4A", fontFamily: "var(--font-inter)", fontSize: "12px" }}
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {jobs.map((job) => {
              const isProcessing = processing.has(job.id);
              const isConfirming = confirming === job.id;
              const cfg = STATUS_CONFIG[job.status];
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border p-4 shadow-sm"
                  style={{ borderColor: "#E5E7EB", opacity: isProcessing ? 0.5 : 1 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: "15px", color: "#1A1A1A", fontWeight: 700 }}>
                      {job.customer_name}
                    </span>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
                      style={{ background: cfg.bg, color: cfg.color, fontFamily: "var(--font-inter)", fontSize: "12px" }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#888780" }}>
                      {job.reference_code}
                    </span>
                    {job.deleted_at && <ExpiryBadge deletedAt={job.deleted_at} />}
                  </div>
                  <div
                    className="mt-1"
                    style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
                  >
                    Deleted {job.deleted_at ? fmtDate(job.deleted_at) : ""}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {isConfirming ? (
                      <>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#E24B4A" }}>
                          Delete forever?
                        </span>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => deletePermanently([job.id])}
                          className="px-3 py-1.5 rounded-lg text-white"
                          style={{ background: "#E24B4A", fontFamily: "var(--font-inter)", fontSize: "13px" }}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => restore([job.id])}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "#1C3A2B", color: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "13px" }}
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setConfirming(job.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ml-auto"
                          style={{ borderColor: "#E24B4A", color: "#E24B4A", fontFamily: "var(--font-inter)", fontSize: "13px" }}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
