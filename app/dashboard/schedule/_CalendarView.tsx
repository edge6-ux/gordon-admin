"use client";

import { useEffect, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import { X, MapPin, Phone, User, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/lib/types";
import type { ScheduleMode } from "./page";

type UserProfile = {
  id:    string;
  name:  string | null;
  email: string;
  role:  string;
};

const PALETTE = [
  "#C8922A", "#2D7DD2", "#D64933", "#4CAF50",
  "#9C27B0", "#FF6B35", "#00ACC1", "#6D4C41",
];
const UNASSIGNED_COLOR = "#888780";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted", reviewed: "Reviewed", quoted: "Quoted",
  assigned: "Assigned", in_progress: "In Progress",
  complete: "Complete", cancelled: "Cancelled",
};
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  submitted:   { bg: "#EAF3DE", color: "#1C3A2B" },
  reviewed:    { bg: "#FFF3CD", color: "#856404" },
  quoted:      { bg: "#E8F4FD", color: "#1A6496" },
  assigned:    { bg: "#D4EDDA", color: "#155724" },
  in_progress: { bg: "#CCE5FF", color: "#004085" },
  complete:    { bg: "#D1ECF1", color: "#0C5460" },
  cancelled:   { bg: "#F8D7DA", color: "#721C24" },
};

