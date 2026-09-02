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
import { loadFont } from "@remotion/google-fonts/Nunito";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "800", "900"],
  subsets: ["latin"],
});

/* ══════════════════════════════════════════════════════════════════════════
   KeepTrip · "Split Bill Drama" — Instagram Reel
   25s · 9:16 (1080×1920) · 30fps · 750 frames
   6 shots: 120 + 120 + 150 + 150 + 150 + 60
   Faithful to:
     • split_bill_reel_storyboard.md  (shot list, timing, copy, audio)
     • split_bill_reel_preview.html   (scene composition + motion)
     • preview_share.html             (warm-beige live share page — Shot 5)
   Structure: Hook → Problem → Solution → Payoff → Share Live → CTA
   ══════════════════════════════════════════════════════════════════════════ */

// ─── Dark palette (from storyboard Visual Theme) ─────────────────────────────
const C = {
  bg:        "#0D0F11", // near-black warm
  surface:   "#1C1E22", // card / surface
  surface2:  "#151719",
  amber:     "#DB9F5C", // accent
  amberLite: "#E8B87A",
  amberSoft: "rgba(219,159,92,0.14)",
  amberSoft2:"rgba(219,159,92,0.28)",
  white:     "#FFFFFF",
  muted:     "#888888",
  red:       "#E05555",
  redSoft:   "rgba(224,85,85,0.15)",
  green:     "#5FC45F",
  greenBub:  "#1E2A1E",
} as const;

// ─── Warm palette (from preview_share.html — Shot 5 browser page) ─────────────
const W = {
  bg:        "#E8E4DC",
  text:      "#2D2926",
  text2:     "#7A7068",
  accent:    "#F59E0B",
  accentDk:  "#D97706",
  accentLt:  "#FEF3C7",
  green:     "#059669",
  divider:   "rgba(0,0,0,0.07)",
  neuRaised: "8px 8px 18px rgba(0,0,0,0.16), -8px -8px 18px rgba(255,255,255,0.85)",
  neuSubtle: "4px 4px 10px rgba(0,0,0,0.11), -4px -4px 10px rgba(255,255,255,0.8)",
  neuInset:  "inset 2px 2px 5px rgba(0,0,0,0.10), inset -2px -2px 5px rgba(255,255,255,0.72)",
} as const;

const f = (
  size: number,
  weight = 700,
  color: string = C.white,
): React.CSSProperties => ({
  fontFamily,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.2,
});

const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

const ec = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const OUT = Easing.bezier(0.23, 1, 0.32, 1); // ease-out cubic (from theme)
const sfx = (name: string) => staticFile(`sfx/${name}`);

