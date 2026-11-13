import { ImageResponse } from "next/og";
import { portfolio as P } from "@/content/portfolio";

export const alt = `${P.name}, ${P.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The link preview: monochrome, like the site. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f6f5f2",
          color: "#111",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#666", letterSpacing: 4, textTransform: "uppercase" }}>
          <span>{P.role}</span>
          <span>{P.location}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 600, letterSpacing: -6, lineHeight: 1 }}>{`${P.name}.`}</div>
          <div style={{ marginTop: 32, fontSize: 38, color: "#333", maxWidth: 940, lineHeight: 1.3 }}>{P.tagline}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#666", borderTop: "2px solid #ddd", paddingTop: 24 }}>
          <span>{`${P.years}+ years · React · Next.js · TypeScript`}</span>
          <span>{P.site.replace(/^https?:\/\/(www\.)?/, "")}</span>
        </div>
      </div>
    ),
    size,
  );
}
