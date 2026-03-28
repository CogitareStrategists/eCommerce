"use client";

export default function AutoScrollRow({
  children,
  seconds = 25,
}: {
  children: React.ReactNode;
  seconds?: number;
}) {
  return (
    <div className="marquee">
      <div className="marqueeTrack" style={{ animationDuration: `${seconds}s` }}>
        {children}
        {children}
      </div>
    </div>
  );
}