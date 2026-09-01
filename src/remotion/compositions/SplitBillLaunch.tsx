import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

/* ══════════════════════════════════════════════════════════════════════════
   KeepTrip · "Split Bill" Feature Launch — 37s · 9:16 (1080×1920) · 30fps
   6 shots (180+210+180+180+210+150 = 1110 frames). Problem → Solution → Proof → CTA.
   Product UI (shots 3–5) recreated pixel-faithfully from:
     • split_bill_preview.html   (Split Bill main screen + Add-expense sheet)
     • more_actions_preview.html (••• More Actions CupertinoActionSheet)
   CAPTION RULE: every caption fades in (~0.3s) then HOLDS the full shot duration.
   ══════════════════════════════════════════════════════════════════════════ */

// ─── Palette (mirrored from split_bill_preview.html design tokens) ───────────
const C = {
  gold:      "#DB9F5C", // accent
  goldLite:  "#E8B87A",
  goldDark:  "#C48840",
  goldSoft:  "rgba(219,159,92,0.12)",
  goldSoft2: "rgba(219,159,92,0.22)",
  ink:       "#1A1A2E",
  offwhite:  "#F3F1EE",
  bg:        "#EEEEF0", // app screen bg
  surface:   "#F5F5F7",
  card:      "#F0F0F2",
  divider:   "#D8D8DE",
  text:      "#1A1A2E",
  sub:       "#6B6B80",
  green:     "#4CAF82", // success / paid / settled
  greenSoft: "rgba(76,175,130,0.15)",
  coral:     "#E57373", // error / problem beats
  coralSoft: "rgba(229,115,115,0.15)",
  white:     "#FFFFFF",
  neuLight:  "rgba(255,255,255,0.85)",
  neuDark:   "rgba(180,180,196,0.55)",
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

const sfx = (name: string) => staticFile(`sfx/${name}`);

// translucent veils layered over the background.webm so the video shows through
// while the phone UI and captions stay legible
const VEIL = "rgba(243,241,238,0.60)"; // light shots (1–5)
const VEIL_DARK =
  "linear-gradient(165deg, rgba(35,33,48,0.82) 0%, rgba(26,26,46,0.86) 55%, rgba(16,16,24,0.9) 100%)"; // CTA shot 6

// Full-frame looping background video
const BgVideo: React.FC = () => (
  <AbsoluteFill>
    <OffthreadVideo
      src={staticFile("/videos/background.webm")}
      volume={0}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);

// neumorphic dual-tone shadow helpers
const neuCard = (radius = 16): React.CSSProperties => ({
  background: C.card,
  borderRadius: radius,
  boxShadow: `4px 4px 10px ${C.neuDark}, -3px -3px 8px ${C.neuLight}`,
});
const neuBtn = (radius = 12): React.CSSProperties => ({
  background: C.card,
  borderRadius: radius,
  boxShadow: `3px 3px 7px ${C.neuDark}, -2px -2px 5px ${C.neuLight}`,
});

// ─── 2% film grain (deterministic) ───────────────────────────────────────────
const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <AbsoluteFill
    style={{ opacity, pointerEvents: "none", mixBlendMode: "overlay" }}
  >
    <svg width="100%" height="100%">
      <filter id="sbGrain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#sbGrain)" />
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

// ─── generic stroke icon ─────────────────────────────────────────────────────
const Ico: React.FC<{
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

const iconCheck = <polyline points="20 6 9 17 4 12" />;
const iconCheckCircle = (
  <>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </>
);
const iconCircle = <circle cx="12" cy="12" r="10" />;
const iconChevL = <polyline points="15 18 9 12 15 6" />;
const iconChevR = <polyline points="9 18 15 12 9 6" />;
const iconPlus = (
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
);
const iconDots = (
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </>
);
const iconShare = (
  <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </>
);
const iconArrows = <path d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" />;
const iconAddUser = (
  <>
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </>
);

const SW = 540; // app screen content width

// ── Phone frame (dark bezel + notch) ──────────────────────────────────────────
const Phone: React.FC<{
  children?: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ children, width = SW, height = 1180, style }) => {
  const r = width * 0.115;
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        backgroundColor: C.bg,
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
      background: C.bg,
    }}
  >
    <span style={{ ...f(15, 700, C.text), ...tnum, opacity: 0.75 }}>9:41</span>
    <div style={{ display: "flex", gap: 6, alignItems: "center", opacity: 0.7 }}>
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

// ═══════════════════════════════════════════════════════════════════════════
//  SPLIT BILL SCREEN ATOMS  (from split_bill_preview.html, scaled ~1.44×)
// ═══════════════════════════════════════════════════════════════════════════

// ── Split Bill header (back · title · share · add participant) ────────────────
const SplitHeader: React.FC<{ sharePulse?: number }> = ({ sharePulse = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "16px 22px 12px",
      gap: 14,
      background: C.bg,
      flexShrink: 0,
    }}
  >
    <div style={{ ...neuBtn(14), width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Ico size={24} color={C.sub} sw={2.5} d={iconChevL} />
    </div>
    <span style={{ ...f(28, 800, C.text), flex: 1, letterSpacing: -0.4 }}>Split Bill</span>
    <div
      style={{
        ...neuBtn(14),
        width: 52,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          sharePulse > 0
            ? `0 0 ${18 * sharePulse}px ${C.gold}, 3px 3px 7px ${C.neuDark}, -2px -2px 5px ${C.neuLight}`
            : neuBtn(14).boxShadow,
      }}
    >
      <Ico size={24} color={C.gold} sw={2.2} d={iconShare} />
    </div>
    <div style={{ ...neuBtn(14), width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Ico size={24} color={C.gold} sw={2.2} d={iconAddUser} />
    </div>
  </div>
);

// ── Participant chip ──────────────────────────────────────────────────────────
type PKind = "me" | "pos" | "neg" | "settled";
type Participant = { emoji: string; name: string; badge: string; kind: PKind };
const PARTICIPANTS: Participant[] = [
  { emoji: "🙂", name: "Anang", badge: "Me", kind: "me" },
  { emoji: "🧑", name: "Budi", badge: "+35", kind: "pos" },
  { emoji: "👩", name: "Siti", badge: "-28", kind: "neg" },
  { emoji: "🧔", name: "Doni", badge: "0", kind: "settled" },
  { emoji: "🧕", name: "Rina", badge: "-7", kind: "neg" },
];

const badgeBg: Record<PKind, string> = {
  me: C.gold,
  pos: C.green,
  neg: C.coral,
  settled: C.green,
};

const ParticipantChip: React.FC<{ p: Participant; scale?: number }> = ({ p, scale = 1 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, transform: `scale(${scale})` }}>
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: "50%",
        background: C.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        position: "relative",
        boxShadow:
          p.kind === "me"
            ? `0 0 0 3px ${C.gold}, 3px 3px 7px ${C.neuDark}, -2px -2px 5px ${C.neuLight}`
            : `3px 3px 7px ${C.neuDark}, -2px -2px 5px ${C.neuLight}`,
      }}
    >
      {p.emoji}
      <div
        style={{
          position: "absolute",
          bottom: -4,
          right: -4,
          ...f(13, 800, C.white),
          background: badgeBg[p.kind],
          borderRadius: 8,
          padding: "1px 6px",
          ...tnum,
        }}
      >
        {p.badge}
      </div>
    </div>
    <span style={{ ...f(14, 700, p.kind === "me" ? C.gold : C.sub) }}>{p.name}</span>
  </div>
);

