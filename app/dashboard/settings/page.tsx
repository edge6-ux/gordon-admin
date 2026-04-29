"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Notifications = {
  newSubmission:   boolean;
  jobStatusChange: boolean;
  quoteAccepted:   boolean;
  newMessage:      boolean;
};

type Settings = {
  businessName:           string;
  businessPhone:          string;
  businessEmail:          string;
  businessAddress:        string;
  website:                string;
  fieldAppUrl:            string;
  counties:               string[];
  serviceRadius:          string;
  cardFeePercent:         number;
  cancellationFeePercent: number;
  defaultSalesRep:        string;
  notifications:          Notifications;
};

// ─── Shared field styles ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter)",
  fontSize:   "13px",
  color:      "#4A4A4A",
  fontWeight: 500,
  display:    "block",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width:        "100%",
  border:       "1px solid #D3D1C7",
  borderRadius: 12,
  padding:      "10px 14px",
  fontFamily:   "var(--font-inter)",
  fontSize:     "14px",
  color:        "#1A1A1A",
  outline:      "none",
  background:   "white",
  boxSizing:    "border-box",
};

const helperStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter)",
  fontSize:   "12px",
  color:      "#888780",
  marginTop:  4,
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily:    "var(--font-inter)",
  fontSize:      "11px",
  color:         "#888780",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  fontWeight:    600,
  paddingBottom: 12,
  borderBottom:  "1px solid #E5E7EB",
  marginBottom:  20,
};

const cardStyle: React.CSSProperties = {
  background:   "white",
  borderRadius: 16,
  border:       "1px solid #E5E7EB",
  padding:      24,
  marginBottom: 24,
  boxShadow:    "0 1px 3px rgba(0,0,0,0.05)",
};

// ─── Save button + indicator ──────────────────────────────────────────────────

function SaveButton({
  label,
  saved,
  onClick,
}: {
  label: string;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-end mt-4">
      <button
        type="button"
        onClick={onClick}
        style={{
          background:   "#1C3A2B",
          color:        "white",
          fontFamily:   "var(--font-inter)",
          fontSize:     "14px",
          fontWeight:   500,
          padding:      "10px 20px",
          borderRadius: 12,
          cursor:       "pointer",
          minWidth:     140,
        }}
      >
        {saved ? "Saved ✓" : label}
      </button>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        width:          44,
        height:         24,
        borderRadius:   12,
        background:     on ? "#1C3A2B" : "#D1D5DB",
        position:       "relative",
        flexShrink:     0,
        cursor:         "pointer",
        transition:     "background 150ms",
        border:         "none",
        padding:        0,
      }}
    >
      <span
        style={{
          position:     "absolute",
          top:          2,
          left:         on ? 22 : 2,
          width:        20,
          height:       20,
          borderRadius: "50%",
          background:   "white",
          boxShadow:    "0 1px 3px rgba(0,0,0,0.2)",
          transition:   "left 150ms",
        }}
      />
    </button>
  );
}

// ─── Number input with suffix ─────────────────────────────────────────────────

