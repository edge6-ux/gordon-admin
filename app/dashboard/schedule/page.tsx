"use client";

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

export default function SchedulePage() {
  return (
    <div>
      {/* Page header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 24 }}
      >
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

      <CalendarView />
    </div>
  );
}