const ParticipantsRow: React.FC<{ frame: number; stagger?: boolean; scale?: number; data?: Participant[] }> = ({
  frame,
  stagger = false,
  scale = 1,
  data = PARTICIPANTS,
}) => (
  <div style={{ display: "flex", gap: 18, padding: "8px 26px 14px", background: C.bg, justifyContent: "space-between", flexShrink: 0 }}>
    {data.map((p, i) => {
      if (!stagger) return <ParticipantChip key={p.name} p={p} scale={scale} />;
      const d = 4 + i * 6;
      const op = interpolate(frame, [d, d + 12], [0, 1], ec);
      const tx = interpolate(frame, [d, d + 14], [40, 0], ec);
      return (
        <div key={p.name} style={{ opacity: op, transform: `translateX(${tx}px)` }}>
          <ParticipantChip p={p} scale={scale} />
        </div>
      );
    })}
  </div>
);

// ── Settlement card ───────────────────────────────────────────────────────────
type SettleRow = { from: string; to: string; amt: string; paid: boolean };
const SETTLEMENTS: SettleRow[] = [
  { from: "Siti", to: "Anang", amt: "IDR 168,000", paid: false },
  { from: "Rina", to: "Budi", amt: "IDR 42,000", paid: true },
  { from: "Siti", to: "Budi", amt: "IDR 27,500", paid: false },
];

const MarkPill: React.FC<{ paid: boolean; scale?: number }> = ({ paid, scale = 1 }) =>
  paid ? (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 13px",
        borderRadius: 10,
        background: C.greenSoft,
        border: `1px solid rgba(76,175,130,0.4)`,
        ...f(14, 800, C.green),
        transform: `scale(${scale})`,
        whiteSpace: "nowrap",
      }}
    >
      <Ico size={16} color={C.green} sw={2.6} d={iconCheckCircle} />
      Paid
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 13px",
        borderRadius: 10,
        background: C.goldSoft,
        ...f(14, 800, C.gold),
        transform: `scale(${scale})`,
        whiteSpace: "nowrap",
      }}
    >
      <Ico size={16} color={C.gold} sw={2.6} d={iconCircle} />
      Mark paid
    </div>
  );

