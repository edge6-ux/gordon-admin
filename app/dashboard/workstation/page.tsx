"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserCheck, ClipboardList, FileSignature, FileCheck,
  CalendarCheck2, MapPin, User, Clock, ArrowRight,
  CheckCircle2, FileText, Users, AlertTriangle,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Job } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile    = { id: string; name: string; role: string };
type QuoteRow   = { id: string; customer_name: string; status: string; total_cost: number; created_at: string };
type CrewMember = { id: string; name: string; role: string };

type AdminData = {
  role: "master_admin" | "admin";
  sections: {
    readyToAssign:      Job[];
    awaitingAcceptance: Job[];
    pendingReview:      Job[];
    needsQuote:         Job[];
    today:              Job[];
  };
  profiles: Record<string, Profile>;
};

type SalesData = {
  role: "sales";
  queue:        Job[];
  activeQuotes: QuoteRow[];
};

type CrewLeaderData = {
  role:        "crew_leader";
  userId:      string;
  jobs:        Job[];
  crewMembers: CrewMember[];
};

type CrewMemberData = {
  role:     "crew_member";
  userId:   string;
  jobs:     Job[];
  profiles: Record<string, Profile>;
};

type WorkstationData = AdminData | SalesData | CrewLeaderData | CrewMemberData;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function crewName(profiles: Record<string, Profile>, id: string): string {
  if (!id) return "Unassigned";
  return profiles[id]?.name ?? "Unknown";
}

