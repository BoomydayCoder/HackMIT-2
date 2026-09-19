"use client";

import { useEffect, useState } from "react";

const DURATION = 900;

/** Counts the topic rating up to its new value, with a "+N" rising off it. */
export default function RatingGain({ from, to }: { from: number; to: number }) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (to <= from) {
      setValue(to);
      return;
    }
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now: number) {
      const progress = Math.min(1, (now - start) / DURATION);
      setValue(Math.round(from + (to - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [from, to]);

  return (
    <span className="rating-gain">
      <span className="rating-gain-value">{value}</span>
      {to > from && <span className="rating-gain-delta">+{to - from}</span>}
    </span>
  );
}