const SettlementCard: React.FC<{
  rows?: SettleRow[];
  headerTitle?: string;
  paidCount?: number;
  emphasizeRow?: number; // index to punch-in scale
  emphasizeScale?: number;
}> = ({
  rows = SETTLEMENTS,
  headerTitle = "3 settlements needed",
  paidCount = 1,
  emphasizeRow = -1,
  emphasizeScale = 1,
}) => (
  <div style={{ margin: "0 26px", ...neuCard(18), padding: "18px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <Ico size={22} color={C.gold} sw={2.2} d={iconArrows} />
      <span style={{ ...f(18, 800, C.text), flex: 1 }}>{headerTitle}</span>
      <span style={{ ...f(15, 800, C.green) }}>{paidCount} paid</span>
    </div>
    {rows.map((r, i) => {
      const last = i === rows.length - 1;
      const btnScale = i === emphasizeRow ? emphasizeScale : 1;
      return (
        <div
          key={`${r.from}-${r.to}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 0",
            borderBottom: last ? "none" : `1px solid ${C.divider}`,
          }}
        >
          <span
            style={{
              flex: 1,
              ...f(18, 600, r.paid ? C.sub : C.text),
              textDecoration: r.paid ? "line-through" : "none",
            }}
          >
            {r.from} → {r.to}
          </span>
          <span
            style={{
              ...f(18, 800, r.paid ? C.green : C.gold),
              ...tnum,
              textDecoration: r.paid ? "line-through" : "none",
            }}
          >
            {r.amt}
          </span>
          <MarkPill paid={r.paid} scale={btnScale} />
        </div>
      );
    })}
  </div>
);

// ── Expense tile ──────────────────────────────────────────────────────────────
type Expense = {
  icon: string;
  title: string;
  payer: string;
  mode: "Equal" | "Weighted" | "Exact";
  ppl: string;
  amt: string;
  sub: string;
};
const EXPENSES: Expense[] = [
  { icon: "🍜", title: "Dinner at Sate Khas", payer: "Anang", mode: "Equal", ppl: "5 people", amt: "IDR 350k", sub: "70k/person" },
  { icon: "🚕", title: "Grab to Hotel", payer: "Budi", mode: "Weighted", ppl: "3 people", amt: "IDR 84k", sub: "custom split" },
  { icon: "🏨", title: "Hotel Deposit", payer: "Anang", mode: "Exact", ppl: "4 people", amt: "IDR 600k", sub: "exact amounts" },
  { icon: "🎡", title: "Theme Park Tickets", payer: "Siti", mode: "Equal", ppl: "5 people", amt: "IDR 250k", sub: "50k/person" },
];

const ExpenseTile: React.FC<{ e: Expense }> = ({ e }) => (
  <div style={{ ...neuCard(18), display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" }}>
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: C.goldSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        flexShrink: 0,
      }}
    >
      {e.icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...f(19, 700, C.text) }}>{e.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, ...f(15, 500, C.sub) }}>
        <span>
          Paid by <span style={{ color: C.gold, fontWeight: 700 }}>{e.payer}</span>
        </span>
        <span style={{ ...f(13, 700, C.gold), background: C.goldSoft, borderRadius: 7, padding: "1px 8px" }}>{e.mode}</span>
        <span>{e.ppl}</span>
      </div>
    </div>
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ ...f(20, 800, C.text), ...tnum }}>{e.amt}</div>
      <div style={{ ...f(13, 500, C.sub), marginTop: 2 }}>{e.sub}</div>
    </div>
  </div>
);

// ── Section header (Group Expenses + Add) ─────────────────────────────────────
const GroupExpensesHeader: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", padding: "6px 26px 10px", background: C.bg }}>
    <span style={{ ...f(20, 800, C.text), flex: 1, letterSpacing: -0.2 }}>Group Expenses</span>
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.gold, borderRadius: 22, padding: "8px 16px", ...f(15, 700, C.white), boxShadow: `0 4px 12px rgba(219,159,92,0.3)` }}>
      <Ico size={16} color={C.white} sw={2.6} d={iconPlus} />
      Add
    </div>
  </div>
);

// ── Full Split Bill main screen (composed) ────────────────────────────────────
const SplitBillScreen: React.FC<{
  frame: number;
  staggerParticipants?: boolean;
  revealFrom?: number;
  expenses?: number;
  sharePulse?: number;
}> = ({ frame, staggerParticipants = false, revealFrom = 0, expenses = 2, sharePulse = 0 }) => {
  const rf = frame - revealFrom;
  return (
    <>
      <SplitHeader sharePulse={sharePulse} />
      <ParticipantsRow frame={rf} stagger={staggerParticipants} />
      <div style={{ opacity: staggerParticipants ? interpolate(rf, [30, 46], [0, 1], ec) : 1, transform: staggerParticipants ? `translateY(${interpolate(rf, [30, 46], [24, 0], ec)}px)` : "none" }}>
        <SettlementCard />
      </div>
      <div style={{ height: 20 }} />
      <GroupExpensesHeader />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 26px" }}>
        {EXPENSES.slice(0, expenses).map((e, i) => {
          const d = 46 + i * 10;
          const op = staggerParticipants ? interpolate(rf, [d, d + 14], [0, 1], ec) : 1;
          const ty = staggerParticipants ? interpolate(rf, [d, d + 16], [30, 0], ec) : 0;
          return (
            <div key={e.title} style={{ opacity: op, transform: `translateY(${ty}px)` }}>
              <ExpenseTile e={e} />
            </div>
          );
        })}
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  TRIP-DETAIL + MORE-ACTIONS ATOMS (from more_actions_preview.html)
// ═══════════════════════════════════════════════════════════════════════════
const TripTopBar: React.FC<{ dotsGlow?: number }> = ({ dotsGlow = 0 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px 14px", background: C.bg, flexShrink: 0 }}>
    <div style={{ ...neuBtn(12), width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Ico size={20} color={C.sub} sw={2.4} d={iconChevL} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...f(20, 800, C.text), display: "flex", alignItems: "center", gap: 6 }}>
        🌏 Bali Summer Trip
      </div>
      <div style={{ ...f(14, 500, C.sub), marginTop: 3 }}>📍 Bali, Indonesia · Jun 10 → Jun 17</div>
    </div>
    <div
      style={{
        ...neuBtn(12),
        width: 44,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          dotsGlow > 0
            ? `0 0 ${20 * dotsGlow}px ${C.gold}, 3px 3px 7px ${C.neuDark}, -2px -2px 5px ${C.neuLight}`
            : neuBtn(12).boxShadow,
      }}
    >
      <Ico size={22} color={dotsGlow > 0.3 ? C.gold : C.sub} sw={2.4} d={iconDots} />
    </div>
  </div>
);

const TripTabBar: React.FC = () => {
  const tabs = [
    { label: "Summary", d: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>, active: true },
    { label: "Expenses", d: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></> },
    { label: "Itinerary", d: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></> },
    { label: "Budget", d: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></> },
    { label: "Jastip", d: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 001.96 1.61h9.72a2 2 0 001.95-1.61L23 6H6" /></> },
  ];
  return (
    <div style={{ display: "flex", background: C.surface, borderBottom: `1.5px solid ${C.divider}`, padding: "0 8px", flexShrink: 0 }}>
      {tabs.map((t) => (
        <div key={t.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 4px 10px", position: "relative", color: t.active ? C.gold : C.sub, borderBottom: `3px solid ${t.active ? C.gold : "transparent"}` }}>
          <Ico size={22} color={t.active ? C.gold : C.sub} sw={2.2} d={t.d} />
          <span style={{ ...f(13, 700), color: t.active ? C.gold : C.sub }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
};

// dimmed summary content behind the action sheet
const DimSummary: React.FC = () => (
  <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 12, opacity: 0.5, filter: "blur(1px)" }}>
    <div style={{ display: "flex", gap: 12 }}>
      {[
        { l: "Total Spent", v: "IDR 2.4M", s: "of 4M budget", bar: 0.62 },
        { l: "Days Left", v: "4", s: "Jun 13 → Jun 17", bar: -1 },
      ].map((c) => (
        <div key={c.l} style={{ flex: 1, ...neuCard(16), padding: 16 }}>
          <div style={{ ...f(13, 700, C.sub), textTransform: "uppercase", letterSpacing: 0.5 }}>{c.l}</div>
          <div style={{ ...f(26, 800, C.text), marginTop: 2 }}>{c.v}</div>
          <div style={{ ...f(13, 500, C.sub), marginTop: 1 }}>{c.s}</div>
          {c.bar >= 0 && (
            <div style={{ height: 7, background: C.divider, borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${c.bar * 100}%`, background: C.gold, borderRadius: 4 }} />
            </div>
          )}
        </div>
      ))}
    </div>
    {[
      { i: "🍜", n: "Dinner at Sate Khas", c: "Food · Jun 12", a: "IDR 350k" },
      { i: "🏨", n: "Hotel Deposit", c: "Stay · Jun 10", a: "IDR 600k" },
    ].map((m) => (
      <div key={m.n} style={{ ...neuCard(14), display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <span style={{ fontSize: 22 }}>{m.i}</span>
        <div style={{ flex: 1 }}>
          <div style={{ ...f(17, 700, C.text) }}>{m.n}</div>
          <div style={{ ...f(13, 500, C.sub) }}>{m.c}</div>
        </div>
        <div style={{ ...f(18, 800, C.text), ...tnum }}>{m.a}</div>
      </div>
    ))}
  </div>
);

// Cupertino action sheet (More Actions) — Split Bills row highlighted
type ActionRow = { icon: string; iconBg: string; label: string; desc: string; accent?: boolean };
const ACTIONS: ActionRow[] = [
  { icon: "✅", iconBg: C.greenSoft, label: "Mark as Completed", desc: "Move trip to Archived" },
  { icon: "✏️", iconBg: "rgba(100,150,255,0.15)", label: "Edit Trip", desc: "Name, dates, currency, cover" },
  { icon: "💰", iconBg: C.goldSoft, label: "💰 Split Bills", desc: "Group expenses & settlements", accent: true },
  { icon: "🔗", iconBg: "rgba(56,195,204,0.15)", label: "Trip Connect", desc: "P2P sync via QR code" },
];

const ActionSheet: React.FC<{ y: number; highlight: number; tapPress: number }> = ({ y, highlight, tapPress }) => (
  <AbsoluteFill style={{ justifyContent: "flex-end", borderRadius: 34, overflow: "hidden", zIndex: 40 }}>
    <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)", opacity: interpolate(y, [0, 220], [1, 0], ec) }} />
    <div style={{ position: "relative", zIndex: 2, padding: "10px 12px 14px", transform: `translateY(${y}px)` }}>
      <div style={{ borderRadius: 20, overflow: "hidden", background: "rgba(240,240,246,0.96)", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "16px 18px 12px", textAlign: "center", borderBottom: `1px solid ${C.divider}` }}>
          <span style={{ ...f(16, 800, C.sub) }}>Bali Summer Trip</span>
        </div>
        {ACTIONS.map((a, i) => {
          const isSplit = a.accent;
          const glow = isSplit ? highlight : 0;
          const press = isSplit ? tapPress : 0;
          return (
            <div
              key={a.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 18px",
                borderBottom: i === ACTIONS.length - 1 ? "none" : `1px solid rgba(180,180,200,0.3)`,
                background: `rgba(219,159,92,${0.14 * glow + 0.18 * press})`,
                transform: `scale(${1 - press * 0.02})`,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: a.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  boxShadow: isSplit && glow > 0 ? `0 0 ${16 * glow}px ${C.gold}` : "none",
                }}
              >
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...f(20, 700, isSplit ? C.gold : C.text) }}>{a.label}</div>
                <div style={{ ...f(14, 600, C.sub), marginTop: 2 }}>{a.desc}</div>
              </div>
              <Ico size={18} color={C.sub} sw={2.4} d={iconChevR} />
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, borderRadius: 20, background: "rgba(240,240,246,0.96)", padding: "18px 0", textAlign: "center", ...f(20, 800, C.gold), boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}>
        Cancel
      </div>
    </div>
  </AbsoluteFill>
);

// ═══════════════════════════════════════════════════════════════════════════
//  ADD GROUP EXPENSE bottom sheet atoms (from split_bill_preview.html)
// ═══════════════════════════════════════════════════════════════════════════
const FormLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ ...f(14, 700, C.sub), letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>{children}</div>
);

