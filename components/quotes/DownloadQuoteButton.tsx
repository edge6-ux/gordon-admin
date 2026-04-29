"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import type { Quote } from "@/lib/types";

const DownloadQuoteButtonInner = dynamic(
  () => import("@/components/quotes/DownloadQuoteButtonInner"),
  { ssr: false }
);

const buttonBase: React.CSSProperties = {
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
  cursor:       "default",
  whiteSpace:   "nowrap",
  opacity:      0.6,
};

export default function DownloadQuoteButton({ quote }: { quote: Quote }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button disabled style={buttonBase}>
        <Download size={16} style={{ flexShrink: 0 }} />
        Download PDF
      </button>
    );
  }

  return <DownloadQuoteButtonInner quote={quote} />;
}
