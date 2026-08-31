import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont();

/* ══════════════════════════════════════════════════════════════════════════
   TravTrack · "Jastip" Feature Launch — 30s · 9:16 (1080×1920) · 30fps
   6 shots × 150 frames = 900 frames.  Problem → Solution → Proof → CTA.
   Product UI (shots 3–5) is recreated pixel-faithfully from the app mockup.
   ══════════════════════════════════════════════════════════════════════════ */

// ─── Palette (storyboard + app mockup, reconciled) ───────────────────────────
const C = {
  gold:      "#DB9F5C",
  goldSoft:  "rgba(219,159,92,0.12)",
  goldSoft2: "rgba(219,159,92,0.22)",
  ink:       "#1A1A1E",
  offwhite:  "#F7F5F2",
  surface:   "#EEEEF0", // app screen bg
  card:      "#F5F5F7",
  divider:   "#E2E2E6",
  text:      "#1C1C2A",
  sub:       "#8A8F98",
  green:     "#3BA55D",
  greenApp:  "#4CAF82",
  coral:     "#E86A5C",
  blue:      "#5E82DC",
  white:     "#FFFFFF",
} as const;

const f = (
  size: number,
  weight = 600,
  color: string = C.text,
): React.CSSProperties => ({
  fontFamily,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.25,
});

const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

const ec = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const OUT = Easing.bezier(0.4, 0, 0.2, 1); // base ease-in-out

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const sfx = (name: string) => staticFile(`sfx/${name}`);

// ─── 2% film grain (deterministic) ───────────────────────────────────────────
const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <AbsoluteFill
    style={{ opacity, pointerEvents: "none", mixBlendMode: "overlay" }}
  >
    <svg width="100%" height="100%">
      <filter id="grainNoise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#grainNoise)" />
    </svg>
  </AbsoluteFill>
);

// ─── Soft ambient blob ───────────────────────────────────────────────────────
const Blob: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  frame: number;
  phase?: number;
  amp?: number;
}> = ({ x, y, size, color, frame, phase = 0, amp = 40 }) => (
  <div
    style={{
      position: "absolute",
      left: x + Math.sin(frame * 0.016 + phase) * amp,
      top: y + Math.cos(frame * 0.019 + phase) * amp * 1.3,
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      pointerEvents: "none",
    }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════
//  APP UI ATOMS  (recreated from trip_detail_jastip.html, scaled ~1.4×)
// ═══════════════════════════════════════════════════════════════════════════

const SW = 540; // app screen content width

// -- small svg icon helpers --
const IconStroke: React.FC<{
  d: React.ReactNode;
  size: number;
  color: string;
  sw?: number;
}> = ({ d, size, color, sw = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
);

const PinIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
  </svg>
);

// ── Phone frame (dark bezel + notch) ──────────────────────────────────────────
const Phone: React.FC<{
  children?: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ children, width = SW, height = 1150, style }) => {
  const r = width * 0.115;
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        backgroundColor: C.surface,
        borderRadius: r,
        border: `13px solid #17171A`,
        boxShadow: [
          "0 0 0 2px #3a3a3e",
          "0 40px 110px rgba(0,0,0,0.30)",
          "0 8px 24px rgba(0,0,0,0.14)",
        ].join(","),
        overflow: "hidden",
        ...style,
      }}
    >
      {/* notch */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          width: width * 0.32,
          height: 30,
          background: "#17171A",
          borderRadius: 18,
          zIndex: 100,
        }}
      />
      {children}
    </div>
  );
};

// ── Status bar ────────────────────────────────────────────────────────────────
const StatusBar: React.FC = () => (
  <div
    style={{
      height: 60,
      flexShrink: 0,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      padding: "0 30px 6px",
      background: C.surface,
    }}
  >
    <span style={{ ...f(15, 700, C.text), ...tnum }}>9:41</span>
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <svg width={26} height={14} viewBox="0 0 20 14">
        <rect x="0" y="8" width="3" height="6" rx="0.5" fill={C.text} />
        <rect x="4.5" y="5" width="3" height="9" rx="0.5" fill={C.text} />
        <rect x="9" y="2" width="3" height="12" rx="0.5" fill={C.text} />
        <rect x="13.5" y="0" width="3" height="14" rx="0.5" fill={C.text} />
      </svg>
      <svg width={24} height={13} viewBox="0 0 24 13">
        <rect x="0" y="1" width="20" height="11" rx="3" fill="none" stroke={C.text} strokeWidth="1.4" opacity="0.6" />
        <rect x="2" y="3" width="15" height="7" rx="1.5" fill={C.green} />
        <rect x="21" y="4" width="2" height="5" rx="1" fill={C.text} opacity="0.6" />
      </svg>
    </div>
  </div>
);

