"use client";

import { useRef, useEffect, useState } from "react";

type Props = {
  onSignature: (dataUrl: string | null) => void;
};

export default function SignaturePad({ onSignature }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);
  const onSignatureRef = useRef(onSignature);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    onSignatureRef.current = onSignature;
  }, [onSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function getXY(e: MouseEvent | Touch) {
      const r = canvas!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function onMouseDown(e: MouseEvent) {
      isDrawing.current = true;
      const { x, y } = getXY(e);
      ctx!.beginPath();
      ctx!.moveTo(x, y);
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDrawing.current) return;
      const { x, y } = getXY(e);
      ctx!.lineTo(x, y);
      ctx!.stroke();
      if (!hasDrawn.current) {
        hasDrawn.current = true;
        setIsEmpty(false);
      }
    }

    function onMouseUp() {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      if (hasDrawn.current) {
        onSignatureRef.current(canvas!.toDataURL("image/png"));
      }
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      isDrawing.current = true;
      const { x, y } = getXY(e.touches[0]);
      ctx!.beginPath();
      ctx!.moveTo(x, y);
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (!isDrawing.current) return;
      const { x, y } = getXY(e.touches[0]);
      ctx!.lineTo(x, y);
      ctx!.stroke();
      if (!hasDrawn.current) {
        hasDrawn.current = true;
        setIsEmpty(false);
      }
    }

    function onTouchEnd() {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      if (hasDrawn.current) {
        onSignatureRef.current(canvas!.toDataURL("image/png"));
      }
    }

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasDrawn.current = false;
    setIsEmpty(true);
    onSignatureRef.current(null);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: 200,
          border: "1.5px solid #D3D1C7",
          borderRadius: 12,
          background: "white",
          cursor: "crosshair",
          display: "block",
          touchAction: "none",
        }}
      />
      <div className="flex items-center justify-between mt-2">
        <span
          style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#888780" }}
        >
          Sign above
        </span>
        {!isEmpty && (
          <button
            type="button"
            onClick={clear}
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              color: "#888780",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
