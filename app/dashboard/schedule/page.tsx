"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus } from "lucide-react";

const CalendarView = dynamic(() => import("./_CalendarView"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 480,
        background: "white",
        borderRadius: 16,
        border: "1px solid #D3D1C7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#888780" }}>
        Loading schedule…
      </span>
    </div>
  ),
});

export type ScheduleMode = "quotes" | "jobs";

function SchedulePageInner() {
  const searchParams  = useSearchParams();
  const focusJobId    = searchParams.get("jobId") ?? undefined;
  const [mode, setMode] = useState<ScheduleMode>("jobs");

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: 28,
            fontWeight: 600,
            color: "#1A1A1A",
            lineHeight: 1,
          }}
        >
          Schedule
        </h1>
        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-2"
          style={{
            background: "#1C3A2B",
            color: "white",
            borderRadius: 10,
            padding: "9px 16px",
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Plus size={16} />
          New Job
        </Link>
      </div>

      {/* Mode toggle */}
      <div
        style={{
          display: "inline-flex",
          background: "#F3F4F6",
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
          gap: 2,
        }}
      >
        {([
          { value: "quotes", label: "Quote Schedule" },
          { value: "jobs",   label: "Job Schedule"   },
        ] as const).map(({ value, label }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              onClick={() => setMode(value)}
              style={{
                padding: "8px 18px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-inter)",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                background: active ? "white" : "transparent",
                color: active ? "#1A1A1A" : "#888780",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <CalendarView mode={mode} focusJobId={focusJobId} />
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <SchedulePageInner />
    </Suspense>
  );
}
