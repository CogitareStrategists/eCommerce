"use client";

// Simple image slider (no extra libraries)
import { useEffect, useState } from "react";

export default function HeroSlider({
  images,
  intervalMs = 2500,
}: {
  images: string[];
  intervalMs?: number;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!images?.length) return;
    const t = setInterval(() => {
      setIdx((v) => (v + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(t);
  }, [images, intervalMs]);

  const current = images?.[idx];

  return (
    <div className="relative h-[270px] w-full overflow-hidden rounded-3xl border border-black/10 bg-black/5 md:h-[336px]">
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt="Hero"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-black/40">
          Hero Slider
        </div>
      )}

      {/* subtle overlay for text readability if needed later */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
    </div>
  );
}