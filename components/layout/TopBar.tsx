"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "@/lib/search-context";

const pageTitles: Record<string, string> = {
  "/dashboard":           "Dashboard",
  "/dashboard/jobs":      "Jobs",
  "/dashboard/customers": "Customers",
  "/dashboard/quotes":    "Quotes",
  "/dashboard/crew":      "Crew",
  "/dashboard/settings":  "Settings",
};

export default function TopBar() {
  const pathname = usePathname();
  const { openSearch } = useSearch();

  const title = pageTitles[pathname] ?? "Gordon Pro";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    year:    "numeric",
  });

  return (
    <div
      className="h-14 flex items-center justify-between gap-4 px-6 flex-shrink-0"
      style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}
    >
      <span
        className="font-bold"
        style={{ fontFamily: "var(--font-oswald)", fontSize: "20px", color: "#1A1A1A" }}
      >
        {title}
      </span>

      <div className="flex items-center gap-4">
        {/* Desktop search trigger */}
        <button
          type="button"
          onClick={openSearch}
          className="hidden md:flex items-center gap-2 transition-colors"
          style={{
            background:   "#F5F2ED",
            borderRadius: 12,
            padding:      "7px 12px",
            border:       "1px solid #E5E3DE",
            cursor:       "pointer",
            width:        220,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.borderColor = "#D3D1C7")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E3DE")
          }
        >
          <Search size={16} style={{ color: "#888780", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize:   "14px",
              color:      "#888780",
              flex:       1,
              textAlign:  "left",
            }}
          >
            Search...
          </span>
          <span
            style={{
              background:   "#E5E3DE",
              borderRadius: 6,
              padding:      "2px 6px",
              fontFamily:   "var(--font-inter)",
              fontSize:     "11px",
              color:        "#888780",
              flexShrink:   0,
            }}
          >
            ⌘K
          </span>
        </button>

        {/* Mobile search icon */}
        <button
          type="button"
          onClick={openSearch}
          className="md:hidden p-2 rounded-lg hover:bg-[#F5F2ED] transition-colors"
          style={{ cursor: "pointer", border: "none", background: "transparent" }}
        >
          <Search size={20} style={{ color: "#888780" }} />
        </button>

        {/* Date — desktop only */}
        <span
          className="hidden md:block"
          style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
        >
          {today}
        </span>
      </div>
    </div>
  );
}
