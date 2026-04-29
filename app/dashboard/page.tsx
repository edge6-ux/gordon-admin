"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { timeAgo, formatCurrency } from "@/lib/utils";
import type { Submission, Job, JobStatus } from "@/lib/types";
import {
  UserPlus,
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  LayoutDashboard,
  TrendingUp,
  X,
  Calendar,
} from "lucide-react";

type DashboardData = {
  metrics: {
    newLeadsToday: number;
    activeJobs: number;
    pendingQuotes: number;
    completedThisMonth: number;
    revenueThisMonth: number;
  };
  upcomingJobs:  Job[];
  attentionJobs: Job[];
};

const STATUS_CONFIG: Record<JobStatus, { bg: string; color: string; label: string }> = {
  submitted:   { bg: "#E6F1FB", color: "#185FA5", label: "Submitted"   },
  reviewed:    { bg: "#F3EFFE", color: "#5B21B6", label: "Reviewed"    },
  quoted:      { bg: "#FAEEDA", color: "#633806", label: "Quoted"      },
  assigned:    { bg: "#FFF0E6", color: "#C2410C", label: "Assigned"    },
  in_progress: { bg: "#FEF3CD", color: "#92400E", label: "In Progress" },
  complete:    { bg: "#EAF3DE", color: "#27500A", label: "Complete"    },
  cancelled:   { bg: "#F3F4F6", color: "#4A4A4A", label: "Cancelled"  },
};

function scheduledDateLabel(dateStr: string, todayStr: string): { isToday: boolean; month: string; day: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const isToday = dateStr === todayStr;
  const month = new Date(y, m - 1, d).toLocaleString("en-US", { month: "short" });
  return { isToday, month, day: d };
}

function waitingColor(createdAt: string): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (hours > 4) return "#E24B4A";
  if (hours > 1) return "#C8922A";
  return "#888780";
}

function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-2xl p-5 animate-pulse"
      style={{ border: "1px solid #E5E7EB" }}
    >
      <div className="mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-100" />
      </div>
      <div className="h-9 w-16 bg-gray-100 rounded mb-2" />
      <div className="h-3 w-28 bg-gray-100 rounded" />
    </div>
  );
}