const Chip: React.FC<{ label: string; selected?: boolean; radius?: number }> = ({ label, selected, radius = 22 }) => (
  <div
    style={{
      padding: "9px 15px",
      borderRadius: radius,
      ...f(16, 700, selected ? C.gold : C.text),
      background: selected ? C.goldSoft : C.card,
      border: `1.5px solid ${selected ? C.gold : "transparent"}`,
      boxShadow: selected ? `0 2px 8px rgba(219,159,92,0.25)` : neuBtn(radius).boxShadow,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

const SEG_MODES = [
  { label: "Equal", hint: "IDR 70,000 / person" },
  { label: "Weighted", hint: "2× Anang · 1× others" },
  { label: "Exact", hint: "custom amounts / person" },
] as const;

const SegControl: React.FC<{ activeIndex: number; slide: number }> = ({ activeIndex, slide }) => {
  return (
    <div style={{ position: "relative", display: "flex", borderRadius: 12, background: C.card, border: `1.5px solid ${C.divider}`, overflow: "hidden", height: 56 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${100 / 3}%`,
          background: C.gold,
          borderRadius: 10,
          transform: `translateX(${slide * 100}%)`,
        }}
      />
      {SEG_MODES.map((m, i) => (
        <div key={m.label} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2, ...f(16, 700, i === activeIndex ? C.white : C.sub) }}>
          {m.label}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  Kinetic caption — fades in ~0.3s, HOLDS the full shot, exits at the cut
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
}> = ({ words, frame, from, to, accent = C.gold, dark = false, bottom = 280 }) => {
  if (frame < from - 2) return null;
  const inP = interpolate(frame, [from, from + 9], [0, 1], ec); // slow 0.3s fade-in
  const outP = interpolate(frame, [to - 8, to], [1, 0], ec); // exit only at the cut
  const op = inP * outP;
  const ty = interpolate(inP, [0, 1], [24, 0]);
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 64,
        right: 64,
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
          background: dark ? "rgba(243,241,238,0.94)" : "rgba(26,26,46,0.88)",
          borderRadius: 26,
          padding: "18px 34px",
          boxShadow: "0 12px 44px rgba(0,0,0,0.20)",
        }}
      >
        {words.map((w, i) =>
          w.bold ? (
            <span key={i} style={{ ...f(48, 800, accent), textShadow: `0 0 24px ${accent}55`, whiteSpace: "pre" }}>
              {w.t}
            </span>
          ) : (
            <span key={i} style={{ ...f(44, 700, dark ? C.text : "rgba(255,255,255,0.95)"), whiteSpace: "pre" }}>
              {w.t}
            </span>
          ),
        )}
      </div>
    </div>
  );
};

// ── Tap indicator: finger + ripple ────────────────────────────────────────────
const Thumb: React.FC<{ press: number }> = ({ press }) => {
  const ripple = interpolate(press, [0.6, 1], [0, 1], ec);
  return (
    <div style={{ position: "relative", width: 150, height: 190 }}>
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
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 34,
          width: 66,
          height: 150,
          borderRadius: 40,
          background: "linear-gradient(180deg, #F2CBA4 0%, #E0AE84 55%, #CE9A70 100%)",
          transform: "rotate(-18deg)",
          transformOrigin: "top center",
          boxShadow: "0 10px 26px rgba(0,0,0,0.24), inset 0 3px 0 rgba(255,255,255,0.35)",
        }}
      >
        {/* fingernail highlight */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 26,
            height: 34,
            borderRadius: 16,
            background: "rgba(255,247,238,0.55)",
          }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 1 · Hook / Problem — the group trip chaos  (0–6s · 180f)
// ═══════════════════════════════════════════════════════════════════════════
const Shot1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 12], [0, 1], ec);

  const jitter = frame > 30 ? Math.sin(frame * 0.9) * 1.6 + Math.sin(frame * 1.7) * 1.0 : 0;
  const pushIn = interpolate(frame, [0, 180], [1, 1.12], ec);
  const coralWash = interpolate(frame, [50, 150], [0, 0.55], ec);

  const bubbles = [
    { t: "Budi paid for dinner btw 🍜", x: -170, y: -420, rot: -6, delay: 14, me: false },
    { t: "Who got the hotel?? 🏨", x: 130, y: -280, rot: 5, delay: 30, me: true },
    { t: "Someone owes me 168k", x: -150, y: -120, rot: -4, delay: 48, me: false },
    { t: "I forgot the Grab 😭", x: 165, y: 40, rot: 7, delay: 66, me: true },
    { t: "wait who paid tickets?", x: -175, y: 190, rot: -8, delay: 84, me: false },
  ];
  const notes = [
    { t: "❓", x: 230, y: -420, delay: 34 },
    { t: "❗", x: -260, y: -230, delay: 52 },
    { t: "💸", x: 250, y: 250, delay: 70 },
    { t: "🤯", x: 0, y: 380, delay: 118 },
  ];

  return (
    <AbsoluteFill style={{ background: VEIL, opacity: bgOp }}>
      <Sequence from={14} durationInFrames={20}><Audio src={sfx("pop.mp3")} volume={0.5} /></Sequence>
      <Sequence from={30} durationInFrames={20}><Audio src={sfx("pop.mp3")} volume={0.5} /></Sequence>
      <Sequence from={48} durationInFrames={20}><Audio src={sfx("lofi_pop.wav")} volume={0.55} /></Sequence>
      <Sequence from={66} durationInFrames={20}><Audio src={sfx("pop.mp3")} volume={0.55} /></Sequence>
      <Sequence from={84} durationInFrames={20}><Audio src={sfx("lofi_pop.wav")} volume={0.6} /></Sequence>
      <Sequence from={100} durationInFrames={60}><Audio src={sfx("lofi_riser.wav")} volume={0.42} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 45%, ${C.coral}22 0%, transparent 70%)`, opacity: coralWash }} />
      <Blob x={-140} y={200} size={640} color={`${C.coral}18`} frame={frame} amp={30} />
      <Blob x={640} y={1100} size={620} color={`${C.gold}12`} frame={frame} phase={2} amp={26} />

      <AbsoluteFill style={{ transform: `scale(${pushIn}) translate(${jitter}px, ${jitter * 0.6}px)` }}>
        {/* phone with a flooding group chat */}
        <div style={{ position: "absolute", top: 420, left: "50%", transform: "translateX(-50%)" }}>
          <Phone width={470} height={1000}>
            <StatusBar />
            <div style={{ padding: "12px 22px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.divider}`, background: C.bg }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👥</div>
              <div>
                <div style={{ ...f(17, 800) }}>Bali Trip Grup 🌴</div>
                <div style={{ ...f(13, 500, C.green) }}>5 online</div>
              </div>
            </div>
            <AbsoluteFill style={{ top: 118, padding: "10px 16px", gap: 8, display: "flex", flexDirection: "column" }}>
              {[
                { t: "Budi paid for dinner btw 🍜", me: false },
                { t: "Who got the hotel?? 🏨", me: true },
                { t: "Someone owes me 168k 💸", me: false },
                { t: "I forgot how much the Grab was 😭", me: true },
                { t: "wait who paid the tickets?", me: false },
                { t: "aku juga bingung 😅", me: false },
              ].map((m, i) => {
                const op = interpolate(frame, [8 + i * 12, 20 + i * 12], [0, 1], ec);
                return (
                  <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start", opacity: op }}>
                    <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: 16, ...f(15, 600, m.me ? C.white : C.text), background: m.me ? C.gold : C.card, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
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
            <div key={i} style={{ position: "absolute", top: "46%", left: "50%", transform: `translate(calc(-50% + ${b.x + wob}px), calc(-50% + ${b.y}px)) rotate(${b.rot}deg) scale(${s})` }}>
              <div style={{ padding: "12px 18px", borderRadius: 18, ...f(20, 700, b.me ? C.white : C.text), background: b.me ? C.gold : C.white, boxShadow: "0 8px 26px rgba(0,0,0,0.14)", whiteSpace: "nowrap", border: b.me ? "none" : `1px solid ${C.divider}` }}>
                {b.t}
              </div>
            </div>
          );
        })}

        {/* sticky notes / symbols */}
        {notes.map((n, i) => {
          const s = spring({ frame: frame - n.delay, fps, config: { damping: 9, stiffness: 140 } });
          const isBig = n.t === "🤯";
          return (
            <div key={i} style={{ position: "absolute", top: "46%", left: "50%", transform: `translate(calc(-50% + ${n.x}px), calc(-50% + ${n.y}px)) scale(${s})`, fontSize: isBig ? 100 : 56, filter: isBig ? "none" : `drop-shadow(0 0 12px ${C.coral}55)` }}>
              {n.t}
            </div>
          );
        })}
      </AbsoluteFill>

      <Caption
        frame={frame}
        from={12}
        to={180}
        accent={C.coral}
        words={[{ t: "Travelling together is fun. " }, { t: "Splitting the bill is not.", bold: true }]}
      />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 2 · Problem deepen — the mental-math nightmare  (6–13s · 210f)
// ═══════════════════════════════════════════════════════════════════════════
const Shot2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 12], [0, 1], ec);

  const dutch = interpolate(frame, [0, 70], [0, -2.5], ec);
  const drift = Math.sin(frame * 0.035) * 28;

  const scaleIn = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 70 } });
  // broken balance tips wrong way, oscillating
  const tip = interpolate(frame, [30, 70], [0, 1], ec) * (Math.sin(frame * 0.18) * 0.5 + 0.5) * 14 - interpolate(frame, [30, 70], [0, 10], ec);

  const badgeGrow = interpolate(frame, [40, 120], [1, 1.5], ec) + Math.sin(frame * 0.3) * 0.05;
  const walletDeflate = interpolate(frame, [120, 170], [1, 0.6], { ...ec, easing: OUT });

  const calcs = [
    { t: "350k ÷ 5 = …", x: -300, y: -430, rot: -10, d: 10 },
    { t: "84k ÷ 3 = ?", x: 300, y: -360, rot: 9, d: 24 },
    { t: "600k ÷ 4 = ??", x: -320, y: 440, rot: -7, d: 40 },
  ];

  return (
    <AbsoluteFill style={{ background: VEIL, opacity: bgOp }}>
      <Sequence from={0} durationInFrames={20}><Audio src={sfx("lofi_swoosh.wav")} volume={0.4} /></Sequence>
      <Sequence from={20} durationInFrames={70}><Audio src={sfx("compute_tick.wav")} volume={0.4} /></Sequence>
      <Sequence from={90} durationInFrames={30}><Audio src={sfx("lofi_alert.wav")} volume={0.42} /></Sequence>
      <Sequence from={120} durationInFrames={40}><Audio src={sfx("lofi_thump.wav")} volume={0.4} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 70% at 50% 45%, ${C.coral}20 0%, transparent 70%)` }} />
      <Blob x={-120} y={300} size={620} color={`${C.coral}18`} frame={frame} amp={28} />
      <Blob x={620} y={1200} size={600} color={`${C.gold}10`} frame={frame} phase={1.5} amp={24} />

      <AbsoluteFill style={{ transform: `rotate(${dutch}deg) translateX(${drift}px)` }}>
        {/* contradictory calculations */}
        {calcs.map((c, i) => {
          const op = interpolate(frame, [c.d, c.d + 16], [0, 1], ec);
          const wob = Math.sin(frame * 0.07 + i * 1.3) * 10;
          return (
            <div key={i} style={{ position: "absolute", top: "42%", left: "50%", transform: `translate(calc(-50% + ${c.x + wob}px), calc(-50% + ${c.y}px)) rotate(${c.rot}deg)`, opacity: op }}>
              <div style={{ background: C.white, borderRadius: 14, padding: "16px 22px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", ...f(30, 800, C.coral), ...tnum, textDecoration: "line-through" }}>
                {c.t}
              </div>
            </div>
          );
        })}

        {/* central broken balance scale */}
        <div style={{ position: "absolute", top: "39%", left: "50%", transform: `translate(-50%,-50%) scale(${scaleIn}) rotate(${tip}deg)` }}>
          <div style={{ fontSize: 168, filter: `drop-shadow(0 12px 30px ${C.coral}33)` }}>⚖️</div>
        </div>

        {/* calculator = ??? */}
        <div style={{ position: "absolute", top: "60%", left: "50%", transform: "translate(-50%,0)", opacity: interpolate(frame, [26, 42], [0, 1], ec) }}>
          <div style={{ background: C.ink, borderRadius: 20, padding: "20px 34px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 14px 40px rgba(0,0,0,0.25)" }}>
            <span style={{ fontSize: 40 }}>🧮</span>
            <span style={{ ...f(46, 800, C.coral), ...tnum }}>total = ???</span>
          </div>
        </div>

        {/* pulsing red debt badge */}
        <div style={{ position: "absolute", top: "24%", left: "30%", transform: `translate(-50%,-50%) scale(${badgeGrow})`, opacity: interpolate(frame, [40, 56], [0, 1], ec) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 54 }}>👩</div>
            <div style={{ background: C.coral, borderRadius: 16, padding: "8px 16px", ...f(34, 800, C.white), ...tnum, boxShadow: `0 8px 24px ${C.coral}55` }}>−28k</div>
          </div>
        </div>

        {/* deflating wallet */}
        <div style={{ position: "absolute", top: "22%", left: "72%", transform: `translate(-50%,0) scaleY(${walletDeflate})`, transformOrigin: "center bottom", fontSize: 92, opacity: interpolate(frame, [110, 124], [0, 1], ec) }}>👛</div>
      </AbsoluteFill>

      <Caption
        frame={frame}
        from={12}
        to={210}
        accent={C.coral}
        words={[{ t: "Who paid what? Who owes who? " }, { t: "Nobody knows.", bold: true }]}
      />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 3 · Solution reveal — More Actions → Split Bill screen  (13–19s · 180f)
// ═══════════════════════════════════════════════════════════════════════════
const Shot3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const goldWash = interpolate(frame, [8, 46], [0, 1], ec);
  const snap = spring({ frame: frame - 4, fps, config: { damping: 13, stiffness: 90 } });
  const phoneY = interpolate(snap, [0, 1], [140, 0]);
  const phoneSc = interpolate(snap, [0, 1], [0.82, 1]);
  const titleOp = interpolate(frame, [2, 20], [0, 1], ec);

  // chaos remnants vacuum into the phone
  const vac = interpolate(frame, [0, 34], [0, 1], { ...ec, easing: Easing.bezier(0.5, 0, 0.7, 1) });

  // ••• dots glow, then action sheet rises, Split Bills highlights, thumb taps
  const dotsGlow = interpolate(frame, [18, 32, 48], [0, 1, 0.4], ec);
  const sheetY = interpolate(frame, [30, 48], [900, 0], { ...ec, easing: OUT });
  const highlight = interpolate(frame, [48, 58], [0, 1], ec);
  const tapPress = interpolate(frame, [58, 66, 74], [0, 1, 0], ec);
  const sheetOut = interpolate(frame, [74, 88], [0, 900], { ...ec, easing: OUT });

  const showTrip = frame < 88;
  const tripFade = interpolate(frame, [74, 88], [1, 0], ec);
  const splitFade = interpolate(frame, [80, 92], [0, 1], ec);
  const splitReveal = 84;

  return (
    <AbsoluteFill style={{ background: VEIL }}>
      <Sequence from={0} durationInFrames={24}><Audio src={sfx("lofi_swoosh.wav")} volume={0.55} /></Sequence>
      <Sequence from={30} durationInFrames={20}><Audio src={sfx("lofi_swipe.wav")} volume={0.5} /></Sequence>
      <Sequence from={58} durationInFrames={14}><Audio src={sfx("lofi_click.wav")} volume={0.6} /></Sequence>
      <Sequence from={78} durationInFrames={22}><Audio src={sfx("lofi_boom.wav")} volume={0.5} /></Sequence>
      <Sequence from={84} durationInFrames={30}><Audio src={sfx("lofi_chime.wav")} volume={0.5} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 100% 70% at 50% 42%, ${C.gold}22 0%, transparent 70%)`, opacity: goldWash }} />
      <Blob x={-140} y={200} size={680} color={`${C.gold}18`} frame={frame} amp={26} />
      <Blob x={640} y={1200} size={620} color={`${C.green}10`} frame={frame} phase={2.2} amp={22} />

      {/* vacuuming chaos remnants */}
      {[...Array(9)].map((_, i) => {
        const ang = (i / 9) * Math.PI * 2;
        const sx = Math.cos(ang) * 460;
        const sy = Math.sin(ang) * 620;
        const x = interpolate(vac, [0, 1], [sx, 0]);
        const y = interpolate(vac, [0, 1], [sy, -60]);
        const sc = interpolate(vac, [0, 0.8, 1], [1, 0.5, 0]);
        const op = interpolate(vac, [0, 0.7, 1], [0.9, 0.6, 0]);
        const emo = ["🍜", "🏨", "💸", "🚕", "🎡", "❓", "🧮", "⚖️", "❗"][i];
        return (
          <div key={i} style={{ position: "absolute", top: "42%", left: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${sc}) rotate(${vac * 200 + i * 40}deg)`, opacity: op, fontSize: 52 }}>{emo}</div>
        );
      })}

      {/* title */}
      <div style={{ position: "absolute", top: 108, width: "100%", textAlign: "center", opacity: titleOp }}>
        <div style={{ ...f(30, 700, C.sub) }}>Introducing</div>
        <div style={{ ...f(62, 800, C.gold), display: "flex", gap: 12, justifyContent: "center", alignItems: "center", marginTop: 4 }}>
          <span style={{ fontSize: 54 }}>💰</span> Split Bill
        </div>
      </div>

      {/* phone */}
      <div style={{ position: "absolute", top: 300, left: "50%", transform: `translateX(-50%) translateY(${phoneY}px) scale(${phoneSc})`, opacity: snap }}>
        <Phone width={SW} height={1180}>
          {/* trip detail + action sheet */}
          {showTrip && (
            <div style={{ position: "absolute", inset: 0, opacity: tripFade }}>
              <StatusBar />
              <TripTopBar dotsGlow={dotsGlow} />
              <TripTabBar />
              <DimSummary />
              {frame >= 30 && <ActionSheet y={frame < 74 ? sheetY : sheetOut} highlight={highlight} tapPress={tapPress} />}
            </div>
          )}
          {/* split bill main screen */}
          {frame >= 80 && (
            <div style={{ position: "absolute", inset: 0, opacity: splitFade }}>
              <StatusBar />
              <SplitBillScreen frame={frame} staggerParticipants revealFrom={splitReveal} expenses={3} />
            </div>
          )}
        </Phone>
      </div>

      {/* thumb taps the 💰 Split Bills row (3rd action row) */}
      {frame >= 50 && frame < 78 && (
        <div style={{ position: "absolute", top: 1256, left: "47%", transform: `translate(0, ${interpolate(frame, [50, 60], [220, 0], { ...ec, easing: OUT })}px)` }}>
          <Thumb press={tapPress} />
        </div>
      )}

      <Caption
        frame={frame}
        from={12}
        to={180}
        words={[{ t: "KeepTrip Split Bill — " }, { t: "everyone's share, instantly.", bold: true }]}
      />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 4 · Payoff 1 — add an expense, choose how to split  (19–25s · 180f)
// ═══════════════════════════════════════════════════════════════════════════
const Shot4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const phoneSc = interpolate(enter, [0, 1], [0.9, 1]);

  // sheet slides up
  const sheetY = interpolate(frame, [6, 26], [960, 0], { ...ec, easing: OUT });

  // split-mode cycles Equal → Weighted → Exact, then Save
  // active index by frame windows
  let activeIndex = 0;
  if (frame >= 118) activeIndex = 2;
  else if (frame >= 96) activeIndex = 1;
  else activeIndex = 0;
  const slide = interpolate(
    frame,
    [70, 96, 118],
    [0, 1, 2],
    ec,
  ); // smooth highlight glide 0→2
  const hint = SEG_MODES[activeIndex].hint;

  // dolly-in on the split control in the last third
  const dolly = interpolate(frame, [70, 130], [1, 1.06], ec);
  const dollyY = interpolate(frame, [70, 130], [0, -30], ec);

  // Save tap
  const saveThumb = interpolate(frame, [138, 150], [200, 0], { ...ec, easing: OUT });
  const savePress = interpolate(frame, [150, 158, 166], [0, 1, 0], ec);
  const saveScale = interpolate(frame, [150, 158, 166], [1, 0.95, 1], ec);
  const saved = frame >= 160;

  return (
    <AbsoluteFill style={{ background: VEIL }}>
      <Sequence from={6} durationInFrames={20}><Audio src={sfx("lofi_swoosh.wav")} volume={0.5} /></Sequence>
      <Sequence from={70} durationInFrames={12}><Audio src={sfx("lofi_tap.wav")} volume={0.5} /></Sequence>
      <Sequence from={96} durationInFrames={12}><Audio src={sfx("lofi_flip.wav")} volume={0.5} /></Sequence>
      <Sequence from={118} durationInFrames={12}><Audio src={sfx("lofi_flip.wav")} volume={0.5} /></Sequence>
      <Sequence from={150} durationInFrames={14}><Audio src={sfx("lofi_tap.wav")} volume={0.55} /></Sequence>
      <Sequence from={160} durationInFrames={18}><Audio src={sfx("lofi_thump.wav")} volume={0.5} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 40%, ${C.gold}1C 0%, transparent 70%)` }} />
      <Blob x={-120} y={300} size={620} color={`${C.gold}16`} frame={frame} amp={22} />

      <div style={{ position: "absolute", top: 300, left: "50%", transform: `translateX(-50%) scale(${phoneSc})`, opacity: enter }}>
        <Phone width={SW} height={1180}>
          {/* blurred split bill behind */}
          <div style={{ position: "absolute", inset: 0, filter: "blur(3px)", opacity: 0.4 }}>
            <StatusBar />
            <SplitHeader />
            <ParticipantsRow frame={0} />
            <SettlementCard />
          </div>
          <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />

          {/* bottom sheet */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, transform: `translateY(${sheetY}px)` }}>
            <div style={{ background: C.surface, borderRadius: "26px 26px 0 0", padding: "16px 24px 30px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 -12px 40px rgba(0,0,0,0.25)", transform: `translateY(${dollyY}px) scale(${dolly})`, transformOrigin: "center bottom" }}>
              <div style={{ width: 48, height: 5, borderRadius: 3, background: C.divider, margin: "0 auto 2px" }} />
              <div style={{ ...f(22, 800, C.text) }}>Add Group Expense</div>

              {/* Title */}
              <div>
                <FormLabel>Title</FormLabel>
                <div style={{ ...f(18, 700, C.text), background: C.card, borderRadius: 12, border: `1.5px solid ${C.gold}`, padding: "13px 16px" }}>
                  Dinner at Sate Khas
                </div>
              </div>

              {/* Amount + currency */}
              <div>
                <FormLabel>Amount</FormLabel>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: C.card, borderRadius: 12, border: `1.5px solid ${C.divider}`, padding: "13px 16px" }}>
                    <span style={{ ...f(16, 700, C.sub) }}>IDR</span>
                    <span style={{ ...f(18, 800, C.text), ...tnum }}>350,000</span>
                  </div>
                  <div style={{ ...f(16, 800, C.gold), background: C.card, borderRadius: 12, border: `1.5px solid ${C.goldSoft2}`, padding: "13px 16px" }}>IDR</div>
                </div>
              </div>

              {/* Category */}
              <div>
                <FormLabel>Category</FormLabel>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { l: "🍜 Food", s: true },
                    { l: "🚗 Transport", s: false },
                    { l: "🏨 Stay", s: false },
                    { l: "🎡 Fun", s: false },
                  ].map((c) => (
                    <Chip key={c.l} label={c.l} selected={c.s} radius={12} />
                  ))}
                </div>
              </div>

              {/* Paid by */}
              <div>
                <FormLabel>Paid by</FormLabel>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { l: "🙂 Anang", s: true },
                    { l: "🧑 Budi", s: false },
                    { l: "👩 Siti", s: false },
                    { l: "🧔 Doni", s: false },
                  ].map((c) => (
                    <Chip key={c.l} label={c.l} selected={c.s} />
                  ))}
                </div>
              </div>

              {/* Split mode */}
              <div>
                <FormLabel>Split mode</FormLabel>
                <SegControl activeIndex={activeIndex} slide={slide} />
                <div style={{ ...f(16, 700, C.gold), textAlign: "center", marginTop: 10, ...tnum }}>{hint}</div>
              </div>

              {/* Save */}
              <div style={{ marginTop: 4, background: saved ? C.green : C.gold, borderRadius: 12, padding: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, ...f(19, 800, C.white), boxShadow: `0 6px 18px rgba(219,159,92,0.4)`, transform: `scale(${saveScale})` }}>
                <Ico size={22} color={C.white} sw={2.6} d={saved ? iconCheckCircle : iconCheck} />
                {saved ? "Saved" : "Save"}
              </div>
            </div>
          </div>
        </Phone>
      </div>

      {/* thumb taps Save */}
      {frame >= 138 && frame < 168 && (
        <div style={{ position: "absolute", top: 1360, left: "52%", transform: `translate(0, ${saveThumb}px)` }}>
          <Thumb press={savePress} />
        </div>
      )}

      <Caption
        frame={frame}
        from={12}
        to={180}
        words={[{ t: "Equal, weighted, or exact — " }, { t: "you decide how to split.", bold: true }]}
      />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 5 · Payoff 2 / Proof — settlement in one tap  (25–32s · 210f)