// ─── Soft ambient blob (adds depth to flat dark bg) ──────────────────────────
const Blob: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  frame: number;
  phase?: number;
  amp?: number;
}> = ({ x, y, size, color, frame, phase = 0, amp = 34 }) => (
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
const Ico: React.FC<{ d: React.ReactNode; size: number; color: string; sw?: number }> = ({
  d,
  size,
  color,
  sw = 2,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const iconShare = (
  <>
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </>
);

// ─── Tap indicator: fingertip + ripple ───────────────────────────────────────
const Thumb: React.FC<{ press: number }> = ({ press }) => {
  const ripple = interpolate(press, [0.5, 1], [0, 1], ec);
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
          border: `3px solid ${C.amber}`,
          opacity: (1 - ripple) * 0.8,
          transform: `translate(-50%,-50%) scale(${0.4 + ripple * 1.6})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 34,
          width: 62,
          height: 148,
          borderRadius: 38,
          background: "linear-gradient(180deg, #F2CBA4 0%, #E0AE84 55%, #CE9A70 100%)",
          transform: "rotate(-18deg)",
          transformOrigin: "top center",
          boxShadow: "0 10px 26px rgba(0,0,0,0.4), inset 0 3px 0 rgba(255,255,255,0.35)",
        }}
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 1 · HOOK — kinetic typography + WA chat chaos   (0–4s · 120f)
// ═══════════════════════════════════════════════════════════════════════════
const HOOK_WORDS: { t: string; hl?: boolean }[] = [
  { t: "Masih" },
  { t: "ngitung" },
  { t: "patungan" },
  { t: "pake" },
  { t: "kalkulator", hl: true },
  { t: "di", hl: true },
  { t: "WA?", hl: true },
];
const CHAOS_BUBBLES = [
  { t: "berapa bagianku?? 🤔", top: 900, left: 120, rot: -5, delay: 56 },
  { t: "udah bayar belum? 😤", top: 1080, left: 470, rot: 5, delay: 70 },
  { t: "gue minta transferan ya 💸", top: 1270, left: 150, rot: -3, delay: 84 },
];

const Shot1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 8], [0, 1], ec);
  // faint amber glow that swells as chaos hits
  const glow = interpolate(frame, [40, 110], [0, 0.5], ec);

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: bgOp }}>
      <Sequence from={56} durationInFrames={14}><Audio src={sfx("pop.mp3")} volume={0.55} /></Sequence>
      <Sequence from={70} durationInFrames={14}><Audio src={sfx("pop.mp3")} volume={0.55} /></Sequence>
      <Sequence from={84} durationInFrames={14}><Audio src={sfx("lofi_pop.wav")} volume={0.6} /></Sequence>
      <Sequence from={92} durationInFrames={26}><Audio src={sfx("lofi_alert.wav")} volume={0.4} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 42%, ${C.amber}22 0%, transparent 70%)`, opacity: glow }} />
      <Blob x={-160} y={220} size={620} color={`${C.amber}12`} frame={frame} amp={26} />
      <Blob x={640} y={1200} size={560} color={`${C.red}10`} frame={frame} phase={2} amp={22} />

      {/* Kinetic headline — word-by-word snap */}
      <div
        style={{
          position: "absolute",
          top: 430,
          left: 90,
          right: 90,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          gap: "10px 22px",
        }}
      >
        {HOOK_WORDS.map((w, i) => {
          const s = spring({ frame: frame - (6 + i * 5), fps, config: { damping: 11, stiffness: 180 } });
          const op = interpolate(s, [0, 0.5], [0, 1], ec);
          const sc = interpolate(s, [0, 1], [0.6, 1]);
          return (
            <span
              key={i}
              style={{
                ...f(84, 900, w.hl ? C.amber : C.white),
                opacity: op,
                display: "inline-block",
                transform: `scale(${sc})`,
                textShadow: w.hl ? `0 0 30px ${C.amber}66` : "none",
                whiteSpace: "pre",
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>

      {/* Chaos chat bubbles — WA green, burst from different directions */}
      {CHAOS_BUBBLES.map((b, i) => {
        const s = spring({ frame: frame - b.delay, fps, config: { damping: 10, stiffness: 150 } });
        const op = interpolate(s, [0, 0.4], [0, 1], ec);
        const wob = Math.sin(frame * 0.12 + i) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: b.top,
              left: b.left,
              transform: `scale(${s}) rotate(${b.rot}deg) translateX(${wob}px)`,
              opacity: op,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "20px 28px",
              borderRadius: "22px 22px 22px 6px",
              background: C.greenBub,
              boxShadow: `0 0 26px ${C.amber}3A, 0 12px 30px rgba(0,0,0,0.45)`,
              ...f(38, 800, "#C7E6C7"),
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
            {b.t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 2 · PROBLEM — tangled debt web + 12 transaksi   (4–8s · 120f)
// ═══════════════════════════════════════════════════════════════════════════
const PENTAGON = (() => {
  const cx = 540, cy = 800, R = 330;
  const emojis = ["😎", "🤦‍♀️", "😤", "🫤", "😵"];
  return emojis.map((e, i) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    return { e, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
  });
})();
const AMOUNTS = [
  { t: "Rp 45.000", x: 175, y: 470 },
  { t: "Rp 67.500", x: 800, y: 560 },
  { t: "Rp 23.750", x: 200, y: 1130 },
  { t: "Rp 112.000", x: 760, y: 1120 },
];

const Shot2: React.FC = () => {
  const frame = useCurrentFrame();
  const bgOp = interpolate(frame, [0, 10], [0, 1], ec);
  // slow zoom-out 0.55 → 1.0
  const zoom = interpolate(frame, [0, 90], [0.55, 1], { ...ec, easing: OUT });
  // tangled lines draw in
  const draw = interpolate(frame, [8, 60], [0, 1], ec);
  // TOTAL:?? blink
  const blink = 0.55 + Math.abs(Math.sin(frame * 0.16)) * 0.45;

  // all pairwise edges of the pentagon
  const edges: [number, number][] = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) edges.push([i, j]);

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: bgOp }}>
      <Sequence durationInFrames={16}><Audio src={sfx("lofi_swoosh.wav")} volume={0.4} /></Sequence>
      <Sequence from={10} durationInFrames={70}><Audio src={sfx("compute_tick.wav")} volume={0.42} /></Sequence>
      <Sequence from={60} durationInFrames={26}><Audio src={sfx("lofi_alert.wav")} volume={0.4} /></Sequence>
      <Sequence from={92} durationInFrames={26}><Audio src={sfx("lofi_thump.wav")} volume={0.4} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 60% at 50% 42%, ${C.red}20 0%, transparent 70%)` }} />
      <Blob x={-140} y={300} size={640} color={`${C.red}16`} frame={frame} amp={26} />

      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "center 42%" }}>
        {/* tangled red debt lines */}
        <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 6px ${C.red}88)` }}>
          {edges.map(([i, j], k) => {
            const A = PENTAGON[i], B = PENTAGON[j];
            const len = Math.hypot(B.x - A.x, B.y - A.y);
            const local = interpolate(draw, [k / edges.length * 0.6, k / edges.length * 0.6 + 0.4], [0, 1], ec);
            return (
              <line
                key={k}
                x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                stroke={C.red}
                strokeWidth={2.4}
                opacity={0.4 + (k % 3) * 0.15}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - local)}
              />
            );
          })}
        </svg>

        {/* avatar circles */}
        {PENTAGON.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x - 55,
              top: p.y - 55,
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: C.surface,
              border: `3px solid ${C.red}99`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 54,
              boxShadow: `0 0 30px ${C.red}30`,
            }}
          >
            {p.e}
          </div>
        ))}

        {/* floating rupiah amounts */}
        {AMOUNTS.map((m, i) => {
          const op = interpolate(frame, [18 + i * 6, 32 + i * 6], [0, 1], ec);
          const fl = Math.sin(frame * 0.06 + i * 1.2) * 14;
          return (
            <div key={i} style={{ position: "absolute", left: m.x, top: m.y + fl, opacity: op, ...f(40, 800, C.red), ...tnum, textShadow: `0 0 18px ${C.red}55` }}>
              {m.t}
            </div>
          );
        })}

        {/* center TOTAL: ?? */}
        <div style={{ position: "absolute", top: 740, left: 0, right: 0, textAlign: "center", opacity: interpolate(frame, [30, 44], [0, 1], ec) }}>
          <div style={{ ...f(66, 900, C.amber), opacity: blink, textShadow: `0 0 40px ${C.amber}66` }}>TOTAL: ??</div>
        </div>
      </AbsoluteFill>

      {/* counter badge (stays fixed while scene zooms) */}
      <div
        style={{
          position: "absolute",
          top: 1560,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: interpolate(frame, [40, 54], [0, 1], ec),
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "16px 30px",
          borderRadius: 18,
          background: C.redSoft,
          border: `1.5px solid ${C.red}66`,
          ...f(46, 900, C.red),
        }}
      >
        12 transaksi dibutuhkan 😵
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 3 · SOLUTION — KeepTrip SplitBill app slides up   (8–13s · 150f)
// ═══════════════════════════════════════════════════════════════════════════
const SOLVE_AVATARS = ["🎯", "😎", "🧳", "🌴"];
const SOLVE_EXPENSES = [
  { icon: "🍜", name: "Makan", amt: "Rp 180.000" },
  { icon: "⛽", name: "Bensin", amt: "Rp 90.000" },
  { icon: "🎡", name: "Tiket", amt: "Rp 240.000" },
];

const Shot3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 10], [0, 1], ec);

  const rise = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 70 } });
  const phoneY = interpolate(rise, [0, 1], [1400, 0]);

  const btnPulse = 0.5 + Math.abs(Math.sin(frame * 0.12)) * 0.5;

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: bgOp }}>
      <Sequence durationInFrames={20}><Audio src={sfx("lofi_swoosh.wav")} volume={0.5} /></Sequence>
      <Sequence from={40} durationInFrames={12}><Audio src={sfx("pop.mp3")} volume={0.5} /></Sequence>
      <Sequence from={50} durationInFrames={12}><Audio src={sfx("pop.mp3")} volume={0.5} /></Sequence>
      <Sequence from={60} durationInFrames={12}><Audio src={sfx("pop.mp3")} volume={0.5} /></Sequence>
      <Sequence from={70} durationInFrames={12}><Audio src={sfx("pop.mp3")} volume={0.5} /></Sequence>
      <Sequence from={40} durationInFrames={40}><Audio src={sfx("lofi_chime.wav")} volume={0.4} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 50%, ${C.amber}18 0%, transparent 70%)` }} />
      <Blob x={-140} y={260} size={620} color={`${C.amber}14`} frame={frame} amp={24} />
      <Blob x={620} y={1200} size={560} color={`${C.amber}10`} frame={frame} phase={2} amp={20} />

      {/* Phone mockup */}
      <div
        style={{
          position: "absolute",
          top: 430,
          left: "50%",
          transform: `translateX(-50%) translateY(${phoneY}px)`,
          width: 640,
          height: 760,
          borderRadius: 54,
          background: C.surface2,
          border: `13px solid #000`,
          boxShadow: `0 0 60px ${C.amber}2E, 0 40px 110px rgba(0,0,0,0.6)`,
          overflow: "hidden",
          padding: "44px 30px 36px",
        }}
      >
        {/* app header */}
        <div style={{ textAlign: "center", ...f(30, 900, C.amber), letterSpacing: 1, marginBottom: 30 }}>
          ⚡ KEEPTRIP SPLIT BILL
        </div>

        {/* participant avatars */}
        <div style={{ display: "flex", justifyContent: "center", gap: 22, marginBottom: 34 }}>
          {SOLVE_AVATARS.map((e, i) => {
            const s = spring({ frame: frame - (40 + i * 10), fps, config: { damping: 9, stiffness: 160 } });
            return (
              <div
                key={i}
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  background: C.amberSoft,
                  border: `2px solid ${C.amberSoft2}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  transform: `scale(${s})`,
                }}
              >
                {e}
              </div>
            );
          })}
        </div>

        {/* expense rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {SOLVE_EXPENSES.map((e, i) => {
            const d = 84 + i * 12;
            const op = interpolate(frame, [d, d + 14], [0, 1], ec);
            const tx = interpolate(frame, [d, d + 16], [-40, 0], ec);
            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  transform: `translateX(${tx}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "20px 24px",
                  borderRadius: 18,
                  background: C.surface,
                }}
              >
                <div style={{ width: 60, height: 60, borderRadius: 16, background: C.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0 }}>{e.icon}</div>
                <span style={{ ...f(32, 700, C.white), flex: 1 }}>{e.name}</span>
                <span style={{ ...f(32, 900, C.white), ...tnum }}>{e.amt}</span>
              </div>
            );
          })}
        </div>

        {/* CTA button */}
        <div
          style={{
            marginTop: 34,
            textAlign: "center",
            padding: "24px",
            borderRadius: 18,
            background: C.amber,
            ...f(34, 900, "#000"),
            boxShadow: `0 0 ${28 * btnPulse}px ${C.amber}, 0 10px 30px rgba(219,159,92,0.35)`,
          }}
        >
          Selesaikan →
        </div>
      </div>

      {/* KeepTrip wordmark below phone */}
      <div style={{ position: "absolute", top: 1290, left: 0, right: 0, textAlign: "center", opacity: interpolate(frame, [30, 46], [0, 1], ec) }}>
        <span style={{ ...f(44, 900, C.amber), letterSpacing: -0.5 }}>KeepTrip</span>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 4 · PAYOFF — 12 → 2, clean settlement reveal   (13–18s · 150f)