function EmptyRow({ message = "All clear" }: { message?: string }) {
  return (
    <div style={{ padding: "20px 20px", display: "flex", alignItems: "center", gap: 10 }}>
      <CheckCircle2 size={15} style={{ color: "#4CAF50", flexShrink: 0 }} />
      <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#888780" }}>{message}</span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "white", border: "1px solid #D3D1C7",
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon, label, count, accentColor, accentBg, description,
}: {
  icon: React.ElementType; label: string; count?: number;
  accentColor: string; accentBg: string; description: string;
}) {
  return (
    <div style={{
      padding: "16px 20px",
      borderBottom: (count ?? 0) > 0 ? "1px solid #EBEBEB" : "none",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: accentBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={18} style={{ color: accentColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-oswald)", fontSize: 16, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 8 }}>
          {label}
          {count != null && count > 0 && (
            <span style={{ background: accentBg, color: accentColor, borderRadius: 20, padding: "1px 8px", fontSize: 12, fontFamily: "var(--font-inter)", fontWeight: 600 }}>
              {count}
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#888780", marginTop: 2 }}>{description}</div>
      </div>
    </div>
  );
}

function ActionLink({ href, label, accentColor, accentBg }: { href: string; label: string; accentColor: string; accentBg: string }) {
  return (
    <Link href={href} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
      borderRadius: 8, background: accentBg, color: accentColor,
      fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500,
      textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap",
    }}>
      {label} <ArrowRight size={13} />
    </Link>
  );
}

// ─── Admin / Master Admin view ────────────────────────────────────────────────

const ADMIN_SECTIONS = [
  { key: "readyToAssign"      as const, label: "Ready to Assign & Schedule", description: "Quote accepted — assign a crew leader and confirm the date.", icon: UserCheck,    accentColor: "#C0392B", accentBg: "#FFF0EF", actionLabel: "Schedule",     actionHref: (j: Job) => `/dashboard/schedule?jobId=${j.id}` },
  { key: "awaitingAcceptance" as const, label: "Awaiting Acceptance",        description: "Quote presented to customer — waiting for their sign-off.",  icon: FileCheck,    accentColor: "#C8922A", accentBg: "#FFFBF0", actionLabel: "View Quote",    actionHref: (j: Job) => `/dashboard/jobs/${j.id}` },
  { key: "pendingReview"      as const, label: "Pending Review",             description: "New submissions waiting to be reviewed.",                     icon: ClipboardList, accentColor: "#185FA5", accentBg: "#EFF6FF", actionLabel: "Review",       actionHref: (j: Job) => `/dashboard/jobs/${j.id}` },
  { key: "needsQuote"         as const, label: "Needs a Quote",              description: "Pushed to sales — schedule the quote visit.",                 icon: FileSignature, accentColor: "#5B21B6", accentBg: "#F5F3FF", actionLabel: "Schedule Visit", actionHref: (j: Job) => `/dashboard/schedule?mode=quotes&jobId=${j.id}` },
  { key: "today"              as const, label: "Today's Jobs",               description: "Scheduled for today.",                                        icon: CalendarCheck2, accentColor: "#1C3A2B", accentBg: "#EAF3DE", actionLabel: "View",        actionHref: (j: Job) => `/dashboard/jobs/${j.id}` },
];

function AdminWorkstation({ data }: { data: AdminData }) {
  const total = ADMIN_SECTIONS.slice(0, 4).reduce((n, s) => n + (data.sections[s.key]?.length ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {total === 0 && (
        <div style={{ background: "#EAF3DE", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 size={16} style={{ color: "#27500A" }} />
          <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#27500A", fontWeight: 500 }}>You're all caught up.</span>
        </div>
      )}
      {ADMIN_SECTIONS.map((s) => {
        const jobs = data.sections[s.key] ?? [];
        return (
          <Card key={s.key}>
            <CardHeader icon={s.icon} label={s.label} description={s.description} count={jobs.length} accentColor={s.accentColor} accentBg={s.accentBg} />
            {jobs.length === 0 ? <EmptyRow /> : jobs.map((job, i) => (
              <div key={job.id} style={{ padding: "14px 20px", borderBottom: i < jobs.length - 1 ? "1px solid #F0F0EE" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>{job.customer_name}</span>
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#888780" }}>{job.reference_code}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
                    {job.property_address && (
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={11} style={{ color: "#888780" }} />{job.property_address}
                      </span>
                    )}
                    {s.key === "readyToAssign" && (
                      <>
                        {!job.assigned_to && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, background: "#FFF0EF", color: "#C0392B", borderRadius: 20, padding: "1px 7px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 500 }}>
                            <User size={10} /> No crew
                          </span>
                        )}
                        {job.assigned_to && (
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                            <User size={11} style={{ color: "#888780" }} />{crewName(data.profiles, job.assigned_to)}
                          </span>
                        )}
                        {!job.scheduled_date && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, background: "#FFF3CD", color: "#856404", borderRadius: 20, padding: "1px 7px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 500 }}>
                            <Clock size={10} /> No date
                          </span>
                        )}
                        {job.scheduled_date && (
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                            <Clock size={11} style={{ color: "#888780" }} />
                            {new Date(job.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {job.scheduled_time ? ` @ ${formatTime(job.scheduled_time)}` : ""}
                          </span>
                        )}
                      </>
                    )}
                    {s.key === "today" && (
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={11} style={{ color: "#888780" }} />
                        {job.scheduled_time ? formatTime(job.scheduled_time) : "No time set"}
                        {job.assigned_to ? ` · ${crewName(data.profiles, job.assigned_to)}` : ""}
                      </span>
                    )}
                    {(s.key === "pendingReview" || s.key === "needsQuote") && (
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#888780", display: "flex", alignItems: "center", gap: 3 }}>
                        <Clock size={11} />{timeAgo(job.created_at)}
                      </span>
                    )}
                  </div>
                </div>
                <ActionLink href={s.actionHref(job)} label={s.actionLabel} accentColor={s.accentColor} accentBg={s.accentBg} />
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Sales view ───────────────────────────────────────────────────────────────

function SalesWorkstation({ data }: { data: SalesData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* My Queue */}
      <Card>
        <CardHeader icon={ClipboardList} label="My Queue" description="Jobs ready for you to quote." count={data.queue.length} accentColor="#5B21B6" accentBg="#F5F3FF" />
        {data.queue.length === 0 ? <EmptyRow message="No jobs in your queue" /> : data.queue.map((job, i) => (
          <div key={job.id} style={{ padding: "14px 20px", borderBottom: i < data.queue.length - 1 ? "1px solid #F0F0EE" : "none", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>{job.customer_name}</span>
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#888780" }}>{job.reference_code}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
                {job.property_address && (
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                    <MapPin size={11} style={{ color: "#888780" }} />{job.property_address}
                  </span>
                )}
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#888780", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={11} />{timeAgo(job.created_at)}
                </span>
              </div>
            </div>
            <ActionLink href={`/dashboard/quotes/new?jobId=${job.id}`} label="Create Quote" accentColor="#5B21B6" accentBg="#F5F3FF" />
          </div>
        ))}
      </Card>

      {/* Active Quotes */}
      <Card>
        <CardHeader icon={FileText} label="Active Quotes" description="Quotes you've created that are in progress." count={data.activeQuotes.length} accentColor="#C8922A" accentBg="#FFFBF0" />
        {data.activeQuotes.length === 0 ? <EmptyRow message="No active quotes" /> : data.activeQuotes.map((q, i) => (
          <div key={q.id} style={{ padding: "14px 20px", borderBottom: i < data.activeQuotes.length - 1 ? "1px solid #F0F0EE" : "none", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>{q.customer_name}</span>
                <span style={{
                  fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 500, borderRadius: 20, padding: "1px 7px",
                  background: q.status === "presented" ? "#EAF3DE" : "#F3F4F6",
                  color:      q.status === "presented" ? "#27500A"  : "#4A4A4A",
                }}>
                  {q.status === "presented" ? "Presented" : "Draft"}
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#888780" }}>
                ${q.total_cost?.toFixed(2) ?? "0.00"} · {timeAgo(q.created_at)}
              </span>
            </div>
            <ActionLink href={`/dashboard/quotes/${q.id}`} label="View" accentColor="#C8922A" accentBg="#FFFBF0" />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Crew Leader view ─────────────────────────────────────────────────────────

function CrewLeaderWorkstation({ data }: { data: CrewLeaderData }) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedCrew, setSelectedCrew]   = useState<string[]>([]);
  const [saving, setSaving]               = useState(false);
  const [crewByJob, setCrewByJob]         = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const job of data.jobs) {
      const ids = (job.report_data as { crew_member_ids?: string[] } | null)?.crew_member_ids;
      if (ids?.length) map[job.id] = ids;
    }
    return map;
  });

  const selectedJob = data.jobs.find((j) => j.id === selectedJobId) ?? null;

  function openModal(job: Job) {
    setSelectedJobId(job.id);
    setSelectedCrew(crewByJob[job.id] ?? []);
  }

  function toggleCrew(id: string) {
    setSelectedCrew((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function confirmCrew() {
    if (!selectedJobId) return;
    setSaving(true);
    const res = await fetch(`/api/admin/jobs/${selectedJobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_data: { crew_member_ids: selectedCrew } }),
    });
    if (res.ok) {
      setCrewByJob((prev) => ({ ...prev, [selectedJobId]: selectedCrew }));
      setSelectedJobId(null);
    }
    setSaving(false);
  }

  const nameById = Object.fromEntries(data.crewMembers.map((m) => [m.id, m.name]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader icon={Users} label="My Jobs" description="Jobs assigned to you. Select your crew for each." count={data.jobs.length} accentColor="#1C3A2B" accentBg="#EAF3DE" />
        {data.jobs.length === 0 ? <EmptyRow message="No jobs assigned to you" /> : data.jobs.map((job, i) => {
          const assignedIds  = crewByJob[job.id] ?? [];
          const hasCrewSet   = assignedIds.length > 0;
          const crewLabel    = hasCrewSet ? assignedIds.map((id) => nameById[id] ?? "?").join(", ") : null;

          return (
            <div key={job.id} style={{ padding: "14px 20px", borderBottom: i < data.jobs.length - 1 ? "1px solid #F0F0EE" : "none", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>{job.customer_name}</span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#888780" }}>{job.reference_code}</span>
                  {!hasCrewSet && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3, background: "#FFF0EF", color: "#C0392B", borderRadius: 20, padding: "1px 7px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 500 }}>
                      <AlertTriangle size={10} /> Crew needed
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
                  {job.property_address && (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={11} style={{ color: "#888780" }} />{job.property_address}
                    </span>
                  )}
                  {job.scheduled_date && (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock size={11} style={{ color: "#888780" }} />
                      {new Date(job.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {job.scheduled_time ? ` @ ${formatTime(job.scheduled_time)}` : ""}
                    </span>
                  )}
                  {crewLabel && (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                      <Users size={11} style={{ color: "#888780" }} />{crewLabel}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openModal(job)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                    borderRadius: 8, background: hasCrewSet ? "#EAF3DE" : "#FFF0EF",
                    color: hasCrewSet ? "#27500A" : "#C0392B",
                    fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500,
                    border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  <Users size={13} />
                  {hasCrewSet ? "Edit Crew" : "Select Crew"}
                </button>
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "#EAF3DE", color: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: 13, fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  View <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Crew Selection Modal */}
      {selectedJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
            {/* Modal header */}
            <div style={{ background: "#1C3A2B", padding: "20px 24px" }}>
              <div style={{ fontFamily: "var(--font-oswald)", fontSize: 18, color: "white" }}>Select Crew</div>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                {selectedJob.customer_name} · {selectedJob.reference_code}
              </div>
            </div>

            {/* Job summary */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #EBEBEB", background: "#FAFAF9" }}>
              {selectedJob.property_address && (
                <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <MapPin size={13} style={{ color: "#888780" }} />{selectedJob.property_address}
                </div>
              )}
              {selectedJob.scheduled_date && (
                <div style={{ fontFamily: "var(--font-inter)", fontSize: 13, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={13} style={{ color: "#888780" }} />
                  {new Date(selectedJob.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
                  {selectedJob.scheduled_time ? ` @ ${formatTime(selectedJob.scheduled_time)}` : ""}
                </div>
              )}
            </div>

            {/* Crew list */}
            <div style={{ padding: "16px 24px", maxHeight: 260, overflowY: "auto" }}>
              <div style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Available Crew Members
              </div>
              {data.crewMembers.length === 0 ? (
                <div style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#888780" }}>No crew members found.</div>
              ) : data.crewMembers.map((member) => {
                const checked = selectedCrew.includes(member.id);
                return (
                  <label key={member.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "#1C3A2B" : "#D3D1C7"}`,
                      background: checked ? "#1C3A2B" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {checked && <CheckCircle2 size={12} style={{ color: "white" }} />}
                    </div>
                    <input type="checkbox" checked={checked} onChange={() => toggleCrew(member.id)} style={{ display: "none" }} />
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#1A1A1A" }}>{member.name}</span>
                  </label>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #EBEBEB", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedJobId(null)}
                style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid #D3D1C7", background: "white", fontFamily: "var(--font-inter)", fontSize: 14, cursor: "pointer", color: "#4A4A4A" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmCrew}
                disabled={saving}
                style={{ padding: "9px 18px", borderRadius: 10, background: "#1C3A2B", color: "white", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 500, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : `Confirm${selectedCrew.length > 0 ? ` (${selectedCrew.length})` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Crew Member view ────────────────────────────────────────────────────────

function CrewMemberWorkstation({ data }: { data: CrewMemberData }) {
  const nameById = (id: string) => data.profiles[id]?.name ?? "Unknown";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader
          icon={Users}
          label="My Upcoming Jobs"
          description="Jobs you've been assigned to. Check in with your crew leader for details."
          count={data.jobs.length}
          accentColor="#1C3A2B"
          accentBg="#EAF3DE"
        />
        {data.jobs.length === 0 ? (
          <EmptyRow message="No jobs assigned to you right now" />
        ) : (
          data.jobs.map((job, i) => (
            <div
              key={job.id}
              style={{
                padding: "14px 20px",
                borderBottom: i < data.jobs.length - 1 ? "1px solid #F0F0EE" : "none",
                display: "flex", alignItems: "center", gap: 14,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: "var(--font-inter)", fontWeight: 600, fontSize: 14, color: "#1A1A1A" }}>
                    {job.customer_name}
                  </span>
                  <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#888780" }}>
                    {job.reference_code}
                  </span>
                  {job.status === "in_progress" && (
                    <span style={{ background: "#FEF3CD", color: "#92400E", borderRadius: 20, padding: "1px 7px", fontFamily: "var(--font-inter)", fontSize: 11, fontWeight: 500 }}>
                      In Progress
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
                  {job.property_address && (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={11} style={{ color: "#888780" }} />{job.property_address}
                    </span>
                  )}
                  {job.scheduled_date && (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock size={11} style={{ color: "#888780" }} />
                      {new Date(job.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {job.scheduled_time ? ` @ ${formatTime(job.scheduled_time)}` : ""}
                    </span>
                  )}
                  {job.assigned_to && (
                    <span style={{ fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A", display: "flex", alignItems: "center", gap: 3 }}>
                      <User size={11} style={{ color: "#888780" }} />
                      {nameById(job.assigned_to)}
                    </span>
                  )}
                </div>
                {job.crew_notes && (
                  <div style={{ marginTop: 6, padding: "6px 10px", background: "#F9F9F8", borderRadius: 8, fontFamily: "var(--font-inter)", fontSize: 12, color: "#4A4A4A" }}>
                    {job.crew_notes}
                  </div>
                )}
              </div>
              <ActionLink href={`/dashboard/jobs/${job.id}`} label="View" accentColor="#1C3A2B" accentBg="#EAF3DE" />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkstationPage() {
  const [data, setData]       = useState<WorkstationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/workstation")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const subtitle =
    data?.role === "sales"        ? "Your active quote queue and in-progress quotes."
    : data?.role === "crew_leader" ? "Your assigned jobs. Acknowledge each one and select your crew."
    : data?.role === "crew_member" ? "Your upcoming jobs. Check in with your crew leader for any updates."
    : "Everything that needs your attention today.";

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-oswald)", fontSize: 28, fontWeight: 600, color: "#1A1A1A", lineHeight: 1, marginBottom: 6 }}>
          Workstation
        </h1>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: 14, color: "#888780" }}>
          {loading ? "Loading…" : subtitle}
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, border: "1px solid #D3D1C7", height: 90 }} />
          ))}
        </div>
      ) : !data ? null
        : data.role === "sales"        ? <SalesWorkstation      data={data} />
        : data.role === "crew_leader"  ? <CrewLeaderWorkstation data={data} />
        : data.role === "crew_member"  ? <CrewMemberWorkstation data={data} />
        : <AdminWorkstation data={data as AdminData} />}
    </div>
  );
}
