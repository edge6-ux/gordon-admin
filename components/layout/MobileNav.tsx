"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  HardHat,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard",           icon: LayoutDashboard },
  { label: "Jobs",      href: "/dashboard/jobs",       icon: Briefcase       },
  { label: "Customers", href: "/dashboard/customers",  icon: Users           },
  { label: "Quotes",    href: "/dashboard/quotes",     icon: FileText        },
  { label: "Crew",      href: "/dashboard/crew",       icon: HardHat         },
  { label: "Settings",  href: "/dashboard/settings",   icon: Settings        },
];

export default function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{
        background: "white",
        borderTop: "1px solid #E5E7EB",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center py-3 gap-1"
            style={{ color: active ? "#1C3A2B" : "#888780" }}
          >
            <Icon size={22} />
            <span style={{ fontFamily: "var(--font-inter)", fontSize: "10px" }}>
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
