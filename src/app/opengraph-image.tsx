import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AION — ecosystem platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #155e75 100%)",
          color: "#e2e8f0",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 14, letterSpacing: "0.35em", color: "#22d3ee", fontWeight: 600 }}>
          AION
        </div>
        <div style={{ marginTop: 24, fontSize: 56, fontWeight: 700, color: "#f8fafc", lineHeight: 1.1 }}>
          Ecosystem platform
        </div>
        <div style={{ marginTop: 20, fontSize: 24, color: "#94a3b8", maxWidth: 720, lineHeight: 1.4 }}>
          Driver · releases · roadmap · control — public portal
        </div>
      </div>
    ),
    { ...size },
  );
}
