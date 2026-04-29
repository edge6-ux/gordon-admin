"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download } from "lucide-react";
import QuotePDF from "@/components/quotes/QuotePDF";
import type { Quote } from "@/lib/types";

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
  cursor:       "pointer",
  whiteSpace:   "nowrap",
  textDecoration: "none",
};

export default function DownloadQuoteButtonInner({ quote }: { quote: Quote }) {
  const filename = `gordon-pro-quote-${quote.customer_name
    .replace(/\s+/g, "-")
    .toLowerCase()}-${quote.date}.pdf`;

  return (
    <PDFDownloadLink
      document={<QuotePDF quote={quote} />}
      fileName={filename}
      style={{ textDecoration: "none" }}
    >
      {({ loading }: { loading: boolean }) => (
        <button
          disabled={loading}
          style={{
            ...buttonBase,
            opacity: loading ? 0.6 : 1,
            cursor:  loading ? "default" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!loading)
              (e.currentTarget as HTMLButtonElement).style.background = "#F5F2ED";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "white";
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width:       16,
                  height:      16,
                  border:      "2px solid #1C3A2B",
                  borderTop:   "2px solid transparent",
                  borderRadius: "50%",
                  flexShrink:  0,
                  animation:   "spin 0.7s linear infinite",
                }}
              />
              Generating...
            </>
          ) : (
            <>
              <Download size={16} style={{ flexShrink: 0 }} />
              Download PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
