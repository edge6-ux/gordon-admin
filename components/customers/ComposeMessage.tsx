"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, MessageSquare, Loader2 } from "lucide-react";
import type { Message } from "@/lib/types";
import { fmtDateTime } from "@/lib/utils";

type Props = {
  jobIds: string[];
  customerEmail: string;
  customerName: string;
  initialMessages: Message[];
};

export default function ComposeMessage({
  jobIds,
  customerEmail,
  customerName,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Scroll thread to bottom when messages change
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!body.trim()) return;
    if (channel === "email" && !subject.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobIds[0] ?? null,
          channel,
          subject: subject || null,
          body,
          sentBy: "Gordon Pro",
          customerEmail,
          customerName,
        }),
      });

      if (!res.ok) throw new Error("Send failed");

      const newMessage = (await res.json()) as Message;
      setMessages((prev) => [...prev, newMessage]);
      setSubject("");
      setBody("");
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  // Visible messages — exclude internal notes
  const visibleMessages = messages.filter((m) => m.direction !== "internal");

  return (
    <div
      className="bg-white rounded-2xl border p-5 mb-4"
      style={{ borderColor: "#E5E7EB" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="font-bold"
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize: "16px",
            color: "#1A1A1A",
          }}
        >
          Correspondence
        </span>
      </div>

      {/* Message thread */}
      <div
        ref={threadRef}
        className="space-y-3 mb-4 overflow-y-auto"
        style={{ maxHeight: 360 }}
      >
        {visibleMessages.length === 0 ? (
          <div
            className="py-6 text-center"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              color: "#888780",
            }}
          >
            No messages yet
          </div>
        ) : (
          visibleMessages.map((msg) => {
            if (msg.direction === "outbound") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div
                    className="rounded-2xl rounded-tr-sm px-4 py-3"
                    style={{ background: "#1C3A2B", maxWidth: "85%" }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "13px",
                        color: "white",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.body}
                    </p>
                    <p
                      className="text-right mt-1"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {fmtDateTime(msg.created_at)} · {msg.channel}
                    </p>
                  </div>
                </div>
              );
            }

            if (msg.direction === "inbound") {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{ background: "#F5F2ED", maxWidth: "85%" }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "13px",
                        color: "#4A4A4A",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.body}
                    </p>
                    <p
                      className="mt-1"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "11px",
                        color: "#888780",
                      }}
                    >
                      {fmtDateTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            }

            // internal
            return (
              <div key={msg.id} className="flex justify-center">
                <div
                  className="rounded-xl px-3 py-2"
                  style={{ background: "#FAEEDA", maxWidth: "90%" }}
                >
                  <p
                    className="uppercase mb-1"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "10px",
                      color: "#C8922A",
                    }}
                  >
                    Internal note
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize: "12px",
                      color: "#633806",
                      fontStyle: "italic",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Channel toggle */}
      <div className="flex gap-2 mb-3">
        {(["email", "sms"] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setChannel(ch)}
            className="px-4 py-1.5 rounded-full border transition-colors uppercase text-xs font-medium"
            style={{
              background: channel === ch ? "#1C3A2B" : "white",
              borderColor: channel === ch ? "#1C3A2B" : "#D3D1C7",
              color: channel === ch ? "white" : "#888780",
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
            }}
          >
            {ch === "email" ? "Email" : "SMS"}
          </button>
        ))}
      </div>

      {/* Compose area */}
      {channel === "email" && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject..."
          className="w-full border rounded-lg px-3 py-2 mb-2 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
          style={{
            borderColor: "#D3D1C7",
            fontFamily: "var(--font-inter)",
            fontSize: "14px",
          }}
        />
      )}

      <textarea
        rows={3}
        value={body}
        onChange={(e) =>
          setBody(channel === "sms" ? e.target.value.slice(0, 160) : e.target.value)
        }
        placeholder={channel === "email" ? "Write your message..." : "Write your SMS..."}
        className="w-full border rounded-xl px-3 py-2 mb-2 outline-none focus:ring-2 focus:ring-[#1C3A2B] resize-none"
        style={{
          borderColor: "#D3D1C7",
          fontFamily: "var(--font-inter)",
          fontSize: "14px",
        }}
      />

      {channel === "sms" && (
        <p
          className="text-right mb-2"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            color: body.length >= 160 ? "#DC2626" : "#888780",
          }}
        >
          {body.length}/160
        </p>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={sending || !body.trim() || (channel === "email" && !subject.trim())}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-medium transition-opacity disabled:opacity-60"
        style={{
          background: "#1C3A2B",
          fontFamily: "var(--font-inter)",
          fontSize: "14px",
        }}
      >
        {sending ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Sending...
          </>
        ) : channel === "email" ? (
          <>
            <Mail size={15} />
            Send Email
          </>
        ) : (
          <>
            <MessageSquare size={15} />
            Send SMS
          </>
        )}
      </button>

      {error && (
        <p
          className="mt-2 text-center"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "13px",
            color: "#DC2626",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
