import { ImageResponse } from "next/og";

export const alt = "GatewaySync — Many Portals, One Gateway";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#0f172a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "#5b8def",
            }}
          >
            <div style={{ display: "flex", color: "white", fontSize: 52, fontWeight: 700 }}>
              G
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 600, color: "white" }}>
            Gateway<span style={{ color: "#5b8def" }}>Sync</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#94a3b8" }}>
          Many Portals, One Gateway
        </div>
      </div>
    ),
    { ...size }
  );
}
