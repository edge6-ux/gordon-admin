"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  HardHat,
  Settings,
  LogOut,
  UserCog,
  CalendarDays,
  Inbox,
} from "lucide-react";
import { usePermissions } from "@/lib/permissions-context";
import type { Role } from "@/lib/permissions";

// ─── Nav definition ───────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href:  string;
  icon:  React.ElementType;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href:  "/dashboard",
    icon:  LayoutDashboard,
    roles: ["master_admin", "admin"],
  },
  {
    label: "Workstation",
    href:  "/dashboard/workstation",
    icon:  Inbox,
    roles: ["master_admin", "admin", "sales", "crew_leader", "crew_member"],
  },
  {
    label: "Jobs",
    href:  "/dashboard/jobs",
    icon:  Briefcase,
    roles: ["master_admin", "admin", "crew_leader", "crew_member"],
  },
  {
    label: "Customers",
    href:  "/dashboard/customers",
    icon:  Users,
    roles: ["master_admin", "admin", "sales"],
  },
  {
    label: "Quotes",
    href:  "/dashboard/quotes",
    icon:  FileText,
    roles: ["master_admin", "admin", "sales"],
  },
  {
    label: "Schedule",
    href:  "/dashboard/schedule",
    icon:  CalendarDays,
    roles: ["master_admin", "admin", "crew_leader"],
  },
  {
    label: "Crew",
    href:  "/dashboard/crew",
    icon:  HardHat,
    roles: ["master_admin", "admin", "crew_leader"],
  },
  {
    label: "Team",
    href:  "/dashboard/team",
    icon:  UserCog,
    roles: ["master_admin"],
  },
  {
    label: "Settings",
    href:  "/dashboard/settings",
    icon:  Settings,
    roles: ["master_admin"],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const permissions = usePermissions();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(permissions.role)
  );

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("gp_admin_exp");
    router.push("/login");
  }

  return (
    <div
      className="h-screen sticky top-0 flex flex-col w-full"
      style={{ background: "#1C3A2B" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/gptslogo.png"
          alt="Gordon Pro Tree Service"
          className="flex-shrink-0 object-contain"
          style={{ width: 40, height: 40 }}
        />
        <div className="flex items-baseline gap-1.5">
          <div
            className="text-white font-bold leading-tight"
            style={{ fontFamily: "var(--font-oswald)", fontSize: "16px" }}
          >
            Gordon Pro
          </div>
          <div
            className="leading-tight"
            style={{ fontFamily: "var(--font-inter)", fontSize: "10px", color: "#9FE1CB" }}
          >
            Admin
          </div>
        </div>
      </div>

      <div className="mx-4" style={{ height: "1px", background: "rgba(255,255,255,0.1)" }} />

      {/* Nav */}
      <nav className="px-3 py-4 space-y-1">
        {visibleItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150"
              style={{
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color:      active ? "white" : "rgba(255,255,255,0.6)",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "white";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
                }
              }}
            >
              <Icon size={18} />
              <span
                style={{ fontFamily: "var(--font-inter)", fontSize: "14px" }}
                className="font-medium"
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="mt-auto px-3 py-4">
        <div className="mx-1 mb-4" style={{ height: "1px", background: "rgba(255,255,255,0.1)" }} />
        <button
          onClick={handleSignOut}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group"
        >
          <LogOut
            size={16}
            style={{ color: "rgba(255,255,255,0.4)" }}
            className="group-hover:!text-white transition-colors"
          />
          <span
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}
            className="group-hover:!text-white transition-colors"
          >
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}
