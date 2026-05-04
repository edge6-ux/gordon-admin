"use client";

import { useState } from "react";
import { SendHorizonal, Check, Loader2 } from "lucide-react";

export default function PushToSalesButton({ jobId }: { jobId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleClick() {
    if (state !== "idle") return;
    setState("loading");

    const res = await fetch(`/api/admin/jobs/${jobId}/push-to-sales`, {
      method: "POST",
    });

    if (res.ok) {
      setState("done");
    } else {
      setState("idle");
      alert("Something went wrong. Please try again.");
    }
  }

  if (state === "done") {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl"
        style={{
          background:  "#EAF3DE",
          color:       "#27500A",
          fontFamily:  "var(--font-inter)",
          fontSize:    "14px",
          fontWeight:  500,
        }}
      >
        <Check size={15} />
        Pushed to Sales
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
      style={{
        background:  "#C8922A",
        color:       "white",
        fontFamily:  "var(--font-inter)",
        fontSize:    "14px",
        fontWeight:  500,
        border:      "none",
        cursor:      state === "loading" ? "not-allowed" : "pointer",
        opacity:     state === "loading" ? 0.7 : 1,
      }}
    >
      {state === "loading" ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <SendHorizonal size={15} />
      )}
      Push to Sales
    </button>
  );
}
