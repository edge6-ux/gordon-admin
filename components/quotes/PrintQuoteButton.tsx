"use client";

import { Printer } from "lucide-react";

export default function PrintQuoteButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          8,
        padding:      "10px 16px",
        borderRadius: 12,
        border:       "1px solid #D3D1C7",
        background:   "white",
        color:        "#4A4A4A",
        fontFamily:   "var(--font-inter)",
        fontSize:     "14px",
        cursor:       "pointer",
        whiteSpace:   "nowrap",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#F5F2ED";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "white";
      }}
    >
      <Printer size={16} style={{ flexShrink: 0 }} />
      Print Quote
    </button>
  );
}
