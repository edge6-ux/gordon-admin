"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Crosshair } from "lucide-react";
import type { SitePin, SitePinType } from "@/lib/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<SitePinType, { color: string; label: string }> = {
  Service: { color: "#1C3A2B", label: "Service" },
  Hazard:  { color: "#E24B4A", label: "Hazard"  },
};

const DEFAULT_RADIUS = 30;
const MIN_RADIUS     = 10;
const MAX_RADIUS     = 200;
const SOURCE_ID      = "site-circles";
const CIRCLE_LAYER   = "site-cl";
const LABEL_LAYER    = "site-ll";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function feetToMeters(ft: number): number {
  return ft * 0.3048;
}

function metersToPixels(meters: number, lat: number, zoom: number): number {
  const earthCirc = 40075016.686;
  const mpp =
    (earthCirc * Math.cos((lat * Math.PI) / 180)) / (256 * Math.pow(2, zoom));
  return meters / mpp;
}

function buildGeoJSON(pins: SitePin[]) {
  return {
    type: "FeatureCollection" as const,
    features: pins.map((pin, i) => ({
      type: "Feature" as const,
      properties: {
        id:          pin.id,
        label:       `Area ${i + 1}`,
        color:       TYPE_CONFIG[pin.type]?.color ?? TYPE_CONFIG.Service.color,
        pixelRadius: metersToPixels(feetToMeters(pin.radius ?? DEFAULT_RADIUS), pin.lat, 20),
      },
      geometry: {
        type:        "Point" as const,
        coordinates: [pin.lng, pin.lat],
      },
    })),
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  address:     string;
  initialPins: SitePin[];
  onChange?:   (pins: SitePin[]) => void;
  readOnly?:   boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SiteMap({ address, initialPins, onChange, readOnly = false }: Props) {
  const mapContainerRef   = useRef<HTMLDivElement>(null);
  const mapRef            = useRef<mapboxgl.Map | null>(null);
  const geocodedCenterRef = useRef<[number, number] | null>(null);
  const mapLoadedRef      = useRef(false);

  const [pins, setPins] = useState<SitePin[]>(() =>
    initialPins.map((p) => ({ ...p, radius: p.radius ?? DEFAULT_RADIUS }))
  );

  const pinsRef = useRef<SitePin[]>(pins);
  pinsRef.current = pins;

  // Sync map source + notify parent on every pins change
  useEffect(() => {
    if (mapRef.current && mapLoadedRef.current) {
      const src = mapRef.current.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      src?.setData(buildGeoJSON(pins));
    }
    onChange?.(pins);
  }, [pins, onChange]);

  const geocodeAndFly = useCallback(async (addr: string, map: mapboxgl.Map) => {
    if (!addr.trim()) return;
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        addr
      )}.json?access_token=${mapboxgl.accessToken}&country=US`;
      const res  = await fetch(url);
      const data = (await res.json()) as { features?: { center: [number, number] }[] };
      const feat = data.features?.[0];
      if (feat) {
        const [lng, lat] = feat.center;
        geocodedCenterRef.current = [lng, lat];
        map.flyTo({ center: [lng, lat], zoom: 19, pitch: 0 });
      }
    } catch {
      // ignore
    }
  }, []);

  // ─── Init map ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container:       mapContainerRef.current,
      style:           "mapbox://styles/mapbox/satellite-streets-v12",
      center:          [-83.8241, 34.2979],
      zoom:            12,
      pitch:           0,
      dragRotate:      false,
      pitchWithRotate: false,
      touchPitch:      false,
    });

    map.dragRotate.disable();
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapLoadedRef.current = true;

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: buildGeoJSON(pinsRef.current),
      });

      // Circle layer — color and radius both driven by feature properties
      map.addLayer({
        id:     CIRCLE_LAYER,
        type:   "circle",
        source: SOURCE_ID,
        paint: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "circle-color":          ["get", "color"] as any,
          "circle-opacity":        0.18,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "circle-stroke-color":   ["get", "color"] as any,
          "circle-stroke-width":   2,
          "circle-stroke-opacity": 0.85,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 0, 0, 20, ["get", "pixelRadius"]] as any,
        },
      });

      // Label layer — "Area N" text centered inside each circle
      map.addLayer({
        id:     LABEL_LAYER,
        type:   "symbol",
        source: SOURCE_ID,
        layout: {
          "text-field":            ["get", "label"],
          "text-size":             11,
          "text-anchor":           "center",
          "text-allow-overlap":    true,
          "text-ignore-placement": true,
          "text-font":             ["Open Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color":      "#FFFFFF",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "text-halo-color": ["get", "color"] as any,
          "text-halo-width": 1.5,
        },
      });

      if (!readOnly) {
        map.on("click", (e) => {
          const { lng, lat } = e.lngLat;
          const pin: SitePin = {
            id:     crypto.randomUUID(),
            type:   "Service",
            lat,
            lng,
            label:  "",
            note:   "",
            radius: DEFAULT_RADIUS,
          };
          setPins((prev) => [...prev, pin]);
        });
      }
    });

    mapRef.current = map;

    if (address) {
      map.once("load", () => geocodeAndFly(address, map));
    }

    return () => {
      mapLoadedRef.current = false;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocodeAndFly, readOnly]);

  // Re-geocode when address prop changes
  const prevAddressRef = useRef("");
  useEffect(() => {
    if (!mapRef.current || !address || address === prevAddressRef.current) return;
    prevAddressRef.current = address;
    geocodeAndFly(address, mapRef.current);
  }, [address, geocodeAndFly]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  function recenter() {
    if (!geocodedCenterRef.current || !mapRef.current) return;
    mapRef.current.flyTo({
      center:  geocodedCenterRef.current,
      zoom:    19,
      pitch:   0,
      bearing: 0,
    });
  }

  function removePin(id: string) {
    setPins((prev) => prev.filter((p) => p.id !== id));
  }

  function updateType(id: string, type: SitePinType) {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, type } : p)));
  }

  function updateRadius(id: string, lat: number, radiusFt: number) {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, radius: radiusFt } : p)));
  }

  function updateNote(id: string, note: string) {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, note } : p)));
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
      {/* Toolbar */}
      {!readOnly && (
        <div
          className="px-4 py-3"
          style={{ background: "#F9F9F8", borderBottom: "1px solid #E5E7EB" }}
        >
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}>
            Click the map to mark an area, then set it as Service or Hazard below.
          </p>
        </div>
      )}

      {/* Map */}
      <div className="relative" style={{ height: 320 }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
        <button
          type="button"
          onClick={recenter}
          style={{
            position:   "absolute",
            bottom:     12,
            left:       12,
            zIndex:     10,
            display:    "flex",
            alignItems: "center",
            gap:        6,
            background: "white",
            border:     "1px solid #E5E7EB",
            borderRadius: 8,
            padding:    "5px 10px",
            fontFamily: "var(--font-inter)",
            fontSize:   "12px",
            color:      "#4A4A4A",
            boxShadow:  "0 1px 4px rgba(0,0,0,0.12)",
            cursor:     "pointer",
          }}
        >
          <Crosshair size={13} />
          Re-center
        </button>
      </div>

      {/* Area list */}
      {pins.length > 0 && (
        <div className="p-4 space-y-3" style={{ borderTop: "1px solid #E5E7EB" }}>
          <p
            className="mb-1 font-semibold"
            style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#4A4A4A" }}
          >
            Areas ({pins.length})
          </p>

          {pins.map((pin, i) => {
            const cfg   = TYPE_CONFIG[pin.type] ?? TYPE_CONFIG.Service;
            const color = cfg.color;

            return (
              <div
                key={pin.id}
                className="rounded-lg p-3"
                style={{ border: `1px solid ${color}22` }}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                    style={{
                      width:      20,
                      height:     20,
                      background: color,
                      color:      "white",
                      fontFamily: "var(--font-inter)",
                      fontSize:   "10px",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    className="font-medium"
                    style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#1A1A1A" }}
                  >
                    Area {i + 1}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removePin(pin.id)}
                      className="ml-auto"
                      style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#E24B4A" }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Service / Hazard toggle */}
                {!readOnly && (
                  <div className="flex gap-2 mb-3">
                    {(Object.keys(TYPE_CONFIG) as SitePinType[]).map((t) => {
                      const isActive = pin.type === t;
                      const tcfg     = TYPE_CONFIG[t];
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateType(pin.id, t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            fontFamily:  "var(--font-inter)",
                            fontSize:    "12px",
                            fontWeight:  500,
                            border:      `1.5px solid ${isActive ? tcfg.color : "#E5E7EB"}`,
                            background:  isActive ? `${tcfg.color}18` : "white",
                            color:       isActive ? tcfg.color : "#888780",
                          }}
                        >
                          <div
                            className="rounded-full flex-shrink-0"
                            style={{
                              width:      8,
                              height:     8,
                              background: isActive ? tcfg.color : "#D1D5DB",
                            }}
                          />
                          {tcfg.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Read-only type badge */}
                {readOnly && (
                  <div className="mb-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{
                        background:  `${color}18`,
                        border:      `1px solid ${color}44`,
                        fontFamily:  "var(--font-inter)",
                        fontSize:    "12px",
                        fontWeight:  500,
                        color,
                      }}
                    >
                      <div
                        className="rounded-full flex-shrink-0"
                        style={{ width: 6, height: 6, background: color }}
                      />
                      {cfg.label}
                    </span>
                  </div>
                )}

                {/* Radius slider */}
                {!readOnly && (
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize:   "12px",
                        color:      "#888780",
                        whiteSpace: "nowrap",
                        minWidth:   52,
                      }}
                    >
                      {pin.radius ?? DEFAULT_RADIUS} ft
                    </span>
                    <input
                      type="range"
                      min={MIN_RADIUS}
                      max={MAX_RADIUS}
                      step={5}
                      value={pin.radius ?? DEFAULT_RADIUS}
                      onChange={(e) => updateRadius(pin.id, pin.lat, Number(e.target.value))}
                      className="flex-1"
                      style={{ accentColor: color }}
                    />
                  </div>
                )}

                {/* Note */}
                {readOnly ? (
                  <div>
                    {pin.note && (
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize:   "13px",
                          color:      "#888780",
                          fontStyle:  "italic",
                        }}
                      >
                        {pin.note}
                      </p>
                    )}
                    {pin.radius && (
                      <p
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize:   "12px",
                          color:      "#888780",
                          marginTop:  4,
                        }}
                      >
                        ~{pin.radius} ft radius
                      </p>
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    value={pin.note}
                    onChange={(e) => updateNote(pin.id, e.target.value)}
                    placeholder="Note... e.g. Large oak near fence, avoid power lines"
                    className="w-full px-3 py-2 rounded-lg outline-none resize-none"
                    style={{
                      border:     `1px solid ${color}44`,
                      fontFamily: "var(--font-inter)",
                      fontSize:   "13px",
                      color:      "#1A1A1A",
                      outline:    "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 2px ${color}33`; }}
                    onBlur={(e)  => { e.currentTarget.style.boxShadow = "none"; }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
