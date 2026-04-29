"use client";

import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  customerPhone: string;
  initialNotes: string;
};

type SaveStatus = null | "saving" | "saved" | "error";

export default function CustomerNotes({ customerPhone, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);
  const savedRef = useRef(initialNotes);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleBlur() {
    if (notes === savedRef.current) return;

    setSaveStatus("saving");
    try {
      const res = await fetch("/api/admin/customers/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerPhone, notes }),
      });
      if (!res.ok) throw new Error("Save failed");
      savedRef.current = notes;
      setSaveStatus("saved");
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setSaveStatus(null), 2000);
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <div
      className="bg-white rounded-2xl border p-5"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-bold"
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: "16px",
            color: "#1A1A1A",
          }}
        >
          Customer Notes
        </span>
        <div className="flex items-center gap-1">
          {saveStatus === "saving" && (
            <Loader2 size={14} className="animate-spin" style={{ color: "#888780" }} />
          )}
          {saveStatus === "saved" && (
            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                color: "#16A34A",
              }}
            >
              Saved ✓
            </span>
          )}
          {saveStatus === "error" && (
            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                color: "#DC2626",
              }}
            >
              Failed to save
            </span>
          )}
        </div>
      </div>

      <textarea
        rows={5}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes about this customer — preferences, access details, anything the team should know..."
        className="w-full border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1C3A2B] resize-none transition-colors"
        style={{
          borderColor: "#D3D1C7",
          fontFamily: "var(--font-inter)",
          fontSize: "14px",
          color: "#1A1A1A",
        }}
      />
    </div>
  );
}