// ═══════════════════════════════════════════════════════════════════════════
const PAY_ROWS = [
  { from: "🤦‍♀️", amt: "Rp 85.000", to: "😎" },
  { from: "🌴", amt: "Rp 42.000", to: "🎯" },
];

const Shot4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // left-to-right screen wipe reveal
  const wipe = interpolate(frame, [0, 18], [0, 1], { ...ec, easing: OUT });

  const twelve = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 110 } });
  const strike = interpolate(frame, [34, 46], [0, 1], ec);
  const two = spring({ frame: frame - 44, fps, config: { damping: 9, stiffness: 130 } });
  const capOp = interpolate(frame, [56, 70], [0, 1], ec);
  const check = spring({ frame: frame - 92, fps, config: { damping: 10, stiffness: 140 } });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence durationInFrames={18}><Audio src={sfx("lofi_swipe.wav")} volume={0.5} /></Sequence>
      <Sequence from={44} durationInFrames={26}><Audio src={sfx("ding_success.wav")} volume={0.5} /></Sequence>
      <Sequence from={44} durationInFrames={40}><Audio src={sfx("lofi_fanfare.wav")} volume={0.42} /></Sequence>
      <Sequence from={92} durationInFrames={20}><Audio src={sfx("lofi_check.wav")} volume={0.55} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 45%, ${C.amber}1C 0%, transparent 70%)` }} />
      <Blob x={-140} y={280} size={620} color={`${C.amber}14`} frame={frame} amp={22} />

      {/* 12 → 2 counter */}
      <div style={{ position: "absolute", top: 540, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 42 }}>
        <div style={{ position: "relative", opacity: interpolate(twelve, [0, 0.4], [0, 1], ec), transform: `scale(${interpolate(twelve, [0, 1], [0.7, 1])})` }}>
          <span style={{ ...f(150, 900, C.red), ...tnum, opacity: 0.55 }}>12</span>
          <div style={{ position: "absolute", top: "52%", left: "-6%", width: "112%", height: 8, background: C.red, borderRadius: 4, transform: `scaleX(${strike})`, transformOrigin: "left" }} />
        </div>
        <span style={{ ...f(66, 900, C.muted) }}>→</span>
        <span style={{ ...f(220, 900, C.amber), ...tnum, opacity: interpolate(two, [0, 0.4], [0, 1], ec), transform: `scale(${two})`, textShadow: `0 0 50px ${C.amber}77` }}>2</span>
      </div>

      {/* caption */}
      <div style={{ position: "absolute", top: 830, left: 0, right: 0, textAlign: "center", opacity: capOp }}>
        <div style={{ ...f(72, 900, C.amber) }}>Cuma 2 transaksi.</div>
        <div style={{ ...f(48, 800, C.white), marginTop: 8 }}>Bukan 12. ✓</div>
      </div>

      {/* clean settlement arrows */}
      <div style={{ position: "absolute", top: 1030, left: 90, right: 90, display: "flex", flexDirection: "column", gap: 26 }}>
        {PAY_ROWS.map((r, i) => {
          const d = 70 + i * 12;
          const op = interpolate(frame, [d, d + 14], [0, 1], ec);
          const ty = interpolate(frame, [d, d + 16], [26, 0], ec);
          return (
            <div key={i} style={{ opacity: op, transform: `translateY(${ty}px)`, display: "flex", alignItems: "center", gap: 22, padding: "22px 30px", borderRadius: 22, background: C.amberSoft, border: `1.5px solid ${C.amberSoft2}` }}>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, flexShrink: 0 }}>{r.from}</div>
              <div style={{ flex: 1, position: "relative", height: 3, background: C.amber }}>
                <div style={{ position: "absolute", top: -42, left: 0, right: 0, textAlign: "center", ...f(34, 900, C.white), ...tnum }}>{r.amt}</div>
                <div style={{ position: "absolute", right: -2, top: "50%", width: 0, height: 0, transform: "translateY(-50%)", borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: `16px solid ${C.amber}` }} />
              </div>
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, flexShrink: 0 }}>{r.to}</div>
            </div>
          );
        })}
      </div>

      {/* amber checkmark badge top-right */}
      <div style={{ position: "absolute", top: 240, right: 110, transform: `scale(${check})`, width: 120, height: 120, borderRadius: "50%", background: C.amberSoft, border: `2px solid ${C.amber}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, boxShadow: `0 0 40px ${C.amber}55` }}>
        ✅
      </div>

      {/* left→right wipe overlay retracting to reveal */}
      <div style={{ position: "absolute", inset: 0, background: C.bg, transform: `translateX(${wipe * 100}%)` }}>
        <div style={{ position: "absolute", left: -8, top: 0, bottom: 0, width: 16, background: C.amber, boxShadow: `0 0 40px ${C.amber}` }} />
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 5 · SHARE LIVE — dark app → warm browser page   (18–23s · 150f)
// ═══════════════════════════════════════════════════════════════════════════
const SHARE_ROWS = [
  { from: "Sari", to: "Budi", amt: "Rp 85.000", paid: false, av: "🤦‍♀️" },
  { from: "Riko", to: "Tami", amt: "Rp 42.000", paid: true, av: "🌴" },
];

