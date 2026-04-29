"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Props = {
  urls: string[];
};

export default function PhotoLightbox({ urls }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <button
            key={url}
            onClick={() => setOpenIndex(i)}
            className="aspect-square overflow-hidden rounded-xl border cursor-pointer hover:opacity-80 transition-opacity"
            style={{ borderColor: "#E5E7EB" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setOpenIndex(null)}
        >
          <button
            onClick={() => setOpenIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <X size={24} style={{ color: "white" }} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[openIndex]}
            alt={`Photo ${openIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