const QUOTE_STATUSES = ["submitted", "reviewed", "quoted"];
const JOB_STATUSES   = ["assigned", "in_progress"];

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function CalendarView({ mode }: { mode: ScheduleMode }) {
  const [jobs,        setJobs]        = useState<Job[]>([]);
  const [users,       setUsers]       = useState<UserProfile[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/jobs").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]).then(([jobsData, usersData]) => {
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLoading(false);
    });
  }, []);

  // Close panel when switching modes
  useEffect(() => { setSelectedJob(null); }, [mode]);

  const relevantStatuses = mode === "quotes" ? QUOTE_STATUSES : JOB_STATUSES;

  // Users shown in legend — salespeople for quote mode, crew leaders for job mode
  const legendUsers = useMemo(
    () => users.filter((u) =>
      mode === "quotes" ? u.role === "sales" : u.role === "crew_leader"
    ),
    [users, mode]
  );

  // Color map covers all users so any assigned_to is colored correctly
  const crewColorMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u, i) => map.set(u.id, PALETTE[i % PALETTE.length]));
    return map;
  }, [users]);

  function userName(id: string | null) {
    if (!id) return "Unassigned";
    return users.find((u) => u.id === id)?.name ?? "Unknown";
  }

  const filteredJobs = useMemo(
    () => jobs.filter((j) => relevantStatuses.includes(j.status)),
    [jobs, relevantStatuses]
  );

  const conflictIds = useMemo(() => {
    const scheduled = filteredJobs.filter((j) => j.scheduled_date && j.assigned_to);
    const ids = new Set<string>();
    for (let i = 0; i < scheduled.length; i++) {
      for (let k = i + 1; k < scheduled.length; k++) {
        const a = scheduled[i], b = scheduled[k];
        if (a.assigned_to !== b.assigned_to) continue;
        if (a.scheduled_date !== b.scheduled_date) continue;
        if (a.scheduled_time && b.scheduled_time) {
          const diff = Math.abs(timeToMinutes(a.scheduled_time) - timeToMinutes(b.scheduled_time));
          if (diff >= 240) continue;
        }
        ids.add(a.id);
        ids.add(b.id);
      }
    }
    return ids;
  }, [filteredJobs]);

  const events: EventInput[] = useMemo(
    () =>
      filteredJobs
        .filter((j) => j.scheduled_date)
        .map((j) => ({
          id:              j.id,
          title:           j.customer_name,
          start:           j.scheduled_time
                             ? `${j.scheduled_date}T${j.scheduled_time}`
                             : j.scheduled_date!,
          allDay:          !j.scheduled_time,
          backgroundColor: j.assigned_to
                             ? (crewColorMap.get(j.assigned_to) ?? UNASSIGNED_COLOR)
                             : UNASSIGNED_COLOR,
          borderColor:     conflictIds.has(j.id) ? "#FF3B30" : "transparent",
          textColor:       "#fff",
          extendedProps:   { job: j, hasConflict: conflictIds.has(j.id) },
        })),
    [filteredJobs, crewColorMap, conflictIds]
  );

  const unscheduled = useMemo(
    () => filteredJobs.filter((j) => !j.scheduled_date),
    [filteredJobs]
  );

  async function handleEventDrop({ event, revert }: EventDropArg) {
    const job   = event.extendedProps.job as Job;
    const start = event.start!;
    const newDate = start.toISOString().split("T")[0];
    const newTime = event.allDay
      ? null
      : `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;

    const body: Record<string, string | null> = { scheduled_date: newDate };
    if (newTime) body.scheduled_time = newTime;

    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      revert();
    } else {
      const updated = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));
      if (selectedJob?.id === updated.id) setSelectedJob((s) => s && { ...s, ...updated });
    }
  }

  function handleEventClick({ event }: EventClickArg) {
    setSelectedJob(event.extendedProps.job as Job);
  }

  if (loading) {
    return (
      <div
        style={{
          height: 480,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          borderRadius: 16,
          border: "1px solid #D3D1C7",
        }}
      >
        <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#888780" }}>
          Loading schedule…
        </span>
      </div>
    );
  }

  const conflictPairs = conflictIds.size / 2;
  const isQuotes      = mode === "quotes";
  const assignedLabel = isQuotes ? "Salesperson" : "Crew Leader";
  const panelTitle    = isQuotes ? "Quote Details" : "Job Details";
  const needsLabel    = isQuotes ? "Quote Visits to Schedule" : "Needs Scheduling";
  const noDateMsg     = isQuotes
    ? "No date set — open the job to schedule a quote visit."
    : "No date set — open the job to schedule it.";

  return (
    <div style={{ display: "flex", gap: 0, position: "relative" }}>
      <div style={{ flex: 1, minWidth: 0, marginRight: selectedJob ? 376 : 0, transition: "margin-right 0.2s" }}>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
          {legendUsers.map((u, i) => (
            <div key={u.id} className="flex items-center gap-1.5">
              <div
                style={{
                  width: 10, height: 10,
                  borderRadius: "50%",
                  background: crewColorMap.get(u.id) ?? PALETTE[i % PALETTE.length],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A" }}>
                {u.name ?? u.email}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: UNASSIGNED_COLOR }} />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A" }}>Unassigned</span>
          </div>
          {conflictIds.size > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              <AlertTriangle size={12} style={{ color: "#FF3B30" }} />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#FF3B30" }}>
                {conflictPairs} conflict{conflictPairs !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #D3D1C7",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            padding: 16,
          }}
        >
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left:   "prev,next today",
              center: "title",
              right:  "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
            }}
            buttonText={{ today: "Today", month: "Month", week: "Week", day: "Day", list: "List" }}
            height="auto"
            events={events}
            editable
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            defaultTimedEventDuration="02:00"
            dayMaxEvents={4}
            nowIndicator
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            eventContent={(arg) => {
              const hasConflict = arg.event.extendedProps.hasConflict as boolean;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 5px", overflow: "hidden" }}>
                  {hasConflict && <AlertTriangle size={10} style={{ flexShrink: 0, color: "#FFE4E4" }} />}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                    {arg.event.title}
                  </span>
                </div>
              );
            }}
          />
        </div>

        {/* Unscheduled */}
        {unscheduled.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-oswald)", fontSize: 18, color: "#1A1A1A" }}>
                {needsLabel}
              </span>
              <span
                style={{
                  background: "#FFF3CD", color: "#856404",
                  borderRadius: 20, padding: "2px 9px",
                  fontSize: 12, fontFamily: "var(--font-inter)", fontWeight: 500,
                }}
              >
                {unscheduled.length}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12,
              }}
            >
              {unscheduled.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  style={{
                    background: "white",
                    border: "1px solid #D3D1C7",
                    borderRadius: 12,
                    padding: 16,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{ fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>
                    {j.customer_name}
                  </div>
                  <div style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#888780", marginTop: 2 }}>
                    {j.reference_code}
                  </div>
                  {j.property_address && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <MapPin size={11} style={{ color: "#888780", flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A" }}>
                        {j.property_address}
                      </span>
                    </div>
                  )}
                  {j.assigned_to && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <User size={11} style={{ color: "#888780", flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A" }}>
                        {userName(j.assigned_to)}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedJob && (
        <div
          style={{
            position: "fixed",
            top: 0, right: 0, bottom: 0,
            width: 360,
            background: "white",
            borderLeft: "1px solid #D3D1C7",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
            zIndex: 50,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid #D3D1C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontFamily: "var(--font-oswald)", fontSize: 18, color: "#1A1A1A" }}>
              {panelTitle}
            </span>
            <button
              onClick={() => setSelectedJob(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}
            >
              <X size={18} style={{ color: "#888780" }} />
            </button>
          </div>

          {/* Panel body */}
          <div style={{ padding: 20, flex: 1 }}>
            <div
              style={{
                display: "inline-block",
                background: STATUS_STYLES[selectedJob.status]?.bg ?? "#eee",
                color:      STATUS_STYLES[selectedJob.status]?.color ?? "#333",
                borderRadius: 20,
                padding: "3px 10px",
                fontFamily: "var(--font-inter)",
                fontSize: 12, fontWeight: 500,
                marginBottom: 14,
              }}
            >
              {STATUS_LABELS[selectedJob.status] ?? selectedJob.status}
            </div>

            <div style={{ fontFamily: "var(--font-inter)", fontWeight: 700, fontSize: 20, color: "#1A1A1A", marginBottom: 4 }}>
              {selectedJob.customer_name}
            </div>
            <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#888780", marginBottom: 20 }}>
              {selectedJob.reference_code}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {selectedJob.property_address && (
                <div className="flex items-start gap-3">
                  <MapPin size={15} style={{ color: "#888780", marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#1A1A1A" }}>
                    {selectedJob.property_address}
                  </span>
                </div>
              )}
              {selectedJob.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone size={15} style={{ color: "#888780", flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#1A1A1A" }}>
                    {selectedJob.customer_phone}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <User size={15} style={{ color: "#888780", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#1A1A1A" }}>
                  {userName(selectedJob.assigned_to)} · {assignedLabel}
                </span>
              </div>

              {selectedJob.scheduled_date ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 14, flexShrink: 0 }}>📅</span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#1A1A1A" }}>
                    {new Date(selectedJob.scheduled_date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "short", month: "long", day: "numeric", year: "numeric",
                    })}
                    {selectedJob.scheduled_time && (
                      <span style={{ color: "#888780" }}>
                        {" "}@ {formatTime(selectedJob.scheduled_time)}
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: "#FFF3CD", border: "1px solid #FAEEDA",
                    borderRadius: 8, padding: "10px 12px",
                    fontFamily: "var(--font-inter)", fontSize: 13, color: "#856404",
                    display: "flex", alignItems: "flex-start", gap: 8,
                  }}
                >
                  <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  {noDateMsg}
                </div>
              )}

              {conflictIds.has(selectedJob.id) && (
                <div
                  style={{
                    background: "#FFE5E5", border: "1px solid #FFCCCC",
                    borderRadius: 8, padding: "10px 12px",
                    fontFamily: "var(--font-inter)", fontSize: 13, color: "#C0392B",
                    display: "flex", alignItems: "flex-start", gap: 8,
                  }}
                >
                  <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  Scheduling conflict — {userName(selectedJob.assigned_to)} has another appointment at this time.
                </div>
              )}
            </div>

            {isQuotes && selectedJob.internal_notes && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600,
                    color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
                  }}
                >
                  Internal Notes
                </div>
                <div style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#1A1A1A", lineHeight: 1.55 }}>
                  {selectedJob.internal_notes}
                </div>
              </div>
            )}

            {!isQuotes && selectedJob.crew_notes && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 600,
                    color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
                  }}
                >
                  Crew Notes
                </div>
                <div style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#1A1A1A", lineHeight: 1.55 }}>
                  {selectedJob.crew_notes}
                </div>
              </div>
            )}
          </div>

          {/* Panel footer */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid #D3D1C7" }}>
            <Link
              href={`/dashboard/jobs/${selectedJob.id}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#1C3A2B", color: "white",
                borderRadius: 10, padding: "11px 16px",
                fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {isQuotes ? "Open Job / Schedule Visit" : "View Full Job"}
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
