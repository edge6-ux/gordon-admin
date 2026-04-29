"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  deleteUrl: string;
  redirectTo: string;
  label?: string;
  confirmMessage?: string;
}

export default function DeleteButton({
  deleteUrl,
  redirectTo,
  label = "Delete",
  confirmMessage = "This cannot be undone.",
}: DeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(deleteUrl, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Delete failed");
      }
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}>
          {confirmMessage}
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
          style={{
            background: "#DC2626",
            fontFamily: "var(--font-inter)",
            fontSize: "13px",
          }}
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          {deleting ? "Deleting..." : "Yes, Delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
        >
          Cancel
        </button>
        {error && (
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#DC2626" }}>
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors"
      style={{
        borderColor: "#FECACA",
        color:       "#DC2626",
        fontFamily:  "var(--font-inter)",
        fontSize:    "14px",
        background:  "white",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "white";
      }}
    >
      <Trash2 size={15} />
      {label}
    </button>
  );
}
