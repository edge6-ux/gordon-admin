"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Hammer,
  Clock,
  MapPin,
  HardHat,
  Phone,
  CheckCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Job, Submission, JobStatus } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobWithSub = Job & { submission: Submission | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function parseDateParts(dateStr: string): { month: string; day: number } {
  const [year, monthIdx, day] = dateStr.split("-").map(Number);
  const d = new Date(year, monthIdx - 1, day);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day,
  };
}

function googleMapsUrl(address: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, "")}`;
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isInProgress = status === "in_progress";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full font-medium"
      style={{
        background: isInProgress ? "#FEF3C7" : "#EAF3DE",
        color: isInProgress ? "#C8922A" : "#27500A",
        fontFamily: "var(--font-inter)",
        fontSize: "11px",
      }}
    >
      {isInProgress ? "In Progress" : "Assigned"}
    </span>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
}

function StatCard({ icon, iconBg, value, label }: StatCardProps) {
  return (
    <div
      className="bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-3"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-full"
        style={{ width: 40, height: 40, background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <div
          className="font-bold"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "28px", color: "#1A1A1A", lineHeight: 1 }}
        >
          {value}
        </div>
        <div
          style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780", marginTop: 2 }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Today job card ───────────────────────────────────────────────────────────

interface TodayJobCardProps {
  job: JobWithSub;
  updating: boolean;
  onUpdateStatus: (id: string, status: JobStatus) => void;
}

function TodayJobCard({ job, updating, onUpdateStatus }: TodayJobCardProps) {
  const borderColor = job.status === "in_progress" ? "#C8922A" : "#1C3A2B";
  const serviceType = job.submission?.service_type || "Tree Service";

  return (
    <div
      className="bg-white rounded-2xl border shadow-sm mb-3 overflow-hidden"
      style={{
        borderColor: "#E5E7EB",
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <StatusBadge status={job.status} />
            <h3
              className="font-bold mt-1 truncate"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1A1A1A" }}
            >
              {job.customer_name}
            </h3>
            <p
              className="mt-0.5"
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}
            >
              {serviceType}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div
              className="font-bold"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1C3A2B" }}
            >
              {job.scheduled_time ?? "Time TBD"}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-3" style={{ borderTop: "1px solid #F3F4F6" }} />

        {/* Details */}
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} style={{ color: "#888780", flexShrink: 0 }} />
            <span
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}
            >
              {job.property_address}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardHat size={14} style={{ color: "#888780", flexShrink: 0 }} />
            <span
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}
            >
              {job.assigned_to || "Unassigned"}
            </span>
          </div>
        </div>

        {/* Crew notes */}
        {job.crew_notes?.trim() && (
          <div
            className="mt-3 rounded-xl px-3 py-2.5"
            style={{ background: "#F9F9F8" }}
          >
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                color: "#4A4A4A",
                fontStyle: "italic",
              }}
            >
              {job.crew_notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {/* Get Directions */}
          <a
            href={googleMapsUrl(job.property_address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium"
            style={{
              background: "#1C3A2B",
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              minHeight: 44,
            }}
          >
            <MapPin size={14} />
            Get Directions
          </a>

          {/* Call Customer */}
          <a
            href={telHref(job.customer_phone)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border"
            style={{
              borderColor: "#1C3A2B",
              color: "#1C3A2B",
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              background: "white",
              minHeight: 44,
            }}
          >
            <Phone size={14} />
            Call Customer
          </a>

          {/* Mark In Progress */}
          {job.status === "assigned" && (
            <button
              type="button"
              onClick={() => onUpdateStatus(job.id, "in_progress")}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-opacity disabled:opacity-60"
              style={{
                borderColor: "#C8922A",
                color: "#C8922A",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                background: "white",
                minHeight: 44,
              }}
            >
              {updating ? <Loader2 size={14} className="animate-spin" /> : <Hammer size={14} />}
              Mark In Progress
            </button>
          )}

          {/* Mark Complete */}
          {job.status === "in_progress" && (
            <button
              type="button"
              onClick={() => onUpdateStatus(job.id, "complete")}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-opacity disabled:opacity-60"
              style={{
                background: "#C8922A",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                minHeight: 44,
              }}
            >
              {updating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming job card ────────────────────────────────────────────────────────

function UpcomingJobCard({ job }: { job: JobWithSub }) {
  const { month, day } = parseDateParts(job.scheduled_date!);
  const serviceType = job.submission?.service_type || "Tree Service";

  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className="flex items-center gap-4 bg-white rounded-2xl border p-4 shadow-sm"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* Date block */}
      <div
        className="flex-shrink-0 rounded-xl px-3 py-2 text-center"
        style={{ background: "#F5F2ED", width: 56 }}
      >
        <div
          className="uppercase"
          style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#888780" }}
        >
          {month}
        </div>
        <div
          className="font-bold"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "22px", color: "#1A1A1A", lineHeight: 1.1 }}
        >
          {day}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="font-bold truncate"
          style={{ fontFamily: "var(--font-inter)", fontSize: "15px", color: "#1A1A1A" }}
        >
          {job.customer_name}
        </div>
        <div
          className="mt-0.5"
          style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
        >
          {serviceType}
        </div>
        <div
          className="flex items-center gap-1 mt-0.5"
          style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
        >
          <MapPin size={10} style={{ flexShrink: 0 }} />
          <span className="truncate">{job.property_address}</span>
        </div>
        {job.scheduled_time && (
          <div
            className="mt-1 font-medium"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#1C3A2B" }}
          >
            {job.scheduled_time}
          </div>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={18} style={{ color: "#D3D1C7", flexShrink: 0 }} />
    </Link>
  );
}

// ─── Unscheduled job card ─────────────────────────────────────────────────────

function UnscheduledJobCard({ job }: { job: JobWithSub }) {
  const serviceType = job.submission?.service_type || "Tree Service";

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4"
      style={{ border: "1.5px solid #FCEBEB" }}
    >
      <div className="min-w-0">
        <div
          className="font-bold truncate"
          style={{ fontFamily: "var(--font-inter)", fontSize: "15px", color: "#1A1A1A" }}
        >
          {job.customer_name}
        </div>
        <div
          className="mt-0.5"
          style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
        >
          {serviceType}
        </div>
        <div
          className="mt-0.5 truncate"
          style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
        >
          {job.property_address}
        </div>
        <div
          className="flex items-center gap-1 mt-2"
          style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#E24B4A" }}
        >
          <Clock size={12} style={{ flexShrink: 0 }} />
          Waiting to be scheduled
        </div>
      </div>

      <Link
        href={`/dashboard/jobs/${job.id}`}
        className="flex-shrink-0 px-3 py-2 rounded-xl text-white font-medium"
        style={{
          background: "#1C3A2B",
          fontFamily: "var(--font-inter)",
          fontSize: "13px",
          minHeight: 44,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        Schedule
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CrewPage() {
  const [jobs, setJobs]       = useState<JobWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const todayStr = getTodayStr();

  const headerDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crew");
      const data = (await res.json()) as JobWithSub[];
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  async function updateStatus(jobId: string, status: JobStatus) {
    setUpdating(jobId);
    try {
      await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadJobs();
    } finally {
      setUpdating(null);
    }
  }

  // Filtered views
  const todayJobs       = jobs.filter((j) => j.scheduled_date === todayStr);
  const upcomingJobs    = jobs.filter((j) => j.scheduled_date && j.scheduled_date > todayStr);
  const unscheduledJobs = jobs.filter((j) => j.status === "assigned" && !j.scheduled_date);

  // Stats
  const assignedTodayCount = todayJobs.length;
  const inProgressCount    = jobs.filter((j) => j.status === "in_progress").length;
  const unscheduledCount   = unscheduledJobs.length;

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "#1C3A2B" }} />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="font-bold"
            style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}
          >
            Crew
          </h1>
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
          >
            {jobs.length} active job{jobs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span
          className="font-medium"
          style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}
        >
          {headerDate}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Calendar size={18} style={{ color: "#C8922A" }} />}
          iconBg="#FEF3C7"
          value={assignedTodayCount}
          label="Assigned Today"
        />
        <StatCard
          icon={<Hammer size={18} style={{ color: "#16A34A" }} />}
          iconBg="#F0FDF4"
          value={inProgressCount}
          label="In Progress"
        />
        <StatCard
          icon={<Clock size={18} style={{ color: "#E24B4A" }} />}
          iconBg="#FCEBEB"
          value={unscheduledCount}
          label="Unscheduled"
        />
      </div>

      {/* ── Today's Jobs ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-bold"
            style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1A1A1A" }}
          >
            {"Today's Jobs"}
          </h2>
          <span
            className="px-3 py-1 rounded-full"
            style={{
              background: "#EAF3DE",
              color: "#27500A",
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
            }}
          >
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </span>
        </div>

        {todayJobs.length === 0 ? (
          <div
            className="bg-white rounded-2xl border p-8 text-center"
            style={{ borderColor: "#E5E7EB" }}
          >
            <Calendar size={32} style={{ color: "#D3D1C7", margin: "0 auto" }} />
            <p
              className="mt-2"
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
            >
              No jobs scheduled for today
            </p>
          </div>
        ) : (
          todayJobs.map((job) => (
            <TodayJobCard
              key={job.id}
              job={job}
              updating={updating === job.id}
              onUpdateStatus={updateStatus}
            />
          ))
        )}
      </div>

      {/* ── Upcoming Jobs ────────────────────────────────────────────────────── */}
      <div className="mt-8">
        <h2
          className="font-bold mb-4"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1A1A1A" }}
        >
          Upcoming
        </h2>

        {upcomingJobs.length === 0 ? (
          <div
            className="bg-white rounded-2xl border p-6 text-center"
            style={{ borderColor: "#E5E7EB" }}
          >
            <p
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
            >
              No upcoming jobs scheduled
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingJobs.map((job) => (
              <UpcomingJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      {/* ── Unscheduled Jobs ─────────────────────────────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-bold"
            style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1A1A1A" }}
          >
            Needs Scheduling
          </h2>
          {unscheduledCount > 0 && (
            <span
              className="font-bold px-2.5 py-1 rounded-full"
              style={{
                background: "#FCEBEB",
                color: "#791F1F",
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
              }}
            >
              {unscheduledCount}
            </span>
          )}
        </div>

        {unscheduledJobs.length === 0 ? (
          <p
            style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#16A34A" }}
          >
            ✓ All assigned jobs are scheduled
          </p>
        ) : (
          <div className="space-y-3">
            {unscheduledJobs.map((job) => (
              <UnscheduledJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
