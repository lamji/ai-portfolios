"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

export function Experience() {
  return (
    <div className="stage" aria-hidden>
      <Scene />
    </div>
  );
}