// ── Top bar (Tokyo Adventure) ─────────────────────────────────────────────────
const TopBar: React.FC = () => (
  <div
    style={{
      background: C.surface,
      padding: "14px 26px 16px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 19,
        background: C.card,
        boxShadow: "0 1px 5px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <IconStroke size={24} color={C.text} sw={2.6} d={<polyline points="15 18 9 12 15 6" />} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...f(21, 800, C.text), display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22 }}>🗼</span>
        <span>Tokyo Adventure</span>
      </div>
      <div style={{ ...f(15, 500, C.sub), marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
        <PinIcon size={15} color={C.sub} />
        Tokyo, Japan · Mar 15 – 22
      </div>
    </div>
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 19,
        background: C.card,
        boxShadow: "0 1px 5px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <IconStroke
        size={22}
        color={C.text}
        sw={2.2}
        d={
          <>
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </>
        }
      />
    </div>
  </div>
);

// ── 5-tab bar (Jastip active) ─────────────────────────────────────────────────
const gift = (
  <>
    <path d="M20 12V22H4V12" />
    <path d="M22 7H2v5h20V7z" />
    <path d="M12 22V7" />
    <path d="M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z" />
  </>
);

const TripTabBar: React.FC = () => {
  const tabs = [
    { label: "Summary", d: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></> },
    { label: "Expenses", d: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></> },
    { label: "Itinerary", d: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
    { label: "Budget", d: <><path d="M21 4H3v16h18V4z" /><path d="M9 9h6M9 13h4" /></> },
    { label: "Jastip", d: gift, active: true },
  ];
  return (
    <div
      style={{
        height: 74,
        background: C.surface,
        display: "flex",
        borderBottom: `1px solid ${C.divider}`,
        flexShrink: 0,
      }}
    >
      {tabs.map((t) => (
        <div
          key={t.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            position: "relative",
            color: t.active ? C.gold : C.sub,
          }}
        >
          <IconStroke size={24} color={t.active ? C.gold : C.sub} sw={2} d={t.d} />
          <span style={{ ...f(13, 700), color: t.active ? C.gold : C.sub }}>{t.label}</span>
          {t.active && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "12%",
                right: "12%",
                height: 3,
                background: C.gold,
                borderRadius: "3px 3px 0 0",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Inner tabs (Items | Owed) + Share Live pill ───────────────────────────────
const InnerTabRow: React.FC<{ active: "items" | "owed"; frame: number }> = ({
  active,
  frame,
}) => {
  const pulse = (Math.sin(frame * 0.12) + 1) / 2; // 0..1
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 12px 0 20px",
        borderBottom: `1px solid ${C.divider}`,
        background: C.surface,
        flexShrink: 0,
        gap: 8,
      }}
    >
      <div style={{ display: "flex", flex: 1 }}>
        {(["items", "owed"] as const).map((t) => (
          <div
            key={t}
            style={{
              flex: 1,
              height: 62,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...f(18, 700),
              color: active === t ? C.gold : C.sub,
              position: "relative",
              textTransform: "capitalize",
            }}
          >
            {t}
            {active === t && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "10%",
                  right: "10%",
                  height: 3,
                  background: C.gold,
                  borderRadius: "3px 3px 0 0",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          flexShrink: 0,
          height: 42,
          padding: "0 16px 0 13px",
          borderRadius: 21,
          background: C.goldSoft,
          border: `1.5px solid ${C.goldSoft2}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ position: "relative", width: 9, height: 9 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.green }} />
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: C.green,
              opacity: (1 - pulse) * 0.5,
              transform: `scale(${0.6 + pulse * 1.3})`,
            }}
          />
        </div>
        <IconStroke
          size={17}
          color={C.gold}
          sw={2.2}
          d={
            <>
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </>
          }
        />
        <span style={{ ...f(15, 700, C.gold) }}>Share</span>
      </div>
    </div>
  );
};

// ── Grouping / filter selects ─────────────────────────────────────────────────
const Controls: React.FC = () => (
  <div style={{ padding: "14px 20px 8px", display: "flex", gap: 12, background: C.surface, flexShrink: 0 }}>
    <div
      style={{
        flex: 1,
        height: 54,
        padding: "0 16px",
        borderRadius: 17,
        background: C.card,
        border: `1.5px solid ${C.divider}`,
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}
    >
      <IconStroke
        size={18}
        color={C.sub}
        d={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>}
      />
      <span style={{ ...f(17, 700), flex: 1 }}>By Person</span>
      <IconStroke size={22} color={C.sub} sw={2.2} d={<polyline points="6 9 12 15 18 9" />} />
    </div>
    <div
      style={{
        flex: 1,
        height: 54,
        padding: "0 16px",
        borderRadius: 17,
        background: C.card,
        border: `1.5px solid ${C.divider}`,
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}
    >
      <span style={{ ...f(17, 700), flex: 1 }}>All</span>
      <IconStroke size={22} color={C.sub} sw={2.2} d={<polyline points="6 9 12 15 18 9" />} />
    </div>
  </div>
);

// ── Section header (person group) ─────────────────────────────────────────────
const SectionHeader: React.FC<{ emoji: string; name: string; count: string }> = ({
  emoji,
  name,
  count,
}) => (
  <div style={{ display: "flex", alignItems: "center", padding: "16px 4px 8px", gap: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: C.goldSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {emoji}
      </div>
      <span style={{ ...f(17, 700) }}>{name}</span>
      <span style={{ ...f(15, 500, C.sub) }}>· {count}</span>
    </div>
    <span style={{ ...f(20, 400, C.sub) }}>⌄</span>
  </div>
);

// ── Status badge ──────────────────────────────────────────────────────────────
type Status = "tobuy" | "bought" | "handed" | "settled";
const STATUS: Record<Status, { label: string; icon: string; bg: string; color: string }> = {
  tobuy: { label: "To Buy", icon: "🛒", bg: C.goldSoft, color: C.gold },
  bought: { label: "Bought", icon: "✓", bg: "rgba(76,175,130,0.14)", color: C.greenApp },
  handed: { label: "Handed Over", icon: "🤝", bg: "rgba(94,130,220,0.14)", color: C.blue },
  settled: { label: "Settled", icon: "💚", bg: "rgba(138,143,152,0.12)", color: C.sub },
};

const StatusBadge: React.FC<{ status: Status; scale?: number }> = ({ status, scale = 1 }) => {
  const s = STATUS[status];
  return (
    <div
      style={{
        padding: "4px 11px",
        borderRadius: 20,
        display: "flex",
        alignItems: "center",
        gap: 5,
        flexShrink: 0,
        background: s.bg,
        transform: `scale(${scale})`,
      }}
    >
      <span style={{ fontSize: 13, color: s.color }}>{s.icon}</span>
      <span style={{ ...f(14, 700, s.color) }}>{s.label}</span>
    </div>
  );
};

const Pill: React.FC<{ text: string; accent?: boolean }> = ({ text, accent }) => (
  <div
    style={{
      padding: "6px 13px",
      borderRadius: 20,
      ...f(15, 700, accent ? C.gold : C.sub),
      background: accent ? C.goldSoft : "rgba(138,143,152,0.12)",
      ...tnum,
    }}
  >
    {text}
  </div>
);

// ── Item tile ─────────────────────────────────────────────────────────────────
type Item = {
  status: Status;
  name: string;
  yen: string;
  rp?: string;
  loc?: string;
  qty?: string;
  totalYen?: string;
  action?: "bought" | "handover" | null;
};

const ItemTile: React.FC<{ item: Item; done?: boolean }> = ({ item, done }) => {
  const isDone = done ?? item.status !== "tobuy";
  return (
    <div
      style={{
        margin: "7px 0",
        borderRadius: 26,
        background: C.card,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 5px 14px rgba(0,0,0,0.05)",
        padding: "16px 18px",
      }}
    >
      {/* row 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatusBadge status={item.status} />
        <span
          style={{
            ...f(18, 700),
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: isDone ? "rgba(28,28,42,0.45)" : C.text,
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {item.name}
        </span>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ ...f(18, 700, isDone ? C.sub : C.gold), ...tnum }}>{item.yen}</div>
          {item.rp && <div style={{ ...f(13, 500, C.sub), ...tnum }}>{item.rp}</div>}
        </div>
      </div>
      {/* location */}
      {item.loc && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, ...f(15, 500, C.sub) }}>
          <PinIcon size={16} color={C.sub} />
          {item.loc}
        </div>
      )}
      {/* qty / total pills */}
      {(item.qty || item.totalYen) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {item.qty && <Pill text={item.qty} />}
          {item.totalYen && <Pill text={item.totalYen} accent />}
          {item.rp && item.status === "tobuy" && <Pill text={item.rp} />}
        </div>
      )}
      {/* action */}
      {item.action === "bought" && (
        <div
          style={{
            marginTop: 12,
            background: C.gold,
            borderRadius: 18,
            padding: "15px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            ...f(18, 700, C.white),
            boxShadow: `0 5px 16px rgba(219,159,92,0.35)`,
          }}
        >
          <IconStroke size={22} color={C.white} sw={2.5} d={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />
          Mark as Bought
        </div>
      )}
      {item.action === "handover" && (
        <div style={{ marginTop: 10, borderTop: `1px solid ${C.divider}`, paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 20,
              border: `1.5px solid rgba(94,130,220,0.25)`,
              display: "flex",
              alignItems: "center",
              gap: 6,
              ...f(15, 700, C.blue),
            }}
          >
            <IconStroke size={15} color={C.blue} sw={2.5} d={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />
            Hand Over
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  DEMO DATA
// ═══════════════════════════════════════════════════════════════════════════
const SARI_ITEMS: Item[] = [
  { status: "tobuy", name: "Kit Kat Matcha 12-pack", yen: "¥500", loc: "Don Quijote Shibuya", qty: "Qty: 2", totalYen: "Total: ¥1,000", action: "bought" },
  { status: "bought", name: "Shiseido Sunscreen SPF50", yen: "¥2,800", rp: "≈ Rp 300,000", loc: "Matsumoto Kiyoshi", action: "handover" },
  { status: "handed", name: "Nintendo Switch Game", yen: "¥6,500", rp: "≈ Rp 697,000", qty: "Qty: 1", totalYen: "Total: ¥6,500" },
];
const BUDI_ITEMS: Item[] = [
  { status: "tobuy", name: "Nikka From The Barrel", yen: "¥3,200", rp: "≈ Rp 343,000", loc: "Isetan Shinjuku B1", qty: "Qty: 1", totalYen: "Total: ¥3,200", action: "bought" },
];

// ═══════════════════════════════════════════════════════════════════════════
//  Kinetic caption (bottom safe area, gold-bold accents)
// ═══════════════════════════════════════════════════════════════════════════
type CapWord = { t: string; bold?: boolean };
const Caption: React.FC<{
  words: CapWord[];
  frame: number;
  from: number;
  to: number;
  accent?: string;
  dark?: boolean;
  bottom?: number;
}> = ({ words, frame, from, to, accent = C.gold, dark = false, bottom = 300 }) => {
  if (frame < from - 2 || frame > to + 2) return null;
  const inP = interpolate(frame, [from, from + 12], [0, 1], ec);
  const outP = interpolate(frame, [to - 10, to], [1, 0], ec);
  const op = inP * outP;
  const ty = interpolate(inP, [0, 1], [26, 0]);
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 70,
        right: 70,
        textAlign: "center",
        opacity: op,
        transform: `translateY(${ty}px)`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          background: dark ? "rgba(247,245,242,0.92)" : "rgba(26,26,30,0.86)",
          borderRadius: 24,
          padding: "16px 32px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
        }}
      >
        {words.map((w, i) =>
          w.bold ? (
            <span
              key={i}
              style={{
                ...f(46, 800, accent),
                textShadow: `0 0 24px ${accent}55`,
              }}
            >
              {w.t}
            </span>
          ) : (
            <span key={i} style={{ ...f(42, 600, dark ? C.text : "rgba(255,255,255,0.94)") }}>
              {w.t}
            </span>
          ),
        )}
      </div>
    </div>
  );
};

// Tap indicator: finger + ripple
const Thumb: React.FC<{ press: number }> = ({ press }) => {
  // press: 0 (up) → 1 (contact)
  const ripple = interpolate(press, [0.6, 1], [0, 1], ec);
  return (
    <div style={{ position: "relative", width: 150, height: 190 }}>
      {/* tap ripple at fingertip */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: 40,
          width: 70,
          height: 70,
          borderRadius: "50%",
          border: `3px solid ${C.gold}`,
          opacity: (1 - ripple) * 0.8,
          transform: `translate(-50%,-50%) scale(${0.4 + ripple * 1.6})`,
        }}
      />
      {/* finger */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 34,
          width: 66,
          height: 150,
          borderRadius: 40,
          background: "linear-gradient(180deg, #3A3A42 0%, #26262C 100%)",
          transform: "rotate(-18deg)",
          transformOrigin: "top center",
          boxShadow: "0 10px 26px rgba(0,0,0,0.28), inset 0 3px 0 rgba(255,255,255,0.14)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 26,
            height: 34,
            borderRadius: 16,
            background: "rgba(255,255,255,0.16)",
          }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 1 · Hook / Problem — chaos of requests  (0–5s)
// ═══════════════════════════════════════════════════════════════════════════
const Shot1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 12], [0, 1], ec);

  // nervous jitter + slow push-in
  const jitter = frame > 40 ? Math.sin(frame * 0.9) * 1.4 + Math.sin(frame * 1.7) * 0.9 : 0;
  const pushIn = interpolate(frame, [0, 150], [1, 1.12], ec);
  const coralWash = interpolate(frame, [60, 130], [0, 0.5], ec);

  const bubbles = [
    { t: "Titip Kit Kat Matcha ya! 🍫", x: -150, y: -360, rot: -6, delay: 14, me: false },
    { t: "Beliin sunscreen dong 🧴", x: 120, y: -230, rot: 5, delay: 26, me: true },
    { t: "Nitip Switch game 🙏", x: -130, y: -100, rot: -4, delay: 40, me: false },
    { t: "Tokyo Banana ya 🍌", x: 150, y: 30, rot: 7, delay: 54, me: true },
    { t: "Whisky Nikka juga!", x: -160, y: 150, rot: -8, delay: 68, me: false },
  ];
  const notes = [
    { t: "❓", x: 210, y: -360, delay: 30 },
    { t: "❗", x: -240, y: -180, delay: 46 },
    { t: "❓", x: 240, y: 210, delay: 60 },
    { t: "🤯", x: 0, y: 330, delay: 96 },
  ];

  return (
    <AbsoluteFill style={{ background: C.offwhite, opacity: bgOp }}>
      <Audio src={sfx("lofi_pop.wav")} volume={0.5} />
      <Sequence from={14} durationInFrames={20}><Audio src={sfx("pop.mp3")} volume={0.5} /></Sequence>
      <Sequence from={40} durationInFrames={20}><Audio src={sfx("pop.mp3")} volume={0.55} /></Sequence>
      <Sequence from={68} durationInFrames={20}><Audio src={sfx("lofi_pop.wav")} volume={0.6} /></Sequence>
      <Sequence from={90} durationInFrames={40}><Audio src={sfx("lofi_riser.wav")} volume={0.4} /></Sequence>

      {/* coral stress wash */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 45%, ${C.coral}22 0%, transparent 70%)`, opacity: coralWash }} />
      <Blob x={-140} y={200} size={640} color={`${C.coral}18`} frame={frame} amp={30} />
      <Blob x={640} y={1100} size={620} color={`${C.gold}12`} frame={frame} phase={2} amp={26} />

      <AbsoluteFill style={{ transform: `scale(${pushIn}) translate(${jitter}px, ${jitter * 0.6}px)` }}>
        {/* phone */}
        <div style={{ position: "absolute", top: 380, left: "50%", transform: "translateX(-50%)" }}>
          <Phone width={470} height={1000}>
            <StatusBar />
            {/* simple chat header */}
            <div style={{ padding: "12px 22px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.divider}`, background: C.surface }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👥</div>
              <div>
                <div style={{ ...f(17, 800) }}>Titip Grup ✈️</div>
                <div style={{ ...f(13, 500, C.green) }}>12 online</div>
              </div>
            </div>
            <AbsoluteFill style={{ top: 118, padding: "10px 16px", gap: 8, display: "flex", flexDirection: "column" }}>
              {[
                { t: "Titip Kit Kat Matcha ya! 🍫", me: false },
                { t: "Beliin sunscreen dong 🧴", me: true },
                { t: "Nitip Switch game 🙏", me: false },
                { t: "Tokyo Banana ya 🍌", me: true },
                { t: "Whisky Nikka juga dong!", me: false },
                { t: "eh aku juga titip 😅", me: false },
              ].map((m, i) => {
                const op = interpolate(frame, [8 + i * 12, 20 + i * 12], [0, 1], ec);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start", opacity: op }}>
                    <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 16, ...f(15, 600, m.me ? C.white : C.text), background: m.me ? C.gold : C.card, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      {m.t}
                    </div>
                  </div>
                );
              })}
            </AbsoluteFill>
          </Phone>
        </div>

        {/* exploding bubbles around phone */}
        {bubbles.map((b, i) => {
          const s = spring({ frame: frame - b.delay, fps, config: { damping: 11, stiffness: 120 } });
          const wob = Math.sin(frame * 0.12 + i) * 8;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "46%",
                left: "50%",
                transform: `translate(calc(-50% + ${b.x + wob}px), calc(-50% + ${b.y}px)) rotate(${b.rot}deg) scale(${s})`,
              }}
            >
              <div
                style={{
                  padding: "12px 18px",
                  borderRadius: 18,
                  ...f(20, 700, b.me ? C.white : C.text),
                  background: b.me ? C.gold : C.white,
                  boxShadow: "0 8px 26px rgba(0,0,0,0.14)",
                  whiteSpace: "nowrap",
                  border: b.me ? "none" : `1px solid ${C.divider}`,
                }}
              >
                {b.t}
              </div>
            </div>
          );
        })}

        {/* sticky question marks */}
        {notes.map((n, i) => {
          const s = spring({ frame: frame - n.delay, fps, config: { damping: 9, stiffness: 140 } });
          const isBig = n.t === "🤯";
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "46%",
                left: "50%",
                transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px)) scale(${s})`,
                fontSize: isBig ? 96 : 54,
                filter: isBig ? "none" : `drop-shadow(0 0 12px ${C.coral}55)`,
                color: C.coral,
              }}
            >
              {n.t}
            </div>
          );
        })}
      </AbsoluteFill>

      <Caption
        frame={frame}
        from={100}
        to={150}
        accent={C.coral}
        words={[{ t: "Everyone wants you to " }, { t: "buy something abroad…", bold: true }]}
      />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 2 · Problem deepen — math in the wrong currency  (5–10s)
// ═══════════════════════════════════════════════════════════════════════════
const Shot2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 12], [0, 1], ec);

  const dutch = interpolate(frame, [0, 60], [0, -2.5], ec);
  const drift = Math.sin(frame * 0.04) * 26;

  // orbiting currency tokens around the puzzled gift box
  const tokens = ["¥", "Rp", "¥", "Rp", "$", "¥"];
  const puzzleScale = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 70 } });

  // wallet deflate + coins fly out
  const deflate = interpolate(frame, [58, 96], [1, 0.62], { ...ec, easing: OUT });
  const coins = [
    { a: -0.4, delay: 62 }, { a: 0.1, delay: 70 }, { a: 0.6, delay: 78 }, { a: 1.1, delay: 86 }, { a: 1.7, delay: 94 },
  ];

  return (
    <AbsoluteFill style={{ background: C.offwhite, opacity: bgOp }}>
      <Sequence from={0} durationInFrames={20}><Audio src={sfx("lofi_swoosh.wav")} volume={0.4} /></Sequence>
      <Sequence from={20} durationInFrames={60}><Audio src={sfx("compute_tick.wav")} volume={0.4} /></Sequence>
      <Sequence from={60} durationInFrames={30}><Audio src={sfx("water_drop.wav")} volume={0.5} /></Sequence>
      <Sequence from={96} durationInFrames={30}><Audio src={sfx("lofi_alert.wav")} volume={0.4} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 45%, ${C.coral}1E 0%, transparent 70%)` }} />
      <Blob x={-120} y={300} size={620} color={`${C.coral}18`} frame={frame} amp={28} />
      <Blob x={620} y={1200} size={600} color={`${C.gold}10`} frame={frame} phase={1.5} amp={24} />

      <AbsoluteFill style={{ transform: `rotate(${dutch}deg) translateX(${drift}px)` }}>
        {/* title receipts scattered */}
        {[
          { x: -320, y: -520, rot: -12, d: 6 },
          { x: 300, y: -430, rot: 10, d: 16 },
          { x: -360, y: 460, rot: -8, d: 26 },
          { x: 330, y: 520, rot: 14, d: 12 },
        ].map((r, i) => {
          const op = interpolate(frame, [r.d, r.d + 16], [0, 1], ec);
          const wob = Math.sin(frame * 0.07 + i * 1.3) * 10;
          return (
            <div key={i} style={{ position: "absolute", top: "44%", left: "50%", transform: `translate(calc(-50% + ${r.x + wob}px), calc(-50% + ${r.y}px)) rotate(${r.rot}deg)`, opacity: op }}>
              <div style={{ width: 96, height: 128, background: C.white, borderRadius: 8, padding: "14px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ height: 10, background: C.divider, borderRadius: 3 }} />
                <div style={{ height: 7, background: "#EEE", borderRadius: 3, width: "70%" }} />
                <div style={{ height: 7, background: "#EEE", borderRadius: 3 }} />
                <div style={{ height: 7, background: "#EEE", borderRadius: 3, width: "85%" }} />
                <div style={{ height: 12, background: C.coral, borderRadius: 3, marginTop: 4 }} />
              </div>
            </div>
          );
        })}

        {/* central puzzled gift box */}
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: `translate(-50%,-50%) scale(${puzzleScale})` }}>
          <div style={{ fontSize: 150, filter: `drop-shadow(0 12px 30px ${C.coral}30)` }}>🎁</div>
          <div style={{ position: "absolute", top: -30, right: -20, fontSize: 60, color: C.coral }}>❓</div>
        </div>

        {/* orbiting currency tokens */}
        {tokens.map((tk, i) => {
          const ang = (i / tokens.length) * Math.PI * 2 + frame * 0.03;
          const R = 250;
          const op = interpolate(frame, [20 + i * 4, 34 + i * 4], [0, 1], ec);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "40%",
                left: "50%",
                transform: `translate(calc(-50% + ${Math.cos(ang) * R}px), calc(-50% + ${Math.sin(ang) * R * 0.9}px))`,
                width: 62,
                height: 62,
                borderRadius: "50%",
                background: C.white,
                boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...f(26, 800, i % 2 ? C.coral : C.gold),
                opacity: op,
              }}
            >
              {tk}
            </div>
          );
        })}

        {/* calculator = ??? */}
        <div style={{ position: "absolute", top: "62%", left: "50%", transform: "translate(-50%,0)", opacity: interpolate(frame, [30, 46], [0, 1], ec) }}>
          <div style={{ background: C.ink, borderRadius: 20, padding: "20px 34px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 14px 40px rgba(0,0,0,0.25)" }}>
            <span style={{ fontSize: 40 }}>🧮</span>
            <span style={{ ...f(46, 800, C.coral), ...tnum }}>¥ → Rp = ???</span>
          </div>
        </div>

        {/* deflating wallet + coins */}
        <div style={{ position: "absolute", top: "24%", left: "50%", transform: `translate(-50%,0) scaleY(${deflate})`, transformOrigin: "center bottom", fontSize: 92 }}>👛</div>
        {coins.map((c, i) => {
          const p = interpolate(frame, [c.delay, c.delay + 40], [0, 1], ec);
          const x = Math.cos(c.a) * p * 260;
          const y = -Math.abs(Math.sin(p * Math.PI)) * 160 + p * 120;
          const op = interpolate(p, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
          return (
            <div key={i} style={{ position: "absolute", top: "30%", left: "50%", transform: `translate(calc(-50% + ${x}px), ${y}px) rotate(${p * 360}deg)`, opacity: op, fontSize: 40 }}>🪙</div>
          );
        })}
      </AbsoluteFill>

      <Caption
        frame={frame}
        from={100}
        to={150}
        accent={C.coral}
        words={[{ t: "…then the " }, { t: "math", bold: true }, { t: ". In the " }, { t: "wrong currency.", bold: true }]}
      />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 3 · Solution reveal — order from chaos  (10–15s)
// ═══════════════════════════════════════════════════════════════════════════
const Shot3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // background morphs coral → gold/off-white
  const goldWash = interpolate(frame, [10, 50], [0, 1], ec);
  // phone snaps in with spring overshoot
  const snap = spring({ frame: frame - 6, fps, config: { damping: 13, stiffness: 90 } });
  const phoneY = interpolate(snap, [0, 1], [140, 0]);
  const phoneSc = interpolate(snap, [0, 1], [0.82, 1]);
  const titleOp = interpolate(frame, [4, 22], [0, 1], ec);

  // chaos remnants vacuum into the phone
  const vac = interpolate(frame, [0, 34], [0, 1], { ...ec, easing: Easing.bezier(0.5, 0, 0.7, 1) });

  return (
    <AbsoluteFill style={{ background: C.offwhite }}>
      <Sequence from={0} durationInFrames={24}><Audio src={sfx("lofi_swoosh.wav")} volume={0.55} /></Sequence>
      <Sequence from={22} durationInFrames={20}><Audio src={sfx("lofi_boom.wav")} volume={0.5} /></Sequence>
      <Sequence from={28} durationInFrames={30}><Audio src={sfx("lofi_chime.wav")} volume={0.5} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 100% 70% at 50% 42%, ${C.gold}22 0%, transparent 70%)`, opacity: goldWash }} />
      <Blob x={-140} y={200} size={680} color={`${C.gold}18`} frame={frame} amp={26} />
      <Blob x={640} y={1200} size={620} color={`${C.green}10`} frame={frame} phase={2.2} amp={22} />

      {/* vacuuming remnants */}
      {[...Array(9)].map((_, i) => {
        const ang = (i / 9) * Math.PI * 2;
        const sx = Math.cos(ang) * 460;
        const sy = Math.sin(ang) * 620;
        const x = interpolate(vac, [0, 1], [sx, 0]);
        const y = interpolate(vac, [0, 1], [sy, -60]);
        const sc = interpolate(vac, [0, 0.8, 1], [1, 0.5, 0]);
        const op = interpolate(vac, [0, 0.7, 1], [0.9, 0.6, 0]);
        const emo = ["🍫", "🧴", "🎮", "🍌", "🥃", "❓", "🧮", "🪙", "❗"][i];
        return (
          <div key={i} style={{ position: "absolute", top: "42%", left: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${sc}) rotate(${vac * 200 + i * 40}deg)`, opacity: op, fontSize: 52 }}>{emo}</div>
        );
      })}

      {/* title */}
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center", opacity: titleOp }}>
        <div style={{ ...f(30, 700, C.sub) }}>Introducing</div>
        <div style={{ ...f(60, 800, C.gold), display: "flex", gap: 12, justifyContent: "center", alignItems: "center", marginTop: 4 }}>
          <span style={{ fontSize: 56 }}>🎁</span> Jastip
        </div>
        <div style={{ ...f(26, 600, C.text), marginTop: 2 }}>Buy for Others</div>
      </div>

      {/* phone with Items tab */}
      <div style={{ position: "absolute", top: 288, left: "50%", transform: `translateX(-50%) translateY(${phoneY}px) scale(${phoneSc})`, opacity: snap }}>
        <Phone width={SW} height={1160}>
          <StatusBar />
          <TopBar />
          <TripTabBar />
          <InnerTabRow active="items" frame={frame} />
          <Controls />
          <div style={{ padding: "6px 20px 0", background: C.surface }}>
            {/* Sari group */}
            <div style={{ opacity: interpolate(frame, [20, 34], [0, 1], ec), transform: `translateY(${interpolate(frame, [20, 34], [24, 0], ec)}px)` }}>
              <SectionHeader emoji="👩" name="Sari" count="3 items" />
            </div>
            {SARI_ITEMS.map((it, i) => {
              const d = 26 + i * 8;
              const rs = spring({ frame: frame - d, fps, config: { damping: 14, stiffness: 110 } });
              return (
                <div key={i} style={{ opacity: rs, transform: `translateY(${interpolate(rs, [0, 1], [40, 0])}px) scale(${interpolate(rs, [0, 1], [0.94, 1])})` }}>
                  <ItemTile item={it} />
                </div>
              );
            })}
            <div style={{ opacity: interpolate(frame, [58, 72], [0, 1], ec), transform: `translateY(${interpolate(frame, [58, 72], [24, 0], ec)}px)` }}>
              <SectionHeader emoji="👨" name="Budi" count="2 items" />
            </div>
            {BUDI_ITEMS.map((it, i) => {
              const rs = spring({ frame: frame - (66 + i * 8), fps, config: { damping: 14, stiffness: 110 } });
              return (
                <div key={i} style={{ opacity: rs, transform: `translateY(${interpolate(rs, [0, 1], [40, 0])}px)` }}>
                  <ItemTile item={it} />
                </div>
              );
            })}
          </div>
        </Phone>
      </div>

      <Caption frame={frame} from={92} to={150} words={[{ t: "One place for " }, { t: "every request.", bold: true }]} />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 4 · Payoff 1 — buy it, we convert it  (15–20s)
