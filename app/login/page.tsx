"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError,   setLoginError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoginError("Invalid email or password");
      setLoginLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#1C3A2B" }}
    >
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/gptslogo.png"
            alt="Gordon Pro Tree Service logo"
            className="mx-auto object-contain"
            style={{ width: 96, height: 96 }}
          />
          <h1
            className="font-bold mt-4"
            style={{ fontFamily: "var(--font-oswald)", color: "#1C3A2B", fontSize: "24px" }}
          >
            Gordon Pro
          </h1>
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-inter)", color: "#888780", fontSize: "14px" }}
          >
            Admin Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block font-medium mb-1"
              style={{ fontFamily: "var(--font-inter)", color: "#4A4A4A", fontSize: "14px" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2"
              style={{
                borderColor: "#D3D1C7",
                fontFamily: "var(--font-inter)",
                fontSize: "15px",
                // @ts-expect-error CSS custom property
                "--tw-ring-color": "#1C3A2B",
              }}
              autoFocus
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-medium mb-1"
              style={{ fontFamily: "var(--font-inter)", color: "#4A4A4A", fontSize: "14px" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2"
              style={{
                borderColor: "#D3D1C7",
                fontFamily: "var(--font-inter)",
                fontSize: "15px",
                // @ts-expect-error CSS custom property
                "--tw-ring-color": "#1C3A2B",
              }}
              required
            />
          </div>

          {loginError && (
            <p style={{ fontFamily: "var(--font-inter)", color: "#DC2626", fontSize: "13px" }}>
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 rounded-xl text-white uppercase tracking-wide transition-colors disabled:opacity-60"
            style={{
              background: "#1C3A2B",
              fontFamily: "var(--font-oswald)",
              fontSize: "15px",
            }}
          >
            {loginLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
