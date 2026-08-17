import { ImageResponse } from "next/og";

// The card WhatsApp, LinkedIn and Facebook render when anyone shares a
// Kifurushi link. Until this existed, every share was a bare grey URL — and
// shared links in diaspora WhatsApp groups are the whole distribution
// strategy right now. Generated at the edge so there's no binary asset to
// keep in the repo; Twitter falls back to this image automatically.

export const runtime = "edge";
export const alt =
  "Kifurushi — send parcels home with verified travellers between Africa and the diaspora";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const KENTE = ["#E85D26", "#F2B705", "#0B3B2E", "#1E6B4F"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0B3B2E",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Kente strip */}
        <div style={{ display: "flex", height: 18 }}>
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              style={{ flex: 1, backgroundColor: KENTE[i % KENTE.length] }}
            />
          ))}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 90px",
          }}
        >
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700 }}>
            Kifurushi<span style={{ color: "#E85D26" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 38,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.92)",
              maxWidth: 900,
            }}
          >
            Send parcels home with verified travellers — or earn from your
            spare kilos when you fly.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 44,
              fontSize: 30,
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "#E85D26",
                borderRadius: 14,
                padding: "12px 26px",
                fontWeight: 700,
              }}
            >
              Free during launch
            </div>
            <div style={{ display: "flex", color: "#F2B705", fontWeight: 700 }}>
              kifurushiapp.com
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            padding: "0 90px 44px",
            fontSize: 26,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          54 African countries · 22 diaspora destinations · ID-verified · 0%
          commission
        </div>
      </div>
    ),
    size
  );
}
