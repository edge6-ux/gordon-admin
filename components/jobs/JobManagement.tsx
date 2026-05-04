"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import type { Job } from "@/lib/types";

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  submitted:   { bg: "#E6F1FB", color: "#185FA5", label: "Submitted" },
  reviewed:    { bg: "#F3EFFE", color: "#5B21B6", label: "Reviewed" },
  quoted:      { bg: "#FAEEDA", color: "#633806", label: "Quoted" },
  assigned:    { bg: "#FFF0E6", color: "#C2410C", label: "Assigned" },
  in_progress: { bg: "#FEF3CD", color: "#92400E", label: "In Progress" },
  complete:    { bg: "#EAF3DE", color: "#27500A", label: "Complete" },
  cancelled:   { bg: "#F3F4F6", color: "#4A4A4A", label: "Cancelled" },
};

type SaveState = "idle" | "saving" | "saved";

type Props = { job: Job };

const inputClass =
  "w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#1C3A2B] transition-colors";

const inputStyle = {
  borderColor: "#D3D1C7",
  fontFamily: "var(--font-inter)",
  fontSize: "14px",
  color: "#1A1A1A",
};

const labelStyle = {
  fontFamily: "var(--font-inter)",
  fontSize: "11px",
  color: "#888780",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

export default function JobManagement({ job }: Props) {
  const [scheduledDate, setScheduledDate] = useState(job.scheduled_date ?? "");
  const [scheduledTime, setScheduledTime] = useState(job.scheduled_time ?? "");
  const [assignedTo, setAssignedTo] = useState(job.assigned_to ?? "");
  const [internalNotes, setInternalNotes] = useState(job.internal_notes ?? "");
  const [crewNotes, setCrewNotes] = useState(job.crew_notes ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const scheduleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scheduleTimer.current) clearTimeout(scheduleTimer.current);
    };
  }, []);

  async function save(fields: Record<string, unknown>) {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }

  function handleDateChange(value: string) {
    setScheduledDate(value);
    if (scheduleTimer.current) clearTimeout(scheduleTimer.current);
    scheduleTimer.current = setTimeout(() => save({ scheduled_date: value }), 500);
  }

  function handleTimeChange(value: string) {
    setScheduledTime(value);
    if (scheduleTimer.current) clearTimeout(scheduleTimer.current);
    scheduleTimer.current = setTimeout(() => save({ scheduled_time: value }), 500);
  }

  return (
    <div
      className="bg-white rounded-2xl border p-5 mb-4"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span style={{ ...labelStyle }}>Job Management</span>
        {saveState === "saving" && (
          <Loader2 size={14} className="animate-spin" style={{ color: "#888780" }} />
        )}
        {saveState === "saved" && (
          <Check size={14} style={{ color: "#27500A" }} />
        )}
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div>
          <div className="mb-1.5" style={labelStyle}>
            Status
          </div>
          {(() => {
            const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.submitted;
            return (
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-xl font-medium"
                style={{
                  background:  cfg.bg,
                  color:       cfg.color,
                  fontFamily:  "var(--font-inter)",
                  fontSize:    "13px",
                }}
              >
                {cfg.label}
              </span>
            );
          })()}
        </div>

        {/* Schedule */}
        <div>
          <div className="mb-1.5" style={labelStyle}>
            Schedule
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <div className="mb-1.5" style={labelStyle}>
            Assigned To
          </div>
          <input
            type="text"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            onBlur={() => save({ assigned_to: assignedTo })}
            placeholder="Gordon Pro Crew"
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {/* Internal Notes */}
        <div>
          <div className="mb-1.5" style={labelStyle}>
            Internal Notes
          </div>
          <textarea
            rows={4}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            onBlur={() => save({ internal_notes: internalNotes })}
            placeholder="Add internal notes..."
            className={`${inputClass} resize-none`}
            style={inputStyle}
          />
        </div>

        {/* Crew Notes */}
        <div>
          <div className="mb-1.5" style={labelStyle}>
            Crew Notes
          </div>
          <textarea
            rows={3}
            value={crewNotes}
            onChange={(e) => setCrewNotes(e.target.value)}
            onBlur={() => save({ crew_notes: crewNotes })}
            placeholder="Notes for the crew..."
            className={`${inputClass} resize-none`}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}