function NumberInputWithSuffix({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  value:    number;
  onChange: (v: number) => void;
  min:      number;
  max:      number;
  step:     number;
  suffix:   string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{ ...inputStyle, width: 100 }}
      />
      <span style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#4A4A4A" }}>
        {suffix}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    businessName:           "Gordon Pro Tree Service",
    businessPhone:          "(770) 271-6072",
    businessEmail:          "admin@gordonprotree.com",
    businessAddress:        "5662 Cemetery Rd, Lula, GA 30554",
    website:                "https://gordonprotreeservice.com",
    fieldAppUrl:            "",
    counties:               ["Hall", "Gwinnett", "Forsyth", "Barrow", "Jackson", "North Fulton"],
    serviceRadius:          "50",
    cardFeePercent:         3,
    cancellationFeePercent: 20,
    defaultSalesRep:        "",
    notifications: {
      newSubmission:   true,
      jobStatusChange: true,
      quoteAccepted:   true,
      newMessage:      true,
    },
  });

  const [savedBiz,     setSavedBiz]     = useState(false);
  const [savedArea,    setSavedArea]    = useState(false);
  const [savedPricing, setSavedPricing] = useState(false);
  const [savedNotifs,  setSavedNotifs]  = useState(false);

  const [pwCurrent,  setPwCurrent]  = useState("");
  const [pwNew,      setPwNew]      = useState("");
  const [pwConfirm,  setPwConfirm]  = useState("");
  const [pwError,    setPwError]    = useState("");
  const [pwSuccess,  setPwSuccess]  = useState(false);

  const [countyInput, setCountyInput] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: Settings) => setSettings(data))
      .catch(() => {});
  }, []);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function flashSaved(fn: (v: boolean) => void) {
    fn(true);
    setTimeout(() => fn(false), 2000);
  }

  async function saveSection(section: string, body: object) {
    await fetch("/api/admin/settings", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ section, ...body }),
    });
  }

  async function handleSaveBiz() {
    const { businessName, businessPhone, businessEmail, businessAddress, website, fieldAppUrl } = settings;
    await saveSection("businessInfo", { businessName, businessPhone, businessEmail, businessAddress, website, fieldAppUrl });
    flashSaved(setSavedBiz);
  }

  async function handleSaveArea() {
    await saveSection("serviceArea", { counties: settings.counties, serviceRadius: settings.serviceRadius });
    flashSaved(setSavedArea);
  }

  async function handleSavePricing() {
    const { cardFeePercent, cancellationFeePercent, defaultSalesRep } = settings;
    await saveSection("pricing", { cardFeePercent, cancellationFeePercent, defaultSalesRep });
    flashSaved(setSavedPricing);
  }

  async function handleSaveNotifs() {
    await saveSection("notifications", { notifications: settings.notifications });
    flashSaved(setSavedNotifs);
  }

  async function handleUpdatePassword() {
    setPwError("");
    setPwSuccess(false);

    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwError("All password fields are required");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New passwords do not match");
      return;
    }
    if (pwNew.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }

    const res = await fetch("/api/admin/settings/password", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
    });

    if (res.status === 401) {
      setPwError("Incorrect current password");
      return;
    }

    setPwSuccess(true);
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
  }

  function addCounty() {
    const trimmed = countyInput.trim();
    if (!trimmed || settings.counties.includes(trimmed)) return;
    set("counties", [...settings.counties, trimmed]);
    setCountyInput("");
  }

  function removeCounty(county: string) {
    set("counties", settings.counties.filter((c) => c !== county));
  }

  return (
    <div style={{ maxWidth: 672, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--font-oswald)",
            fontSize:   "24px",
            fontWeight: 700,
            color:      "#1A1A1A",
          }}
        >
          Settings
        </h1>
        <p style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#888780", marginTop: 4 }}>
          Manage business info and admin preferences
        </p>
      </div>

      {/* ── Section 1: Business Information ── */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Business Information</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Business Name</label>
            <input
              style={inputStyle}
              value={settings.businessName}
              onChange={(e) => set("businessName", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Business Phone</label>
            <input
              type="tel"
              style={inputStyle}
              value={settings.businessPhone}
              onChange={(e) => set("businessPhone", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Business Email</label>
            <input
              type="email"
              style={inputStyle}
              value={settings.businessEmail}
              onChange={(e) => set("businessEmail", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Business Address</label>
            <input
              style={inputStyle}
              value={settings.businessAddress}
              onChange={(e) => set("businessAddress", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Website</label>
            <input
              type="url"
              style={inputStyle}
              value={settings.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Field App URL</label>
            <input
              type="url"
              style={inputStyle}
              value={settings.fieldAppUrl}
              onChange={(e) => set("fieldAppUrl", e.target.value)}
            />
            <p style={helperStyle}>Used in customer emails and tracking links</p>
          </div>
        </div>

        <SaveButton label="Save Business Info" saved={savedBiz} onClick={handleSaveBiz} />
      </div>

      {/* ── Section 2: Service Area ── */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Service Area</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Counties Served</label>
            <p style={helperStyle}>Shown on the website and used for lead targeting</p>

            {/* Tag pills */}
            <div
              style={{
                display:    "flex",
                flexWrap:   "wrap",
                gap:        8,
                marginTop:  10,
                marginBottom: 10,
              }}
            >
              {settings.counties.map((county) => (
                <span
                  key={county}
                  style={{
                    display:      "inline-flex",
                    alignItems:   "center",
                    gap:          6,
                    background:   "#EAF3DE",
                    color:        "#27500A",
                    fontFamily:   "var(--font-inter)",
                    fontSize:     "13px",
                    padding:      "4px 12px",
                    borderRadius: 999,
                  }}
                >
                  {county}
                  <button
                    type="button"
                    onClick={() => removeCounty(county)}
                    style={{
                      color:      "#27500A",
                      cursor:     "pointer",
                      fontWeight: 700,
                      lineHeight: 1,
                      fontSize:   "14px",
                      background: "none",
                      border:     "none",
                      padding:    0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* County input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={countyInput}
                onChange={(e) => setCountyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCounty())}
                placeholder="Type a county and press Enter"
              />
              <button
                type="button"
                onClick={addCounty}
                style={{
                  background:   "#1C3A2B",
                  color:        "white",
                  border:       "none",
                  borderRadius: 12,
                  padding:      "10px 16px",
                  fontFamily:   "var(--font-inter)",
                  fontSize:     "14px",
                  cursor:       "pointer",
                  flexShrink:   0,
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Service Radius</label>
            <select
              value={settings.serviceRadius}
              onChange={(e) => set("serviceRadius", e.target.value)}
              style={{
                ...inputStyle,
                width:      200,
                appearance: "auto",
                cursor:     "pointer",
              }}
            >
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
              <option value="75">75 miles</option>
              <option value="100">100 miles</option>
            </select>
          </div>
        </div>

        <SaveButton label="Save Service Area" saved={savedArea} onClick={handleSaveArea} />
      </div>

      {/* ── Section 3: Pricing Defaults ── */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Pricing Defaults</div>
        <p
          style={{
            fontFamily:   "var(--font-inter)",
            fontSize:     "13px",
            color:        "#888780",
            marginBottom: 16,
          }}
        >
          These are starting values for new quotes. Sales agents can adjust per job.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Card / Debit Fee %</label>
            <NumberInputWithSuffix
              value={settings.cardFeePercent}
              onChange={(v) => set("cardFeePercent", v)}
              min={0}
              max={10}
              step={0.5}
              suffix="%"
            />
            <p style={helperStyle}>Applied when customer pays by card or debit</p>
          </div>

          <div>
            <label style={labelStyle}>Cancellation Fee %</label>
            <NumberInputWithSuffix
              value={settings.cancellationFeePercent}
              onChange={(v) => set("cancellationFeePercent", v)}
              min={0}
              max={50}
              step={5}
              suffix="%"
            />
            <p style={helperStyle}>Applied if job is cancelled by customer</p>
          </div>

          <div>
            <label style={labelStyle}>Default Sales Rep</label>
            <input
              style={inputStyle}
              value={settings.defaultSalesRep}
              onChange={(e) => set("defaultSalesRep", e.target.value)}
              placeholder="Name shown on new quotes by default"
            />
          </div>
        </div>

        <SaveButton label="Save Pricing Defaults" saved={savedPricing} onClick={handleSavePricing} />
      </div>

      {/* ── Section 4: Admin Password ── */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Admin Password</div>
        <p
          style={{
            fontFamily:   "var(--font-inter)",
            fontSize:     "13px",
            color:        "#888780",
            marginBottom: 16,
          }}
        >
          Update the password used to access this dashboard
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              style={inputStyle}
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              style={inputStyle}
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              style={inputStyle}
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <p style={helperStyle}>Minimum 8 characters</p>

          {pwError && (
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize:   "13px",
                color:      "#E24B4A",
              }}
            >
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p
              style={{
                fontFamily: "var(--font-inter)",
                fontSize:   "13px",
                color:      "#27500A",
              }}
            >
              Password updated ✓ — update ADMIN_PASSWORD in your environment variables to finalize.
            </p>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleUpdatePassword}
            style={{
              background:   "#1C3A2B",
              color:        "white",
              fontFamily:   "var(--font-inter)",
              fontSize:     "14px",
              fontWeight:   500,
              padding:      "10px 20px",
              borderRadius: 12,
              cursor:       "pointer",
            }}
          >
            Update Password
          </button>
        </div>
      </div>

      {/* ── Section 5: Notification Preferences ── */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Notification Preferences</div>
        <p
          style={{
            fontFamily:   "var(--font-inter)",
            fontSize:     "13px",
            color:        "#888780",
            marginBottom: 16,
          }}
        >
          Choose what activity triggers a notification in the dashboard
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(
            [
              {
                key:   "newSubmission" as const,
                label: "New Submission",
                desc:  "Alert when a new customer submission arrives",
              },
              {
                key:   "jobStatusChange" as const,
                label: "Job Status Change",
                desc:  "Alert when a job status is updated",
              },
              {
                key:   "quoteAccepted" as const,
                label: "Quote Accepted",
                desc:  "Alert when a customer accepts a quote",
              },
              {
                key:   "newMessage" as const,
                label: "New Message",
                desc:  "Alert when a customer replies to a message",
              },
            ] satisfies { key: keyof Notifications; label: string; desc: string }[]
          ).map(({ key, label, desc }) => (
            <div
              key={key}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize:   "14px",
                    color:      "#1A1A1A",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize:   "13px",
                    color:      "#888780",
                    marginTop:  2,
                  }}
                >
                  {desc}
                </p>
              </div>
              <Toggle
                on={settings.notifications[key]}
                onChange={(v) =>
                  set("notifications", { ...settings.notifications, [key]: v })
                }
              />
            </div>
          ))}
        </div>

        <SaveButton label="Save Preferences" saved={savedNotifs} onClick={handleSaveNotifs} />
      </div>
    </div>
  );
}
