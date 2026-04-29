"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, CheckCircle, XCircle, Loader2 } from "lucide-react";

type Props = {
  quoteId: string;
  jobId: string | null;
  status: string;
};

export default function QuoteActions({ quoteId, jobId: _jobId, status }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<"accepted" | "declined" | null>(null);

  async function updateStatus(newStatus: "accepted" | "declined") {
    setPending(newStatus);
    try {
      await fetch(`/api/admin/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Edit */}
      <Link
        href={`/dashboard/quotes/${quoteId}/edit`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors"
        style={{
          borderColor: "#D3D1C7",
          background: "white",
          fontFamily: "var(--font-inter)",
          fontSize: "13px",
          color: "#4A4A4A",
        }}
      >
        <Pencil size={14} />
        Edit Quote
      </Link>

      {/* Mark Accepted */}
      {status === "presented" && (
        <button
          type="button"
          onClick={() => updateStatus("accepted")}
          disabled={pending !== null}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
          style={{
            background: "#EAF3DE",
            fontFamily: "var(--font-inter)",
            fontSize: "13px",
            color: "#16A34A",
            fontWeight: 500,
          }}
        >
          {pending === "accepted" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} />
          )}
          Mark Accepted
        </button>
      )}

      {/* Mark Declined */}
      {status === "presented" && (
        <button
          type="button"
          onClick={() => updateStatus("declined")}
          disabled={pending !== null}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
          style={{
            background: "#FCEBEB",
            fontFamily: "var(--font-inter)",
            fontSize: "13px",
            color: "#E24B4A",
            fontWeight: 500,
          }}
        >
          {pending === "declined" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <XCircle size={14} />
          )}
          Mark Declined
        </button>
      )}
    </div>
  );
}
