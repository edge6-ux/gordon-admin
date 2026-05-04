"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  CalendarClock,
  ClipboardList,
  FileSignature,
  CalendarCheck2,
  MapPin,
  User,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Job } from "@/lib/types";

type Profile = { id: string; name: string; role: string };

type InboxData = {
  needsAssignment: Job[];
  needsScheduling: Job[];
  pendingReview:   Job[];
  needsQuote:      Job[];
  today:           Job[];
  profiles:        Record<string, Profile>;
};

type Section = {
  key:   keyof Omit<InboxData, "profiles">;
  label: string;
  description: string;
  icon:  React.ElementType;
  accentColor: string;
  accentBg:    string;
  actionLabel: string;
  actionHref:  (job: Job) => string;
};

const SECTIONS: Section[] = [
  {
    key:         "needsAssignment",
    label:       "Needs Crew Assignment",
    description: "Accepted jobs waiting for a crew member to be assigned.",
    icon:        UserCheck,
    accentColor: "#C0392B",
    accentBg:    "#FFF0EF",
    actionLabel: "Assign",
    actionHref:  (j) => `/dashboard/jobs/${j.id}`,
  },
  {
    key:         "needsScheduling",
    label:       "Needs Scheduling",
    description: "Crew is assigned but no date has been set.",
    icon:        CalendarClock,
    accentColor: "#C8922A",
    accentBg:    "#FFFBF0",
    actionLabel: "Schedule",
    actionHref:  () => `/dashboard/schedule`,
  },
  {
    key:         "pendingReview",
    label:       "Pending Review",
    description: "New submissions that haven't been reviewed yet.",
    icon:        ClipboardList,
    accentColor: "#185FA5",
    accentBg:    "#EFF6FF",
    actionLabel: "Review",
    actionHref:  (j) => `/dashboard/jobs/${j.id}`,
  },
  {
    key:         "needsQuote",
    label:       "Needs a Quote",
    description: "Reviewed jobs waiting for a quote to be created.",
    icon:        FileSignature,
    accentColor: "#5B21B6",
    accentBg:    "#F5F3FF",
    actionLabel: "Create Quote",
    actionHref:  (j) => `/dashboard/quotes/new?jobId=${j.id}`,
  },
  {
    key:         "today",
    label:       "Today's Jobs",
    description: "Jobs scheduled for today.",
    icon:        CalendarCheck2,
    accentColor: "#1C3A2B",
    accentBg:    "#EAF3DE",
    actionLabel: "View",
    actionHref:  (j) => `/dashboard/jobs/${j.id}`,
  },
];

function crewName(profiles: Record<string, Profile>, id: string): string {
  if (!id) return "Unassigned";
  return profiles[id]?.name ?? "Unknown";
}

function SectionCard({
  section,
  jobs,
  profiles,
}: {
  section: Section;
  jobs: Job[];
  profiles: Record<string, Profile>;
}) {
  const Icon = section.icon;
  const isEmpty = jobs.length === 0;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #D3D1C7",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: isEmpty ? "none" : "1px solid #EBEBEB",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: section.accentBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: section.accentColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-oswald)",
              fontSize: 16,
              color: "#1A1A1A",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {section.label}
            {jobs.length > 0 && (
              <span
                style={{
                  background: section.accentBg,
                  color: section.accentColor,
                  borderRadius: 20,
                  padding: "1px 8px",
                  fontSize: 12,
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                }}
              >
                {jobs.length}
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 12,
              color: "#888780",
              marginTop: 2,
            }}
          >
            {section.description}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div
          style={{
            padding: "24px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 size={16} style={{ color: "#4CAF50", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: 14,
              color: "#888780",
            }}
          >
            All clear
          </span>
        </div>
      )}

      {/* Job rows */}
      {jobs.map((job, i) => (
        <div
          key={job.id}
          style={{
            padding: "14px 20px",
            borderBottom: i < jobs.length - 1 ? "1px solid #F0F0EE" : "none",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Left: details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "#1A1A1A",
                }}
              >
                {job.customer_name}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: 11,
                  color: "#888780",
                }}
              >
                {job.reference_code}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2px 12px",
              }}
            >
              {job.property_address && (
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 12,
                    color: "#4A4A4A",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <MapPin size={11} style={{ color: "#888780" }} />
                  {job.property_address}
                </span>
              )}
              {section.key === "needsScheduling" && job.assigned_to && (
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 12,
                    color: "#4A4A4A",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <User size={11} style={{ color: "#888780" }} />
                  {crewName(profiles, job.assigned_to)}
                </span>
              )}
              {section.key === "today" && (
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 12,
                    color: "#4A4A4A",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Clock size={11} style={{ color: "#888780" }} />
                  {job.scheduled_time
                    ? formatTime(job.scheduled_time)
                    : "No time set"}
                  {job.assigned_to && ` · ${crewName(profiles, job.assigned_to)}`}
                </span>
              )}
              {(section.key === "pendingReview" || section.key === "needsQuote") && (
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: 12,
                    color: "#888780",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Clock size={11} />
                  {timeAgo(job.created_at)}
                </span>
              )}
            </div>
          </div>

          {/* Right: action link */}
          <Link
            href={section.actionHref(job)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              background: section.accentBg,
              color: section.accentColor,
              fontFamily: "var(--font-inter)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {section.actionLabel}
            <ArrowRight size={13} />
          </Link>
        </div>
      ))}
    </div>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function InboxPage() {
  const [data, setData]     = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/inbox")
      .then((r) => r.json())
      .then((d: InboxData) => { setData(d); setLoading(false); });
  }, []);

  const totalActions = data
    ? data.needsAssignment.length +
      data.needsScheduling.length +
      data.pendingReview.length +
      data.needsQuote.length
    : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: 28,
            fontWeight: 600,
            color: "#1A1A1A",
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          Inbox
        </h1>
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: 14,
            color: "#888780",
          }}
        >
          {loading
            ? "Loading…"
            : totalActions === 0
            ? "You're all caught up."
            : `${totalActions} item${totalActions !== 1 ? "s" : ""} need${totalActions === 1 ? "s" : ""} your attention.`}
        </p>
      </div>

      {/* Sections */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: 16,
                border: "1px solid #D3D1C7",
                height: 90,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SECTIONS.map((section) => (
            <SectionCard
              key={section.key}
              section={section}
              jobs={(data?.[section.key] as Job[]) ?? []}
              profiles={data?.profiles ?? {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