// ═══════════════════════════════════════════════════════════════════════════
const Shot4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // macro push-in on a single row
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 90 } });
  const rowSc = interpolate(enter, [0, 1], [0.86, 1]);

  // thumb taps "Bought" around f=34
  const thumbIn = interpolate(frame, [16, 30], [220, 0], { ...ec, easing: OUT });
  const press = interpolate(frame, [30, 38, 46], [0, 1, 0], ec);
  const btnScale = interpolate(frame, [30, 38, 46], [1, 0.94, 1], ec);
  const bought = frame >= 104;

  // bottom sheet slides up (48→) capturing ¥3,600
  const sheetY = interpolate(frame, [48, 66], [900, 0], { ...ec, easing: OUT });
  const yenRoll = interpolate(frame, [58, 82], [0, 3600], { ...ec, easing: OUT });
  // convert springs in
  const convSpring = spring({ frame: frame - 92, fps, config: { damping: 12, stiffness: 100 } });
  const rpRoll = interpolate(frame, [92, 112], [0, 380000], { ...ec, easing: OUT });
  // badge flip To Buy → Bought at ~100
  const flipStatus: Status = frame >= 104 ? "bought" : "tobuy";
  const flip = interpolate(frame, [98, 104, 110], [0, 90, 0], ec); // degrees rotateX midpoint

  return (
    <AbsoluteFill style={{ background: C.offwhite }}>
      <Sequence from={36} durationInFrames={16}><Audio src={sfx("lofi_tap.wav")} volume={0.6} /></Sequence>
      <Sequence from={48} durationInFrames={20}><Audio src={sfx("lofi_flip.wav")} volume={0.5} /></Sequence>
      <Sequence from={58} durationInFrames={26}><Audio src={sfx("currency_spin.wav")} volume={0.5} /></Sequence>
      <Sequence from={92} durationInFrames={24}><Audio src={sfx("currency_spin.wav")} volume={0.45} /></Sequence>
      <Sequence from={104} durationInFrames={18}><Audio src={sfx("ding_success.wav")} volume={0.6} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 40%, ${C.gold}1E 0%, transparent 70%)` }} />
      <Blob x={-120} y={300} size={620} color={`${C.gold}16`} frame={frame} amp={22} />

      {/* header hint */}
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", opacity: interpolate(frame, [4, 20], [0, 1], ec) }}>
        <div style={{ ...f(34, 800, C.text) }}>👩 Sari’s request</div>
      </div>

      {/* enlarged item row (card) */}
      <div style={{ position: "absolute", top: 340, left: 90, right: 90, transform: `scale(${rowSc})`, transformOrigin: "center top" }}>
        <div
          style={{
            borderRadius: 34,
            background: C.card,
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            padding: "30px 30px 34px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* flipping status badge */}
            <div style={{ transform: `perspective(400px) rotateX(${flip}deg)` }}>
              <StatusBadge status={flipStatus} scale={1.4} />
            </div>
            <span style={{ ...f(30, 800), flex: 1, textDecoration: bought ? "line-through" : "none", color: bought ? "rgba(28,28,42,0.5)" : C.text }}>
              Kit Kat Matcha 12-pack
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, ...f(22, 500, C.sub) }}>
            <PinIcon size={22} color={C.sub} /> Don Quijote Shibuya · Qty 2
          </div>

          {/* price area */}
          <div style={{ marginTop: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ ...f(20, 600, C.sub) }}>You paid</div>
              <div style={{ ...f(52, 800, C.gold), ...tnum }}>¥{fmt(frame >= 58 ? yenRoll : 3600 * 0)}</div>
            </div>
            {frame >= 92 && (
              <div style={{ textAlign: "right", transform: `scale(${convSpring})`, transformOrigin: "right bottom" }}>
                <div style={{ ...f(20, 600, C.sub) }}>≈ home currency</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
                  <span style={{ ...f(44, 800, C.green), ...tnum }}>Rp {fmt(rpRoll)}</span>
                  <span style={{ ...f(18, 700, C.gold), background: C.goldSoft, borderRadius: 12, padding: "5px 11px" }}>+fee</span>
                </div>
              </div>
            )}
          </div>

          {/* Bought button (before tap) */}
          {frame < 50 && (
            <div style={{ marginTop: 26, background: C.gold, borderRadius: 22, padding: "22px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, ...f(26, 800, C.white), transform: `scale(${btnScale})`, boxShadow: `0 8px 26px rgba(219,159,92,0.4)` }}>
              <IconStroke size={30} color={C.white} sw={2.6} d={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>} />
              Mark as Bought
            </div>
          )}
        </div>
      </div>

      {/* thumb tapping */}
      {frame >= 16 && frame < 52 && (
        <div style={{ position: "absolute", top: 620, left: "50%", transform: `translate(-30px, ${thumbIn}px)` }}>
          <Thumb press={press} />
        </div>
      )}

      {/* bottom sheet */}
      {frame >= 48 && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, transform: `translateY(${sheetY}px)` }}>
          <div style={{ background: C.white, borderRadius: "36px 36px 0 0", padding: "26px 50px 90px", boxShadow: "0 -20px 60px rgba(0,0,0,0.16)" }}>
            <div style={{ width: 60, height: 6, borderRadius: 3, background: C.divider, margin: "0 auto 22px" }} />
            <div style={{ ...f(28, 800, C.text), textAlign: "center" }}>Mark as Bought</div>
            <div style={{ ...f(20, 500, C.sub), textAlign: "center", marginTop: 6 }}>Enter the price you paid</div>
            <div style={{ marginTop: 26, background: C.surface, borderRadius: 22, padding: "26px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ ...f(56, 800, C.gold), ...tnum }}>¥ {fmt(yenRoll)}</span>
              {frame % 20 < 10 && frame < 90 && <span style={{ ...f(50, 300, C.gold) }}>|</span>}
            </div>
            <div style={{ marginTop: 20, background: frame >= 100 ? C.green : C.gold, borderRadius: 22, padding: "22px 0", textAlign: "center", ...f(26, 800, C.white), boxShadow: `0 8px 26px rgba(0,0,0,0.14)`, transition: "none" }}>
              {frame >= 100 ? "✓ Bought — Converted" : "Confirm"}
            </div>
          </div>
        </div>
      )}

      <Caption frame={frame} from={120} to={150} bottom={1000} words={[{ t: "Tap Bought. We " }, { t: "convert automatically.", bold: true }]} />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 5 · Payoff 2 / Proof — who owes you, get paid  (20–25s)
// ═══════════════════════════════════════════════════════════════════════════
const OwedCard: React.FC<{
  emoji: string;
  name: string;
  sub: string;
  amount: string;
  state: "owes" | "paying" | "settled";
  clearP?: number;
}> = ({ emoji, name, sub, amount, state, clearP = 0 }) => {
  const settled = state === "settled";
  return (
    <div
      style={{
        borderRadius: 24,
        background: C.card,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 6px 16px rgba(0,0,0,0.05)",
        padding: "22px 24px",
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* green clear wash */}
      {clearP > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `${C.green}14`, opacity: clearP }} />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
        <span style={{ fontSize: 34 }}>{emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ ...f(19, 700) }}>{name}</div>
          <div style={{ ...f(15, 500, C.sub) }}>{sub}</div>
        </div>
        {(settled || clearP > 0.5) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, ...f(16, 700, C.green) }}>
            <IconStroke size={24} color={C.green} sw={3} d={<polyline points="20 6 9 17 4 12" />} /> Paid
          </div>
        )}
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "flex-end", justifyContent: "space-between", position: "relative" }}>
        <div>
          <div style={{ ...f(14, 600, C.sub), textTransform: "uppercase", letterSpacing: 0.5 }}>Owes You</div>
          <div style={{ ...f(24, 800, settled || clearP > 0.5 ? C.green : C.gold), ...tnum }}>{clearP > 0.5 ? "Rp 0" : amount}</div>
        </div>
        {state === "owes" && (
          <div style={{ background: C.gold, borderRadius: 16, padding: "13px 20px", display: "flex", alignItems: "center", gap: 8, ...f(17, 700, C.white), boxShadow: `0 4px 12px rgba(219,159,92,0.3)` }}>
            <IconStroke size={18} color={C.white} sw={2.6} d={<polyline points="20 6 9 17 4 12" />} /> Mark Paid
          </div>
        )}
      </div>
    </div>
  );
};

const Shot5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const phoneSc = interpolate(enter, [0, 1], [0.9, 1]);
  const totalRoll = interpolate(frame, [16, 52], [0, 1340000], { ...ec, easing: OUT });

  // tap Mark Paid on Budi ~ f=78 → checkmark burst + clear
  const budiThumb = interpolate(frame, [58, 72], [220, 0], { ...ec, easing: OUT });
  const budiPress = interpolate(frame, [72, 80, 88], [0, 1, 0], ec);
  const checkSpring = spring({ frame: frame - 80, fps, config: { damping: 9, stiffness: 130 } });
  const clearP = interpolate(frame, [82, 104], [0, 1], ec);
  const burstP = interpolate(frame, [80, 120], [0, 1], ec);

  return (
    <AbsoluteFill style={{ background: C.offwhite }}>
      <Sequence from={0} durationInFrames={20}><Audio src={sfx("lofi_swoosh.wav")} volume={0.45} /></Sequence>
      <Sequence from={16} durationInFrames={38}><Audio src={sfx("currency_spin.wav")} volume={0.5} /></Sequence>
      <Sequence from={78} durationInFrames={14}><Audio src={sfx("lofi_tap.wav")} volume={0.55} /></Sequence>
      <Sequence from={80} durationInFrames={20}><Audio src={sfx("lofi_check.wav")} volume={0.6} /></Sequence>
      <Sequence from={82} durationInFrames={26}><Audio src={sfx("stat_pop.wav")} volume={0.45} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 40%, ${C.gold}1C 0%, transparent 70%)` }} />
      <Blob x={-120} y={300} size={620} color={`${C.green}12`} frame={frame} amp={22} />
      <Blob x={640} y={1200} size={600} color={`${C.gold}12`} frame={frame} phase={2} amp={20} />

      <div style={{ position: "absolute", top: 300, left: "50%", transform: `translateX(-50%) scale(${phoneSc})`, opacity: enter }}>
        <Phone width={SW} height={1160}>
          <StatusBar />
          <TopBar />
          <TripTabBar />
          <InnerTabRow active="owed" frame={frame} />

          <div style={{ padding: "20px 20px", background: C.surface, flex: 1 }}>
            {/* grand total hero */}
            <div
              style={{
                borderRadius: 24,
                background: `linear-gradient(135deg, ${C.gold} 0%, #C88B45 100%)`,
                padding: "24px 26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
                boxShadow: `0 10px 30px rgba(219,159,92,0.35)`,
              }}
            >
              <span style={{ ...f(19, 700, C.white) }}>Total Owed to You</span>
              <span style={{ ...f(30, 800, C.white), ...tnum }}>Rp {fmt(totalRoll)}</span>
            </div>

            <div style={{ opacity: interpolate(frame, [30, 44], [0, 1], ec), transform: `translateY(${interpolate(frame, [30, 44], [20, 0], ec)}px)` }}>
              <OwedCard emoji="👩" name="Sari" sub="2 items · 1 to buy" amount="Rp 997,000" state="owes" />
            </div>
            <div style={{ opacity: interpolate(frame, [38, 52], [0, 1], ec), transform: `translateY(${interpolate(frame, [38, 52], [20, 0], ec)}px)` }}>
              <OwedCard emoji="👨" name="Budi" sub="2 items · 1 to buy" amount="Rp 343,000" state={clearP > 0.5 ? "settled" : "owes"} clearP={clearP} />
            </div>
            <div style={{ opacity: interpolate(frame, [46, 60], [0, 1], ec), transform: `translateY(${interpolate(frame, [46, 60], [20, 0], ec)}px)` }}>
              <OwedCard emoji="👧" name="Rini" sub="1 item · settled" amount="Rp 0" state="settled" />
            </div>
          </div>
        </Phone>
      </div>

      {/* thumb taps Budi's Mark Paid */}
      {frame >= 58 && frame < 92 && (
        <div style={{ position: "absolute", top: 1020, left: "62%", transform: `translate(0, ${budiThumb}px)` }}>
          <Thumb press={budiPress} />
        </div>
      )}

      {/* checkmark celebration burst (screen center over card) */}
      {frame >= 80 && (
        <div style={{ position: "absolute", top: 1030, left: "50%", transform: "translate(-50%,-50%)" }}>
          {/* particles */}
          {[...Array(16)].map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r = burstP * 220;
            const op = interpolate(burstP, [0, 0.25, 1], [0, 1, 0]);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: i % 3 === 0 ? 16 : 10,
                  height: i % 3 === 0 ? 16 : 10,
                  borderRadius: "50%",
                  background: [C.green, C.gold, C.greenApp, C.white][i % 4],
                  opacity: op,
                  transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)`,
                }}
              />
            );
          })}
          {/* check badge */}
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: C.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translate(-50%,-50%) scale(${checkSpring})`,
              boxShadow: `0 12px 40px ${C.green}70`,
            }}
          >
            <IconStroke size={72} color={C.white} sw={3.4} d={<polyline points="20 6 9 17 4 12" />} />
          </div>
        </div>
      )}

      <Caption frame={frame} from={122} to={150} words={[{ t: "See who owes you. " }, { t: "Get paid.", bold: true }]} accent={C.green} />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 6 · CTA — logo + download  (25–30s)