function SkeletonRow({ last = false }: { last?: boolean }) {
  return (
    <div
      className="flex items-start gap-3 py-3 animate-pulse"
      style={{ borderBottom: last ? "none" : "1px solid #E5E7EB" }}
    >
      <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3.5 w-32 bg-gray-100 rounded mb-2" />
        <div className="h-3 w-48 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const now       = new Date();
  const todayStr  = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const [data, setData]                     = useState<DashboardData | null>(null);
  const [loading, setLoading]               = useState(true);
  const [newSubmission, setNewSubmission]   = useState<Submission | null>(null);
  const [bannerVisible, setBannerVisible]   = useState(false);
  const dismissTimer                        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-submissions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        (payload) => {
          setNewSubmission(payload.new as Submission);
          setBannerVisible(true);
          loadData();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  useEffect(() => {
    if (!bannerVisible) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setBannerVisible(false), 8000);
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, [bannerVisible, newSubmission]);

  const metrics = data
    ? [
        { label: "New Leads Today",      display: String(data.metrics.newLeadsToday),             icon: UserPlus,    iconBg: "#EAF3DE", iconColor: "#1C3A2B", small: false },
        { label: "Active Jobs",          display: String(data.metrics.activeJobs),                icon: Briefcase,   iconBg: "#FAEEDA", iconColor: "#C8922A", small: false },
        { label: "Pending Quotes",       display: String(data.metrics.pendingQuotes),             icon: FileText,    iconBg: "#E6F1FB", iconColor: "#185FA5", small: false },
        { label: "Completed This Month", display: String(data.metrics.completedThisMonth),        icon: CheckCircle, iconBg: "#EAF3DE", iconColor: "#1C3A2B", small: false },
        { label: "Revenue This Month",   display: formatCurrency(data.metrics.revenueThisMonth),  icon: TrendingUp,  iconBg: "#EAF3DE", iconColor: "#1C3A2B", small: true  },
      ]
    : [];

  return (
    <div>
      {/* Real-time notification banner */}
      {bannerVisible && newSubmission && (
        <div
          style={{
            position: "fixed",
            top: 56,
            left: 0,
            right: 0,
            zIndex: 50,
            background: "#1C3A2B",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span className="relative flex-shrink-0" style={{ width: 10, height: 10 }}>
            <span
              className="animate-ping absolute inline-flex"
              style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ADE80", opacity: 0.75 }}
            />
            <span
              className="relative inline-flex"
              style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ADE80" }}
            />
          </span>
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              color: "white",
              flex: 1,
            }}
          >
            New submission from <strong>{newSubmission.customer_name}</strong>
          </span>
          <button
            onClick={() => setBannerVisible(false)}
            style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : metrics.map(({ label, display, icon: Icon, iconBg, iconColor, small }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-5"
                style={{ border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <div className="mb-4">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 40, height: 40, borderRadius: "50%", background: iconBg }}
                  >
                    <Icon size={20} style={{ color: iconColor }} />
                  </div>
                </div>
                <div
                  className="font-bold"
                  style={{
                    fontFamily: "var(--font-oswald)",
                    fontSize: small ? "22px" : "36px",
                    color: "#1A1A1A",
                    lineHeight: 1.1,
                  }}
                >
                  {display}
                </div>
                <div
                  className="mt-1"
                  style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
                >
                  {label}
                </div>
              </div>
            ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Jobs */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        >
          <div className="flex justify-between items-center mb-4">
            <span
              className="font-bold"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "16px", color: "#1A1A1A" }}
            >
              Upcoming Jobs
            </span>
            <Link
              href="/dashboard/crew"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#1C3A2B" }}
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} last={i === 3} />
              ))}
            </div>
          ) : !data || data.upcomingJobs.length === 0 ? (
            <div
              className="py-8 text-center"
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
            >
              No upcoming jobs scheduled
            </div>
          ) : (
            <div>
              {data.upcomingJobs.map((job, i) => {
                const dateParts = job.scheduled_date
                  ? scheduledDateLabel(job.scheduled_date, todayStr)
                  : null;
                const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.assigned;
                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-[#F9F9F8] transition-colors"
                    style={{
                      borderBottom:
                        i < data.upcomingJobs.length - 1 ? "1px solid #E5E7EB" : "none",
                    }}
                  >
                    {/* Date block */}
                    <div
                      className="flex flex-col items-center justify-center flex-shrink-0"
                      style={{
                        width:        40,
                        height:       40,
                        borderRadius: 8,
                        background:   dateParts?.isToday ? "#EAF3DE" : "#F3F4F6",
                      }}
                    >
                      {dateParts ? (
                        <>
                          <span
                            style={{
                              fontFamily: "var(--font-inter)",
                              fontSize:   "9px",
                              fontWeight: 600,
                              color:      dateParts.isToday ? "#27500A" : "#888780",
                              lineHeight: 1,
                              textTransform: "uppercase",
                            }}
                          >
                            {dateParts.isToday ? "Today" : dateParts.month}
                          </span>
                          {!dateParts.isToday && (
                            <span
                              style={{
                                fontFamily: "var(--font-oswald)",
                                fontSize:   "17px",
                                fontWeight: 700,
                                color:      "#1A1A1A",
                                lineHeight: 1.1,
                              }}
                            >
                              {dateParts.day}
                            </span>
                          )}
                        </>
                      ) : (
                        <Calendar size={16} style={{ color: "#888780" }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize:   "14px",
                            color:      "#1A1A1A",
                            fontWeight: 500,
                          }}
                        >
                          {job.customer_name}
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{
                            background: statusCfg.bg,
                            color:      statusCfg.color,
                            fontFamily: "var(--font-inter)",
                            fontSize:   "11px",
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <div
                        className="mt-0.5 truncate"
                        style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
                      >
                        {job.property_address}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Needs Attention */}
        <div
          className="bg-white rounded-2xl p-5"
          style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        >
          <div className="flex justify-between items-center mb-4">
            <span
              className="font-bold"
              style={{ fontFamily: "var(--font-oswald)", fontSize: "16px", color: "#1A1A1A" }}
            >
              Needs Attention
            </span>
            <Link
              href="/dashboard/jobs"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#1C3A2B" }}
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} last={i === 3} />
              ))}
            </div>
          ) : !data || data.attentionJobs.length === 0 ? (
            <div
              className="py-8 text-center"
              style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}
            >
              All caught up
            </div>
          ) : (
            <div>
              {data.attentionJobs.map((job, i) => {
                const isSubmitted = job.status === "submitted";
                const StatusIcon  = isSubmitted ? Clock : Eye;
                const iconBg      = isSubmitted ? "#E6F1FB" : "#FAEEDA";
                const iconColor   = isSubmitted ? "#185FA5" : "#C8922A";
                const badgeBg     = isSubmitted ? "#E6F1FB" : "#FAEEDA";
                const badgeColor  = isSubmitted ? "#185FA5" : "#633806";
                const badgeLabel  = isSubmitted ? "New" : "Reviewed";
                const waitColor   = waitingColor(job.created_at);

                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex items-start gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-[#F9F9F8] transition-colors"
                    style={{
                      borderBottom:
                        i < data.attentionJobs.length - 1
                          ? "1px solid #E5E7EB"
                          : "none",
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 36, height: 36, borderRadius: "50%", background: iconBg }}
                    >
                      <StatusIcon size={16} style={{ color: iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: "14px",
                            color: "#1A1A1A",
                            fontWeight: 500,
                          }}
                        >
                          {job.customer_name}
                        </span>
                        <span
                          className="flex-shrink-0"
                          style={{
                            fontFamily: "var(--font-inter)",
                            fontSize: "12px",
                            color: waitColor,
                            fontWeight: waitColor !== "#888780" ? 600 : 400,
                          }}
                        >
                          {timeAgo(job.created_at)}
                        </span>
                      </div>
                      <div className="mt-0.5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: badgeBg,
                            color: badgeColor,
                            fontFamily: "var(--font-inter)",
                            fontSize: "11px",
                          }}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                      <div
                        className="mt-0.5 truncate"
                        style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
                      >
                        {job.property_address}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <div
          className="font-bold mb-4"
          style={{ fontFamily: "var(--font-oswald)", fontSize: "16px", color: "#1A1A1A" }}
        >
          Quick Actions
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity"
            style={{ background: "#C8922A", fontFamily: "var(--font-oswald)", fontSize: "14px" }}
          >
            <Plus size={16} />
            New Quote
          </Link>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors hover:bg-[#F0F7F3]"
            style={{
              background: "white",
              border: "1.5px solid #1C3A2B",
              color: "#1C3A2B",
              fontFamily: "var(--font-oswald)",
              fontSize: "14px",
            }}
          >
            <Briefcase size={16} />
            View All Jobs
          </Link>
          <Link
            href="/dashboard/jobs?view=pipeline"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors hover:bg-[#F0F7F3]"
            style={{
              background: "white",
              border: "1.5px solid #1C3A2B",
              color: "#1C3A2B",
              fontFamily: "var(--font-oswald)",
              fontSize: "14px",
            }}
          >
            <LayoutDashboard size={16} />
            View Pipeline
          </Link>
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors hover:bg-[#F0F7F3]"
            style={{
              background: "white",
              border: "1.5px solid #1C3A2B",
              color: "#1C3A2B",
              fontFamily: "var(--font-oswald)",
              fontSize: "14px",
            }}
          >
            <UserPlus size={16} />
            Add Customer
          </Link>
        </div>
      </div>
    </div>
  );
}