const Shot5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase A: dark app + share tap (0–48) ; dissolve (48–66) ; Phase B: warm page
  const darkOp = interpolate(frame, [48, 66], [1, 0], ec);
  const warmOp = interpolate(frame, [48, 66], [0, 1], ec);

  // thumb tap on share button
  const press = interpolate(frame, [16, 30], [0, 1], ec) * interpolate(frame, [30, 42], [1, 0], ec);
  const thumbIn = interpolate(frame, [6, 20], [200, 0], { ...ec, easing: OUT });
  // share sheet rise
  const sheetY = interpolate(frame, [30, 48], [700, 0], { ...ec, easing: OUT });

  // warm card slide-up
  const cardRise = spring({ frame: frame - 62, fps, config: { damping: 16, stiffness: 80 } });
  const cardY = interpolate(cardRise, [0, 1], [40, 0]);
  const livePulse = 0.4 + Math.abs(Math.sin(frame * 0.14)) * 0.6;
  const overlayOp = interpolate(frame, [78, 94], [0, 1], ec);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={16} durationInFrames={14}><Audio src={sfx("lofi_tap.wav")} volume={0.55} /></Sequence>
      <Sequence from={32} durationInFrames={24}><Audio src={sfx("whoosh.mp3")} volume={0.45} /></Sequence>
      <Sequence from={62} durationInFrames={30}><Audio src={sfx("lofi_chime.wav")} volume={0.5} /></Sequence>

      {/* warm background revealed under the fading dark layer */}
      <AbsoluteFill style={{ background: W.bg, opacity: warmOp }} />

      {/* ── Phase A: dark KeepTrip app with share tap ── */}
      <AbsoluteFill style={{ opacity: darkOp }}>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 55% at 50% 45%, ${C.amber}18 0%, transparent 70%)` }} />
        <Blob x={-140} y={280} size={600} color={`${C.amber}12`} frame={frame} amp={22} />

        <div
          style={{
            position: "absolute",
            top: 360,
            left: "50%",
            transform: "translateX(-50%)",
            width: 640,
            height: 1000,
            borderRadius: 60,
            background: C.surface2,
            border: `13px solid #000`,
            boxShadow: "0 40px 110px rgba(0,0,0,0.6)",
            overflow: "hidden",
            padding: "44px 30px",
          }}
        >
          <div style={{ textAlign: "center", ...f(30, 900, C.amber), letterSpacing: 1, marginBottom: 30 }}>⚡ SPLIT BILL · SELESAI</div>
          {SHARE_ROWS.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 22px", borderRadius: 16, background: C.surface, marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.amberSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{r.av}</div>
              <span style={{ ...f(28, 700, C.white), flex: 1 }}>{r.from} → {r.to}</span>
              <span style={{ ...f(28, 900, C.amber), ...tnum }}>{r.amt}</span>
            </div>
          ))}
          {/* share button */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "24px",
              borderRadius: 18,
              background: C.amber,
              ...f(32, 900, "#000"),
              transform: `scale(${1 - press * 0.04})`,
              boxShadow: `0 0 ${20 + press * 30}px ${C.amber}, 0 10px 30px rgba(219,159,92,0.35)`,
            }}
          >
            <Ico size={30} color="#000" sw={2.6} d={iconShare} />
            Bagikan ke teman
          </div>
        </div>

        {/* iOS-style share sheet rising */}
        <div style={{ position: "absolute", left: 40, right: 40, bottom: 0, transform: `translateY(${sheetY}px)` }}>
          <div style={{ background: "rgba(28,30,34,0.98)", borderRadius: "28px 28px 0 0", padding: "26px 24px 40px", boxShadow: "0 -10px 50px rgba(0,0,0,0.6)" }}>
            <div style={{ width: 80, height: 6, borderRadius: 3, background: C.muted, margin: "0 auto 24px", opacity: 0.5 }} />
            <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
              {[{ e: "💬", l: "WhatsApp" }, { e: "🔗", l: "Salin Link" }, { e: "✈️", l: "Telegram" }].map((a, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 96, height: 96, borderRadius: 24, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>{a.e}</div>
                  <span style={{ ...f(22, 700, C.muted) }}>{a.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* thumb tapping the share button */}
        {frame >= 6 && frame < 44 && (
          <div style={{ position: "absolute", top: 1120, left: "58%", transform: `translateY(${thumbIn}px)` }}>
            <Thumb press={press} />
          </div>
        )}
      </AbsoluteFill>

      {/* ── Phase B: warm-beige live browser page (preview_share.html) ── */}
      <AbsoluteFill style={{ opacity: warmOp }}>
        <div
          style={{
            position: "absolute",
            top: 300,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 1080,
            borderRadius: 60,
            background: W.bg,
            border: `13px solid #2b2b2b`,
            boxShadow: "0 40px 110px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          {/* browser chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 26px 16px", background: "#DAD5CC" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["#E0655B", "#E7B84E", "#5FC46A"].map((c) => (
                <div key={c} style={{ width: 16, height: 16, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, background: W.bg, borderRadius: 12, padding: "10px 18px", ...f(22, 600, W.text2), boxShadow: W.neuInset, display: "flex", alignItems: "center", gap: 8 }}>
              🔒 keeptrip.app/s/x7k2
            </div>
          </div>

          {/* page header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "24px 30px", background: W.bg, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: 34 }}>🤝</div>
            <div style={{ flex: 1 }}>
              <div style={{ ...f(30, 800, W.text) }}>KeepTrip · Split Bill</div>
              <div style={{ ...f(19, 600, W.text2), marginTop: 3 }}>View-only · auto-refresh 10s</div>
            </div>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: W.green, opacity: livePulse, boxShadow: `0 0 ${14 * livePulse}px ${W.green}` }} />
          </div>

          {/* settlement card */}
          <div style={{ margin: 26, transform: `translateY(${cardY}px)`, opacity: cardRise, background: W.bg, borderRadius: 26, boxShadow: W.neuRaised, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 28px 20px", borderBottom: `1px solid ${W.divider}` }}>
              <span style={{ fontSize: 26 }}>🤝</span>
              <span style={{ ...f(28, 800, W.text), flex: 1 }}>Settlement</span>
              <span style={{ ...f(20, 700, W.text2), padding: "6px 14px", borderRadius: 20, boxShadow: W.neuInset }}>2</span>
            </div>
            {SHARE_ROWS.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 28px", borderBottom: i === 0 ? `1px solid ${W.divider}` : "none" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: W.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: W.neuSubtle }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...f(28, 700, W.text) }}>{r.from} → {r.to}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  <div style={{ ...f(28, 800, W.accent), ...tnum }}>{r.amt}</div>
                  {r.paid ? (
                    <span style={{ ...f(18, 800, W.green), padding: "5px 14px", borderRadius: 20, boxShadow: W.neuInset, letterSpacing: 0.5 }}>PAID ✓</span>
                  ) : (
                    <span style={{ ...f(18, 800, W.accentDk), background: W.accentLt, padding: "5px 14px", borderRadius: 20, letterSpacing: 0.5, boxShadow: `0 0 ${10 * livePulse}px rgba(245,158,11,0.4)` }}>UNPAID</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", ...f(20, 600, W.text2), marginTop: 6 }}>KeepTrip · keeptrip.app</div>
        </div>
      </AbsoluteFill>

      {/* text overlay */}
      <div style={{ position: "absolute", top: 120, left: 70, right: 70, textAlign: "center", opacity: overlayOp }}>
        <div style={{ display: "inline-block", background: "rgba(13,15,17,0.85)", borderRadius: 22, padding: "18px 32px", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
          <span style={{ ...f(48, 900, C.white) }}>Teman langsung lihat. </span>
          <span style={{ ...f(48, 900, C.amber) }}>Tanpa app.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  SHOT 6 · CTA — 0 debat / 0 drama / 0 kalkulator   (23–25s · 60f)
// ═══════════════════════════════════════════════════════════════════════════
const CTA_LINES = [
  { t: "0 debat.", amber: false },
  { t: "0 drama.", amber: false },
  { t: "0 kalkulator.", amber: true },
];

const Shot6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bgOp = interpolate(frame, [0, 8], [0, 1], ec); // fade in from black

  const underline = interpolate(frame, [26, 40], [0, 1], ec);
  const sendSpring = spring({ frame: frame - 34, fps, config: { damping: 14, stiffness: 90 } });
  const sendY = interpolate(sendSpring, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ background: C.bg, opacity: bgOp }}>
      <Sequence from={2} durationInFrames={16}><Audio src={sfx("lofi_whoosh.wav")} volume={0.45} /></Sequence>
      <Sequence from={14} durationInFrames={16}><Audio src={sfx("lofi_whoosh.wav")} volume={0.45} /></Sequence>
      <Sequence from={26} durationInFrames={16}><Audio src={sfx("lofi_whoosh.wav")} volume={0.5} /></Sequence>
      <Sequence from={34} durationInFrames={30}><Audio src={sfx("zen_bell.wav")} volume={0.4} /></Sequence>

      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 50% at 50% 42%, ${C.amber}16 0%, transparent 70%)` }} />
      <Blob x={-140} y={300} size={600} color={`${C.amber}12`} frame={frame} amp={22} />

      <div style={{ position: "absolute", top: 620, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {CTA_LINES.map((l, i) => {
          const s = spring({ frame: frame - (4 + i * 6), fps, config: { damping: 10, stiffness: 150 } });
          const op = interpolate(s, [0, 0.4], [0, 1], ec);
          const ty = interpolate(s, [0, 1], [30, 0]);
          return (
            <div key={i} style={{ position: "relative", opacity: op, transform: `translateY(${ty}px) scale(${interpolate(s, [0, 1], [0.85, 1])})` }}>
              <span style={{ ...f(112, 900, l.amber ? C.amber : C.white), textShadow: l.amber ? `0 0 40px ${C.amber}66` : "none" }}>{l.t}</span>
              {l.amber && (
                <div style={{ position: "absolute", bottom: -14, left: 0, right: 0, height: 8, background: C.amber, borderRadius: 4, transform: `scaleX(${underline})`, transformOrigin: "left" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* send-prompt CTA */}
      <div style={{ position: "absolute", top: 1120, left: 90, right: 90, textAlign: "center", opacity: sendSpring, transform: `translateY(${sendY}px)` }}>
        <span style={{ ...f(42, 700, C.white), fontStyle: "italic" }}>Kirim ke teman yang &lsquo;lupa&rsquo; bayar ➔</span>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
//  ROOT — 750 frames (25s) · shot durations 120·120·150·150·150·60
// ═══════════════════════════════════════════════════════════════════════════
export const SplitBillReel: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Sequence durationInFrames={120}><Shot1 /></Sequence>
    <Sequence from={120} durationInFrames={120}><Shot2 /></Sequence>
    <Sequence from={240} durationInFrames={150}><Shot3 /></Sequence>
    <Sequence from={390} durationInFrames={150}><Shot4 /></Sequence>
    <Sequence from={540} durationInFrames={150}><Shot5 /></Sequence>
    <Sequence from={690} durationInFrames={60}><Shot6 /></Sequence>
  </AbsoluteFill>
);