// ═══════════════════════════════════════════════════════════════════════════
const Shot5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const phoneSc = interpolate(enter, [0, 1], [0.9, 1]);

  // pull-back → punch-in on the settlement card
  const punch = interpolate(frame, [70, 96], [1, 1.12], ec);
  const punchY = interpolate(frame, [70, 96], [0, -40], ec);

  // thumb taps "Mark paid" on Siti → Anang (row 0) around f=96
  const thumbIn = interpolate(frame, [78, 92], [220, 0], { ...ec, easing: OUT });
  const press = interpolate(frame, [92, 100, 108], [0, 1, 0], ec);
  const btnScale = interpolate(frame, [92, 100, 108], [1, 0.92, 1], ec);

  const paid = frame >= 104;
  const checkSpring = spring({ frame: frame - 104, fps, config: { damping: 9, stiffness: 130 } });
  const burstP = interpolate(frame, [104, 150], [0, 1], ec);
  // celebration lands, then clears so the settled card reads for the final hold
  const checkVis = interpolate(frame, [136, 156], [1, 0], ec);
  const sharePulse = (Math.sin(frame * 0.12) + 1) / 2;

  // rows update after payment
  const rows: SettleRow[] = SETTLEMENTS.map((r, i) => (i === 0 ? { ...r, paid } : r));
  const paidCount = paid ? 2 : 1;
  const headerTitle = paid ? "2 settlements needed" : "3 settlements needed";

  // updated participant badges after Siti pays Anang
  const settledParts: Participant[] = PARTICIPANTS.map((p) => {
    if (!paid) return p;
    if (p.name === "Siti") return { ...p, badge: "-3", kind: "neg" };
    if (p.name === "Anang") return { ...p, badge: "0", kind: "settled" };
    return p;
  });

  return (
    <AbsoluteFill style={{ background: VEIL }}>
      <Sequence from={0} durationInFrames={20}><Audio src={sfx("lofi_swoosh.wav")} volume={0.45} /></Sequence>
      <Sequence from={96} durationInFrames={14}><Audio src={sfx("lofi_tap.wav")} volume={0.55} /></Sequence>
      <Sequence from={104} durationInFrames={20}><Audio src={sfx("lofi_check.wav")} volume={0.6} /></Sequence>
      <Sequence from={104} durationInFrames={20}><Audio src={sfx("ding_success.wav")} volume={0.55} /></Sequence>
      <Sequence from={108} durationInFrames={26}><Audio src={sfx("stat_pop.wav")} volume={0.45} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 90% 60% at 50% 40%, ${C.gold}1C 0%, transparent 70%)` }} />
      <Blob x={-120} y={300} size={620} color={`${C.green}12`} frame={frame} amp={22} />
      <Blob x={640} y={1200} size={600} color={`${C.gold}12`} frame={frame} phase={2} amp={20} />

      <div style={{ position: "absolute", top: 300, left: "50%", transform: `translateX(-50%) translateY(${punchY}px) scale(${phoneSc * punch})`, opacity: enter, transformOrigin: "center 30%" }}>
        <Phone width={SW} height={1180}>
          <StatusBar />
          <SplitHeader sharePulse={sharePulse} />
          <div style={{ opacity: interpolate(frame, [10, 24], [0, 1], ec), transform: `translateY(${interpolate(frame, [10, 24], [20, 0], ec)}px)` }}>
            {/* badges update to the settled state the instant the payment lands */}
            <ParticipantsRow frame={0} scale={1} data={paid ? settledParts : PARTICIPANTS} />
          </div>

          <div style={{ height: 6 }} />
          <div style={{ opacity: interpolate(frame, [20, 36], [0, 1], ec), transform: `translateY(${interpolate(frame, [20, 36], [26, 0], ec)}px)` }}>
            <SettlementCard rows={rows} headerTitle={headerTitle} paidCount={paidCount} emphasizeRow={0} emphasizeScale={btnScale} />
          </div>

          <div style={{ height: 20 }} />
          <GroupExpensesHeader />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 26px", opacity: 0.9 }}>
            {EXPENSES.slice(0, 2).map((e) => (
              <ExpenseTile key={e.title} e={e} />
            ))}
          </div>
        </Phone>
      </div>

      {/* thumb taps Mark paid on row 0 */}
      {frame >= 78 && frame < 108 && (
        <div style={{ position: "absolute", top: 700, left: "66%", transform: `translate(0, ${thumbIn}px)` }}>
          <Thumb press={press} />
        </div>
      )}

      {/* checkmark celebration burst over the settlement card */}
      {frame >= 104 && frame < 158 && (
        <div style={{ position: "absolute", top: 690, left: "50%", transform: "translate(-50%,-50%)", opacity: checkVis }}>
          {[...Array(16)].map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const r = burstP * 220;
            const op = interpolate(burstP, [0, 0.25, 1], [0, 1, 0]);
            return (
              <div key={i} style={{ position: "absolute", left: 0, top: 0, width: i % 3 === 0 ? 16 : 10, height: i % 3 === 0 ? 16 : 10, borderRadius: "50%", background: [C.green, C.gold, C.green, C.white][i % 4], opacity: op, transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)` }} />
            );
          })}
          <div style={{ width: 130, height: 130, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", transform: `translate(-50%,-50%) scale(${checkSpring})`, boxShadow: `0 12px 40px ${C.green}70` }}>
            <Ico size={72} color={C.white} sw={3.4} d={iconCheck} />
          </div>
        </div>
      )}

      <Caption
        frame={frame}
        from={12}
        to={210}
        accent={C.green}
        words={[{ t: "Who owes who — calculated. " }, { t: "Get paid in one tap.", bold: true }]}
      />
      <Grain />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 6 · CTA — logo + download  (32–37s · 150f)
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
    <AbsoluteFill style={{ background: VEIL_DARK, opacity: bgOp }}>
      <Sequence from={6} durationInFrames={40}><Audio src={sfx("lofi_fanfare.wav")} volume={0.5} /></Sequence>
      <Sequence from={10} durationInFrames={30}><Audio src={sfx("lofi_shimmer.wav")} volume={0.45} /></Sequence>
      <Sequence from={60} durationInFrames={20}><Audio src={sfx("lofi_pop.wav")} volume={0.5} /></Sequence>

      <AbsoluteFill style={{ opacity: 0.06 }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920">
          {[...Array(20)].map((_, i) => {
            const a = (i / 20) * Math.PI * 2;
            return <line key={i} x1={540} y1={760} x2={540 + Math.cos(a) * 1300} y2={760 + Math.sin(a) * 1300} stroke={C.gold} strokeWidth={2} />;
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
        return <div key={i} style={{ position: "absolute", top: 760, left: "50%", width: i % 4 === 0 ? 16 : 9, height: i % 4 === 0 ? 16 : 9, borderRadius: "50%", background: [C.gold, "#F0C48A", C.white, "#C88B45"][i % 4], opacity: op, transform: `translate(calc(-50% + ${Math.cos(a) * r}px), ${Math.sin(a) * r}px)` }} />;
      })}

      {/* pulse rings */}
      <div style={{ position: "absolute", top: 760, left: "50%", width: 300, height: 300, borderRadius: "50%", transform: `translate(-50%,-50%) scale(${ring})`, border: `2px solid ${C.gold}30` }} />
      <div style={{ position: "absolute", top: 760, left: "50%", width: 400, height: 400, borderRadius: "50%", transform: `translate(-50%,-50%) scale(${ring * 0.96})`, border: `1px solid ${C.gold}16` }} />

      {/* app icon + wordmark */}
      <div style={{ position: "absolute", top: 760, left: "50%", transform: `translate(-50%,-50%) scale(${logoSpring})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ width: 190, height: 190, borderRadius: 46, background: `linear-gradient(150deg, #363535 0%, #010101 100%)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 20px 60px rgba(70,70,70,0.5), inset 0 3px 0 rgba(255,255,255,0.25)` }}>
          <Img src={staticFile("images/Keeptrip.svg")} style={{ width: 130, height: 130, objectFit: "contain" }} />
        </div>
        <span style={{ ...f(96, 800, C.gold), letterSpacing: -2 }}>KeepTrip</span>
      </div>

      {/* tagline */}
      <div style={{ position: "absolute", top: 1120, width: "100%", textAlign: "center", opacity: tagOp, transform: `translateY(${tagY}px)` }}>
        <div style={{ ...f(46, 700, C.white) }}>Split smarter.</div>
        <div style={{ ...f(46, 800, C.gold), marginTop: 4 }}>Travel better.</div>
      </div>

      {/* download badges */}
      <div style={{ position: "absolute", top: 1300, width: "100%", display: "flex", justifyContent: "center", gap: 24, transform: `translateY(${badgeY}px)`, opacity: badgeSpring }}>
        {[
          { top: "Download on the", big: "App Store" },
          { top: "GET IT ON", big: "Google Play" },
        ].map((b, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${C.gold}55`, borderRadius: 22, padding: "18px 30px", display: "flex", alignItems: "center", gap: 16, whiteSpace: "nowrap" }}>
            {i === 0 ? (
              <svg width={42} height={42} viewBox="0 0 24 24" fill={C.white}><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.635 0 2.935.06 4.478 2.22-.116.075-2.593 1.51-2.593 4.5 0 3.45 3.02 4.66 3.06 4.68z" /></svg>
            ) : (
              <span style={{ fontSize: 40, color: C.white }}>▶</span>
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
          Download KeepTrip — free
        </div>
      </div>

      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  ROOT — 1110 frames (37s)
//  Shot durations: 180 · 210 · 180 · 180 · 210 · 150
// ═══════════════════════════════════════════════════════════════════════════
export const SplitBillLaunch: React.FC = () => (
  <AbsoluteFill style={{ background: C.offwhite }}>
    <BgVideo />
    <Sequence durationInFrames={180}><Shot1 /></Sequence>
    <Sequence from={180} durationInFrames={210}><Shot2 /></Sequence>
    <Sequence from={390} durationInFrames={180}><Shot3 /></Sequence>
    <Sequence from={570} durationInFrames={180}><Shot4 /></Sequence>
    <Sequence from={750} durationInFrames={210}><Shot5 /></Sequence>
    <Sequence from={960} durationInFrames={150}><Shot6 /></Sequence>
  </AbsoluteFill>
);
