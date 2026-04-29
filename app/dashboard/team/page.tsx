"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Shield, Trash2, ChevronDown } from "lucide-react";
import { usePermissions } from "@/lib/permissions-context";
import { fmtDate } from "@/lib/utils";
import type { Role } from "@/lib/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamUser = {
  id:           string;
  email:        string;
  name:         string | null;
  role:         Role;
  created_at:   string;
  last_sign_in: string | null;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, { label: string; bg: string; color: string; description: string }> = {
  master_admin: { label: "Master Admin", bg: "#1C3A2B",  color: "white",    description: "Full access" },
  admin:        { label: "Admin",        bg: "#EAF3DE",  color: "#27500A",  description: "Assign & edit jobs, message customers" },
  sales:        { label: "Sales",        bg: "#E6F1FB",  color: "#185FA5",  description: "Create & manage quotes" },
  crew_leader:  { label: "Crew Leader",  bg: "#FEF3CD",  color: "#92400E",  description: "View all jobs & site maps" },
  crew_member:  { label: "Crew Member",  bg: "#F3F4F6",  color: "#4A4A4A",  description: "View assigned jobs" },
};

const ROLES: Role[] = ["master_admin", "admin", "sales", "crew_leader", "crew_member"];

// ─── Invite form ──────────────────────────────────────────────────────────────

function InviteForm({ onCreated }: { onCreated: (user: TeamUser) => void }) {
  const [open,     setOpen]     = useState(false);
  const [email,    setEmail]    = useState("");
  const [name,     setName]     = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<Role>("crew_member");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    setPassword(Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password, name, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create user");
      setLoading(false);
      return;
    }
    onCreated({ id: data.id, email, name: name || null, role, created_at: new Date().toISOString(), last_sign_in: null });
    setEmail(""); setName(""); setPassword(""); setRole("crew_member"); setOpen(false);
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white"
        style={{ background: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "14px" }}
      >
        <UserPlus size={16} />
        Invite User
      </button>
    );
  }

  return (
    <div
      className="bg-white rounded-2xl border p-5 mb-6"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold" style={{ fontFamily: "var(--font-oswald)", fontSize: "16px", color: "#1A1A1A" }}>
          Invite New User
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}>
            Email <span style={{ color: "#E24B4A" }}>*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
            style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "14px" }}
          />
        </div>

        <div>
          <label className="block mb-1" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
            style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "14px" }}
          />
        </div>

        <div>
          <label className="block mb-1" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}>
            Temporary Password <span style={{ color: "#E24B4A" }}>*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
              style={{ borderColor: "#D3D1C7", fontFamily: "monospace", fontSize: "14px" }}
            />
            <button
              type="button"
              onClick={generatePassword}
              className="px-3 py-2 rounded-xl border transition-colors hover:bg-[#F5F5F5]"
              style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "12px", color: "#4A4A4A", whiteSpace: "nowrap" }}
            >
              Generate
            </button>
          </div>
        </div>

        <div>
          <label className="block mb-1" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}>
            Role <span style={{ color: "#E24B4A" }}>*</span>
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
            style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "14px", color: "#1A1A1A" }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="md:col-span-2" style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#E24B4A" }}>
            {error}
          </p>
        )}

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-white disabled:opacity-60"
            style={{ background: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "14px" }}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const router      = useRouter();
  const permissions = usePermissions();

  const [users,      setUsers]      = useState<TeamUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [updating,   setUpdating]   = useState<string | null>(null);

  useEffect(() => {
    if (!permissions.canManageTeam) {
      router.replace("/dashboard");
      return;
    }
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data: TeamUser[]) => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [permissions, router]);

  async function updateRole(id: string, role: Role) {
    setUpdating(id);
    await fetch(`/api/admin/users/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ role }),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    setUpdating(null);
  }

  async function deleteUser(id: string) {
    setUpdating(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
    setUpdating(null);
    setConfirming(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-bold" style={{ fontFamily: "var(--font-oswald)", fontSize: "24px", color: "#1A1A1A" }}>
            Team
          </h1>
          <p className="mt-1" style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780" }}>
            {users.length} {users.length === 1 ? "member" : "members"}
          </p>
        </div>
        <InviteForm onCreated={(u) => setUsers((prev) => [u, ...prev])} />
      </div>

      {/* Invite form rendered above */}

      {/* Role legend */}
      <div className="flex gap-3 flex-wrap mb-5">
        {ROLES.map((r) => {
          const cfg = ROLE_CONFIG[r];
          return (
            <div key={r} className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full"
                style={{ background: cfg.bg, color: cfg.color, fontFamily: "var(--font-inter)", fontSize: "12px", fontWeight: 500 }}
              >
                <Shield size={11} className="mr-1" />
                {cfg.label}
              </span>
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}>
                — {cfg.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-gray-100 rounded-2xl h-16" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9F9F8" }}>
                {["User", "Role", "Joined", "Last Sign In", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left"
                    style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780", textTransform: "uppercase", fontWeight: 600 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const cfg          = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.crew_member;
                const isProcessing = updating === user.id;
                const isConfirming = confirming === user.id;

                return (
                  <tr
                    key={user.id}
                    style={{ borderTop: "1px solid #F3F4F6", opacity: isProcessing ? 0.5 : 1 }}
                  >
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#1A1A1A", fontWeight: 500 }}>
                        {user.name || <span style={{ color: "#888780" }}>—</span>}
                      </div>
                      <div style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}>
                        {user.email}
                      </div>
                    </td>

                    {/* Role selector */}
                    <td className="px-4 py-3.5">
                      <div className="relative inline-flex items-center">
                        <select
                          value={user.role}
                          disabled={isProcessing}
                          onChange={(e) => updateRole(user.id, e.target.value as Role)}
                          className="appearance-none pl-2.5 pr-7 py-1 rounded-full border-0 font-medium cursor-pointer"
                          style={{
                            background:  cfg.bg,
                            color:       cfg.color,
                            fontFamily:  "var(--font-inter)",
                            fontSize:    "12px",
                            outline:     "none",
                          }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                          ))}
                        </select>
                        <ChevronDown
                          size={11}
                          className="absolute right-2 pointer-events-none"
                          style={{ color: cfg.color }}
                        />
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3.5">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}>
                        {fmtDate(user.created_at)}
                      </span>
                    </td>

                    {/* Last sign in */}
                    <td className="px-4 py-3.5">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}>
                        {user.last_sign_in ? fmtDate(user.last_sign_in) : "Never"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#E24B4A" }}>
                            Remove user?
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteUser(user.id)}
                            disabled={isProcessing}
                            className="px-2.5 py-1 rounded-lg text-white"
                            style={{ background: "#E24B4A", fontFamily: "var(--font-inter)", fontSize: "12px" }}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="px-2.5 py-1 rounded-lg border"
                            style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "12px", color: "#4A4A4A" }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirming(user.id)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors hover:bg-[#FEF2F2]"
                          style={{ borderColor: "#E5E7EB", color: "#888780", fontFamily: "var(--font-inter)", fontSize: "12px" }}
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