// ═══════════════════════════════════════════════════════════════════════════
const Shot6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp = interpolate(frame, [0, 14], [0, 1], ec);
  const logoSpring = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 80 } });
  const tagOp = interpolate(frame, [34, 52], [0, 1], ec);
  const tagY = interpolate(frame, [34, 52], [30, 0], ec);
  const badgeSpring = spring({ frame: frame - 60, fps, config: { damping: 13, stiffness: 80 } });
  const badgeY = interpolate(badgeSpring, [0, 1], [120, 0]);
  const ctaOp = interpolate(frame, [88, 104], [0, 1], ec);
  const ring = 1 + Math.sin(frame * 0.09) * 0.04;
  const burstP = interpolate(frame, [8, 60], [0, 1], ec);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, #201F26 0%, ${C.ink} 55%, #0F0F12 100%)`, opacity: bgOp }}>
      <Sequence from={6} durationInFrames={40}><Audio src={sfx("lofi_fanfare.wav")} volume={0.5} /></Sequence>
      <Sequence from={10} durationInFrames={30}><Audio src={sfx("lofi_shimmer.wav")} volume={0.45} /></Sequence>
      <Sequence from={60} durationInFrames={20}><Audio src={sfx("lofi_pop.wav")} volume={0.5} /></Sequence>

      {/* radial rays */}
      <AbsoluteFill style={{ opacity: 0.06 }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920">
          {[...Array(20)].map((_, i) => {
            const a = (i / 20) * Math.PI * 2;
            return (
              <line key={i} x1={540} y1={760} x2={540 + Math.cos(a) * 1300} y2={760 + Math.sin(a) * 1300} stroke={C.gold} strokeWidth={2} />
            );
          })}
        </svg>
      </AbsoluteFill>

      <Blob x={-140} y={200} size={720} color={`${C.gold}20`} frame={frame} amp={30} />
      <Blob x={620} y={1200} size={640} color={`${C.gold}12`} frame={frame} phase={2} amp={26} />

      {/* particle burst behind logo */}
      {[...Array(22)].map((_, i) => {
        const a = (i / 22) * Math.PI * 2;
        const r = burstP * 420;
        const op = interpolate(burstP, [0, 0.2, 1], [0, 1, 0]);
        return (
          <div key={i} style={{ position: "absolute", top: 760, left: "50%", width: i % 4 === 0 ? 16 : 9, height: i % 4 === 0 ? 16 : 9, borderRadius: "50%", background: [C.gold, "#F0C48A", C.white, "#C88B45"][i % 4], opacity: op, transform: `translate(calc(-50% + ${Math.cos(a) * r}px), ${Math.sin(a) * r}px)` }} />
        );
      })}

      {/* pulse rings */}
      <div style={{ position: "absolute", top: 760, left: "50%", width: 300, height: 300, borderRadius: "50%", transform: `translate(-50%,-50%) scale(${ring})`, border: `2px solid ${C.gold}30` }} />
      <div style={{ position: "absolute", top: 760, left: "50%", width: 400, height: 400, borderRadius: "50%", transform: `translate(-50%,-50%) scale(${ring * 0.96})`, border: `1px solid ${C.gold}16` }} />

      {/* app icon + wordmark */}
      <div style={{ position: "absolute", top: 760, left: "50%", transform: `translate(-50%,-50%) scale(${logoSpring})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        {/* app icon */}
        <div
          style={{
            width: 190,
            height: 190,
            borderRadius: 46,
            background: `linear-gradient(150deg, ${C.gold} 0%, #C88B45 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 20px 60px rgba(219,159,92,0.5), inset 0 3px 0 rgba(255,255,255,0.25)`,
            position: "relative",
          }}
        >
          <span style={{ fontSize: 96 }}>🎁</span>
          <div style={{ position: "absolute", top: 16, left: 20, fontSize: 30 }}>✈️</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ ...f(88, 800, C.white), letterSpacing: -2 }}>Trav</span>
          <span style={{ ...f(88, 800, C.gold), letterSpacing: -2 }}>Track</span>
        </div>
      </div>

      {/* tagline */}
      <div style={{ position: "absolute", top: 1120, width: "100%", textAlign: "center", opacity: tagOp, transform: `translateY(${tagY}px)` }}>
        <div style={{ ...f(44, 700, C.white) }}>Travel. Track.</div>
        <div style={{ ...f(44, 800, C.gold), marginTop: 4 }}>Jastip made easy.</div>
      </div>

      {/* download badges */}
      <div style={{ position: "absolute", top: 1300, width: "100%", display: "flex", justifyContent: "center", gap: 24, transform: `translateY(${badgeY}px)`, opacity: badgeSpring }}>
        {[
          { top: "Download on the", big: "App Store", icon: "" },
          { top: "GET IT ON", big: "Google Play", icon: "▶" },
        ].map((b, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${C.gold}55`, borderRadius: 22, padding: "18px 30px", display: "flex", alignItems: "center", gap: 16, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 42, color: C.white }}>{i === 0 ? "" : b.icon}</span>
            {i === 0 && (
              <svg width={42} height={42} viewBox="0 0 24 24" fill={C.white}><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.635 0 2.935.06 4.478 2.22-.116.075-2.593 1.51-2.593 4.5 0 3.45 3.02 4.66 3.06 4.68z" /></svg>
            )}
            <div>
              <div style={{ ...f(16, 500, "rgba(255,255,255,0.7)") }}>{b.top}</div>
              <div style={{ ...f(32, 800, C.white) }}>{b.big}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ position: "absolute", top: 1470, width: "100%", textAlign: "center", opacity: ctaOp }}>
        <div style={{ display: "inline-block", background: C.gold, borderRadius: 30, padding: "18px 46px", ...f(34, 800, C.ink), boxShadow: `0 12px 40px rgba(219,159,92,0.45)` }}>
          Download TravTrack today
        </div>
      </div>

      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  ROOT — 900 frames (30s)
// ═══════════════════════════════════════════════════════════════════════════
export const JastipLaunch: React.FC = () => (
  <AbsoluteFill style={{ background: C.offwhite }}>
    <Sequence durationInFrames={150}><Shot1 /></Sequence>
    <Sequence from={150} durationInFrames={150}><Shot2 /></Sequence>
    <Sequence from={300} durationInFrames={150}><Shot3 /></Sequence>
    <Sequence from={450} durationInFrames={150}><Shot4 /></Sequence>
    <Sequence from={600} durationInFrames={150}><Shot5 /></Sequence>
    <Sequence from={750} durationInFrames={150}><Shot6 /></Sequence>
  </AbsoluteFill>
);
