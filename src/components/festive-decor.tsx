"use client";

import Image from "next/image";
import React from "react";

type FestiveDecorProps = {
  className?: string;
  bulbsSrc?: string; // path under /public
  capSrc?: string;   // path under /public
};

/**
 * Renders a festive bulbs garland across the top of a box and a santa cap
 * pinned at the top-right corner. Position this as a sibling to your Card
 * and give the Card a `relative` parent so overlays align correctly.
 */
export function FestiveDecor({
  className,
  bulbsSrc = "/holiday/bulbs.png",
  capSrc = "/holiday/santa-cap.png",
}: FestiveDecorProps) {
  return (
    <div className={"relative " + (className ?? "")} aria-hidden>
      {/* Bulbs banner across the top */}
      <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-[320px] sm:w-[420px] md:w-[520px]">
        <Image
          src={bulbsSrc}
          alt="Festive bulbs"
          width={520}
          height={60}
          priority
        />
      </div>

      {/* Santa cap at the top-right corner */}
      <div className="pointer-events-none absolute -top-12 -right-12 rotate-[7deg] z-10 w-[100px] sm:w-[120px]">
        <Image
          src={capSrc}
          alt="Santa cap"
          width={140}
          height={140}
          priority
        />
      </div>
    </div>
  );
}
