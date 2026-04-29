"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Crosshair } from "lucide-react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// ─── Types ────────────────────────────────────────────────────────────────────

type CircleType = "Service" | "Hazard";

type Circle = {
  id:     string;
  type:   CircleType;
  lat:    number;
  lng:    number;
  radius: number; // feet
  label:  string;
  note:   string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const CIRCLE_TYPES: {
  type:          CircleType;
  color:         string;
  fillOpacity:   number;
  strokeOpacity: number;
  activeBg:      string;
  borderColor:   string;
  labelColor:    string;
  description:   string;
}[] = [
  {
    type:          "Service",
    color:         "#C8922A",
    fillOpacity:   0.15,
    strokeOpacity: 0.85,
    activeBg:      "#FEF3C7",
    borderColor:   "#C8922A",
    labelColor:    "#C8922A",
    description:   "Area to be serviced",
  },
  {
    type:          "Hazard",
    color:         "#E24B4A",
    fillOpacity:   0.15,
    strokeOpacity: 0.85,
    activeBg:      "#FCEBEB",
    borderColor:   "#E24B4A",
    labelColor:    "#E24B4A",
    description:   "Hazard or caution area",
  },
];

function configForType(type: CircleType) {
  return CIRCLE_TYPES.find((c) => c.type === type)!;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

function metersToPixels(meters: number, lat: number, zoom: number): number {
  const earthCircumference = 40075017;
  const latRadians         = lat * (Math.PI / 180);
  const metersPerPixel     =
    (earthCircumference * Math.cos(latRadians)) / Math.pow(2, zoom + 8);
  return meters / metersPerPixel;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapDemoPage() {
  const mapContainerRef   = useRef<HTMLDivElement>(null);
  const mapRef            = useRef<mapboxgl.Map | null>(null);
  const geocodedCenterRef = useRef<[number, number] | null>(null);

  const [circles, setCircles]           = useState<Circle[]>([]);
  const [selectedType, setSelectedType] = useState<CircleType | null>(null);
  const [radius, setRadius]             = useState(15);
  const [address, setAddress]           = useState("");
  const [toastVisible, setToastVisible] = useState(true);

  const selectedTypeRef = useRef<CircleType | null>(null);
  selectedTypeRef.current = selectedType;

  const radiusRef = useRef<number>(radius);
  radiusRef.current = radius;

  const addCircleToMap = useCallback((circle: Circle, map: mapboxgl.Map) => {
    const cfg      = configForType(circle.type);
    const meters   = feetToMeters(circle.radius);
    const sourceId = `circle-${circle.id}`;
    const layerId  = `layer-${circle.id}`;

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type:        "Point",
          coordinates: [circle.lng, circle.lat],
        },
        properties: { id: circle.id, type: circle.type },
      },
    });

    map.addLayer({
      id:     layerId,
      type:   "circle",
      source: sourceId,
      paint:  {
        "circle-radius": {
          stops: [[0, 0], [20, metersToPixels(meters, circle.lat, 20)]],
          base:  2,
        },
        "circle-color":          cfg.color,
        "circle-opacity":        cfg.fillOpacity,
        "circle-stroke-width":   2,
        "circle-stroke-color":   cfg.color,
        "circle-stroke-opacity": cfg.strokeOpacity,
      },
    });
  }, []);

  // Init map
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

    map.on("click", (e) => {
      const type = selectedTypeRef.current;
      if (!type) return;

      const { lng, lat } = e.lngLat;
      const circle: Circle = {
        id:     crypto.randomUUID(),
        type,
        lat,
        lng,
        radius: radiusRef.current,
        label:  "",
        note:   "",
      };

      setCircles((prev) => [...prev, circle]);
      setToastVisible(false);

      if (map.loaded()) {
        addCircleToMap(circle, map);
      } else {
        map.once("load", () => addCircleToMap(circle, map));
      }
    });

    mapRef.current = map;

    return () => { map.remove(); };
  }, [addCircleToMap]);

  async function flyToAddress() {
    if (!address.trim() || !mapRef.current) return;

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${mapboxgl.accessToken}&country=US`;

    try {
      const res  = await fetch(url);
      const data = (await res.json()) as { features?: { center: [number, number] }[] };
      const feature = data.features?.[0];
      if (!feature) return;

      const [lng, lat] = feature.center;
      geocodedCenterRef.current = [lng, lat];
      mapRef.current.flyTo({ center: [lng, lat], zoom: 19, pitch: 0 });
    } catch {
      // silently ignore geocoding errors
    }
  }

  function recenter() {
    if (!geocodedCenterRef.current || !mapRef.current) return;
    mapRef.current.flyTo({
      center:  geocodedCenterRef.current,
      zoom:    19,
      pitch:   0,
      bearing: 0,
    });
  }

  function removeCircle(id: string) {
    const map = mapRef.current;
    if (map) {
      const layerId  = `layer-${id}`;
      const sourceId = `circle-${id}`;
      if (map.getLayer(layerId))   map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
    setCircles((prev) => prev.filter((c) => c.id !== id));
  }

  function updateCircle(id: string, changes: Partial<Pick<Circle, "label" | "note">>) {
    setCircles((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }

  function updateCircleRadius(id: string, lat: number, newRadius: number) {
    setCircles((prev) => prev.map((c) => (c.id === id ? { ...c, radius: newRadius } : c)));
    const map = mapRef.current;
    if (!map) return;
    const meters = feetToMeters(newRadius);
    map.setPaintProperty(`layer-${id}`, "circle-radius", {
      stops: [[0, 0], [20, metersToPixels(meters, lat, 20)]],
      base:  2,
    });
  }

  return (
    <div
      className="flex flex-col md:flex-row"
      style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}
    >
      {/* ── Left Panel ── */}
      <div
        className="w-full md:w-[340px] flex-shrink-0 overflow-y-auto"
        style={{ background: "white", borderRight: "1px solid #E5E7EB", order: 2 }}
      >
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <h2
            className="font-bold"
            style={{ fontFamily: "var(--font-oswald)", fontSize: "18px", color: "#1A1A1A" }}
          >
            Site Map
          </h2>
          <p
            className="mt-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
          >
            Draw circles to mark service and hazard areas
          </p>
        </div>

        {/* Address Search */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <label
            className="block mb-2 font-medium"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
          >
            Property Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && flyToAddress()}
              placeholder="123 Main St, Gainesville, GA"
              className="flex-1 border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1C3A2B]"
              style={{ borderColor: "#D3D1C7", fontFamily: "var(--font-inter)", fontSize: "14px" }}
            />
            <button
              onClick={flyToAddress}
              className="px-4 py-2.5 rounded-xl text-white font-medium flex-shrink-0"
              style={{ background: "#1C3A2B", fontFamily: "var(--font-inter)", fontSize: "14px" }}
            >
              Fly To
            </button>
          </div>
        </div>

        {/* Circle Type Selector */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <label
            className="block font-medium mb-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
          >
            Circle Type
          </label>
          <p
            className="mb-3"
            style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
          >
            Select a type then click the map to draw a circle
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {CIRCLE_TYPES.map(({ type, activeBg, borderColor, labelColor, description }) => {
              const isActive = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(isActive ? null : type)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors"
                  style={{
                    border:     `1.5px solid ${isActive ? borderColor : "#E5E7EB"}`,
                    background: isActive ? activeBg : "white",
                  }}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width:      22,
                      height:     22,
                      background: `color-mix(in srgb, ${configForType(type).color} 15%, transparent)`,
                      border:     `2px solid ${configForType(type).color}`,
                    }}
                  />
                  <span
                    className="font-bold"
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize:   "12px",
                      color:      isActive ? labelColor : "#4A4A4A",
                    }}
                  >
                    {type}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter)",
                      fontSize:   "10px",
                      color:      "#888780",
                      textAlign:  "center",
                      lineHeight: 1.3,
                    }}
                  >
                    {description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Radius Slider */}
          <label
            className="block font-medium mb-2"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
          >
            Circle Size
          </label>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "#C8922A" }}
          />
          <p
            className="text-right mt-1"
            style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#888780" }}
          >
            {radius} ft
          </p>
        </div>

        {/* Circle List */}
        <div className="px-5 py-4">
          <label
            className="block font-medium mb-3"
            style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
          >
            Circles ({circles.length})
          </label>

          {circles.length === 0 ? (
            <p
              className="text-center py-4"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
            >
              No circles yet — click the map to add one
            </p>
          ) : (
            <div className="space-y-2">
              {circles.map((circle) => {
                const cfg = configForType(circle.type);
                return (
                  <div
                    key={circle.id}
                    className="rounded-xl p-3"
                    style={{ background: "white", border: "1px solid #E5E7EB" }}
                  >
                    {/* Type header */}
                    <div className="flex gap-2 items-center mb-2">
                      <div
                        className="rounded-full flex-shrink-0"
                        style={{
                          width:      16,
                          height:     16,
                          background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
                          border:     `2px solid ${cfg.color}`,
                        }}
                      />
                      <span
                        className="font-bold"
                        style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: cfg.labelColor }}
                      >
                        {circle.type}
                      </span>
                    </div>

                    {/* Per-circle radius slider */}
                    <div className="mb-1">
                      <div className="flex justify-between mb-1">
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#888780" }}>
                          Radius
                        </span>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#888780" }}>
                          {circle.radius} ft
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={200}
                        step={5}
                        value={circle.radius}
                        onChange={(e) => updateCircleRadius(circle.id, circle.lat, Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: cfg.borderColor }}
                      />
                    </div>

                    {/* Label */}
                    <input
                      type="text"
                      value={circle.label}
                      onChange={(e) => updateCircle(circle.id, { label: e.target.value })}
                      placeholder="Add a label..."
                      className="w-full mt-2 px-1 py-1 bg-transparent outline-none"
                      style={{
                        borderBottom: "1px solid #E5E7EB",
                        fontFamily:   "var(--font-inter)",
                        fontSize:     "13px",
                        color:        "#1A1A1A",
                      }}
                    />

                    {/* Note */}
                    <textarea
                      rows={2}
                      value={circle.note}
                      onChange={(e) => updateCircle(circle.id, { note: e.target.value })}
                      placeholder="Add a note..."
                      className="w-full mt-1 px-1 py-1 bg-transparent outline-none resize-none"
                      style={{
                        borderBottom: "1px solid #E5E7EB",
                        fontFamily:   "var(--font-inter)",
                        fontSize:     "12px",
                        color:        "#888780",
                      }}
                    />

                    {/* Remove */}
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeCircle(circle.id)}
                        style={{
                          fontFamily: "var(--font-inter)",
                          fontSize:   "12px",
                          color:      "#E24B4A",
                          cursor:     "pointer",
                          background: "none",
                          border:     "none",
                          padding:    0,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Map Panel ── */}
      <div className="flex-1 relative" style={{ minHeight: "50vh", order: 1 }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {/* Re-center button */}
        <button
          type="button"
          onClick={recenter}
          style={{
            position:   "absolute",
            bottom:     16,
            left:       16,
            zIndex:     10,
            display:    "flex",
            alignItems: "center",
            gap:        6,
            background: "white",
            border:     "1px solid #E5E7EB",
            borderRadius: 8,
            padding:    "6px 12px",
            fontFamily: "var(--font-inter)",
            fontSize:   "13px",
            color:      "#4A4A4A",
            boxShadow:  "0 1px 4px rgba(0,0,0,0.12)",
            cursor:     "pointer",
          }}
        >
          <Crosshair size={14} />
          Re-center
        </button>

        {/* Instruction toast */}
        {toastVisible && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl shadow-lg px-4 py-2.5 pointer-events-none"
            style={{ background: "white", zIndex: 10 }}
          >
            <p
              className="flex items-center gap-2"
              style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#4A4A4A" }}
            >
              {selectedType ? (
                <>
                  <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{
                      width:      10,
                      height:     10,
                      background: `color-mix(in srgb, ${configForType(selectedType).color} 15%, transparent)`,
                      border:     `1.5px solid ${configForType(selectedType).color}`,
                    }}
                  />
                  Click anywhere on the map to draw a {selectedType} circle
                </>
              ) : (
                "Select a circle type to start marking the site"
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
