import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { loadFont } from "@remotion/google-fonts/Nunito";

import bgTeaserJson    from "../../../public/lottie/bg_teaser.json";
import bgSpendJson     from "../../../public/lottie/bg_spend.json";
import bgMapJson       from "../../../public/lottie/bg_map.json";
import bgCurrenciesJson from "../../../public/lottie/bg_currencies.json";
import bgPhotosJson    from "../../../public/lottie/bg_photos.json";
import bgFinaleJson    from "../../../public/lottie/bg_finale.json";

const { fontFamily } = loadFont();

const bgTeaser     = bgTeaserJson     as unknown as LottieAnimationData;
const bgSpend      = bgSpendJson      as unknown as LottieAnimationData;
const bgMap        = bgMapJson        as unknown as LottieAnimationData;
const bgCurrencies = bgCurrenciesJson as unknown as LottieAnimationData;
const bgPhotos     = bgPhotosJson     as unknown as LottieAnimationData;
const bgFinale     = bgFinaleJson     as unknown as LottieAnimationData;

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:       "#1C1C2A",
  surface:    "#252535",
  card:       "#2A2A3D",
  amber:      "#DB9F5C",
  orange:     "#FF5C39",
  white:      "#E8E8F0",
  purpleDark: "#1a0533",
  navyDark:   "#0a2a4a",
  success:    "#4CAF82",
  blue:       "#5C8FE0",
} as const;

const f = (size: number, weight = 600, color: string = C.white): React.CSSProperties => ({
  fontFamily, fontSize: size, fontWeight: weight, color,
});

const Icon: React.FC<{ path: string; size?: number; style?: React.CSSProperties }> = (
  { path, size = 48, style }
) => (
  <Img src={staticFile(path)} style={{ width: size, height: size, objectFit: "contain", ...style }} />
);

interface Stat { icon: string; label: string; value: number | null; prefix?: string; text?: string; }

// ─── Animated Background ───────────────────────────────────────────────────────
// Layers: Lottie base → ambient blobs → rotating dashed rings → floating geometry
interface AnimBgProps {
  frame: number;
  lottie?: LottieAnimationData;
  lottieOpacity?: number;
  accent?: string;
  accent2?: string;
}

const AnimBg: React.FC<AnimBgProps> = ({
  frame,
  lottie,
  lottieOpacity = 0.22,
  accent = C.amber,
  accent2 = C.orange,
}) => {
  // Slow-oscillating blob positions (cheap parallax)
  const b1x = Math.sin(frame * 0.018) * 80;
  const b1y = Math.cos(frame * 0.022) * 100;
  const b2x = Math.cos(frame * 0.015) * 60;
  const b2y = Math.sin(frame * 0.019) * 80;
  // Ring rotations
  const r1  = frame * 0.5;
  const r2  = -frame * 0.35;
  // Tiny floating shapes (triangles / diamonds / squares)
  const floats = [
    { bx: 140, by: 380,  sz: 26, ph: 0,   shape: 0 },
    { bx: 880, by: 220,  sz: 20, ph: 1.6, shape: 1 },
    { bx:  80, by: 1480, sz: 22, ph: 3.1, shape: 0 },
    { bx: 960, by: 1150, sz: 18, ph: 4.7, shape: 1 },
    { bx: 520, by: 700,  sz: 14, ph: 2.3, shape: 2 },
    { bx: 200, by: 950,  sz: 16, ph: 5.8, shape: 0 },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {lottie && (
        <AbsoluteFill style={{ opacity: lottieOpacity }}>
          <Lottie animationData={lottie} loop style={{ width: "100%", height: "100%" }} />
        </AbsoluteFill>
      )}

      {/* Ambient blob 1 — bottom-left */}
      <div style={{
        position: "absolute", width: 800, height: 800, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}22 0%, transparent 65%)`,
        bottom: -280 + b1y, left: -280 + b1x,
      }} />
      {/* Ambient blob 2 — top-right */}
      <div style={{
        position: "absolute", width: 620, height: 620, borderRadius: "50%",
        background: `radial-gradient(circle, ${accent2}18 0%, transparent 65%)`,
        top: -200 + b2y, right: -200 + b2x,
      }} />

      {/* Rotating dashed ring 1 */}
      <svg style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%,-50%) rotate(${r1}deg)`, opacity: 0.06 }}
        width={1000} height={1000} viewBox="0 0 1000 1000">
        <ellipse cx={500} cy={500} rx={460} ry={280} fill="none" stroke={accent} strokeWidth={2} strokeDasharray="30 20" />
      </svg>
      {/* Rotating dashed ring 2 */}
      <svg style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%,-50%) rotate(${r2}deg)`, opacity: 0.04 }}
        width={700} height={700} viewBox="0 0 700 700">
        <ellipse cx={350} cy={350} rx={310} ry={190} fill="none" stroke={accent2} strokeWidth={1.5} strokeDasharray="15 25" />
      </svg>

      {/* Floating geometric shapes — morphs via rotation + drift */}
      {floats.map(({ bx, by, sz, ph, shape }, i) => {
        const fx  = bx + Math.sin(frame * 0.02 + ph) * 35;
        const fy  = by + Math.cos(frame * 0.017 + ph) * 45;
        const rot = frame * 0.45 + ph * 22;
        return (
          <svg key={i} style={{ position: "absolute", left: fx, top: fy, transform: `rotate(${rot}deg)`, opacity: 0.09 }}
            width={sz} height={sz} viewBox="0 0 24 24">
            {shape === 0 && <polygon points="12,2 22,22 2,22" fill={i % 2 === 0 ? accent : accent2} />}
            {shape === 1 && <polygon points="12,2 22,12 12,22 2,12" fill={accent} />}
            {shape === 2 && <rect x={2} y={2} width={20} height={20} rx={5} fill={accent2} />}
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Logo Drawing Animation ────────────────────────────────────────────────────
// Exact perimeters (calculated from polygon vertices):
//   Outer K path: 1116 px
//   Inner K path:  593 px
//
// Animation phases (relative to component's `frame` input):
//   0  → 60  : outer path stroke draws in
//   25 → 80  : inner path stroke draws in (overlapping for flow)
//   70 → 100 : fill fades in
//   88 → 115 : stroke fades out → clean filled logo

const PATH1 = 1116;
const PATH2 = 593;

const PATH1_D = "M358.5 68.5H423.5L272 256.5L423.5 445H358.5L192 256.5L358.5 68.5Z";
const PATH2_D = "M183.5 172H244L169 257L244 340.5H183.5L93.5 257L183.5 172Z";
const LOGO_COLOR = "#EA9C2F";

interface LogoDrawingProps {
  frame: number;
  size?: number;
}

const LogoDrawing: React.FC<LogoDrawingProps> = ({ frame, size = 200 }) => {
  const p1 = interpolate(frame, [0, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p2 = interpolate(frame, [25, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fillOp   = interpolate(frame, [70, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const strokeOp = interpolate(frame, [88, 115], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const sw = Math.round((size / 512) * 14); // stroke width scales with size

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      {/* ── Stroke layer: draws each path progressively ── */}
      <g opacity={strokeOp}>
        {/* Outer K — draws first */}
        <path
          d={PATH1_D}
          stroke={LOGO_COLOR}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={PATH1}
          strokeDashoffset={PATH1 * (1 - p1)}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Inner K — draws second with a head-start overlap */}
        <path
          d={PATH2_D}
          stroke={LOGO_COLOR}
          strokeWidth={sw}
          fill="none"
          strokeDasharray={PATH2}
          strokeDashoffset={PATH2 * (1 - p2)}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Drawing cursor dot — follows the tip of the outer stroke */}
        <circle
          cx={358.5 + (423.5 - 358.5) * Math.min(1, p1 * 6)}
          cy={68.5}
          r={sw * 1.5}
          fill={LOGO_COLOR}
          opacity={p1 < 1 ? 0.9 : 0}
        />
      </g>

      {/* ── Fill layer: fades in once strokes are drawn ── */}
      <g opacity={fillOp}>
        <path d={PATH1_D} fill={LOGO_COLOR} />
        <path d={PATH2_D} fill={LOGO_COLOR} />
      </g>
    </svg>
  );
};

// ─── Scene 1: Hook — 5 s (150 frames) ─────────────────────────────────────────
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp  = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const scale = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 80 } });
  const lineW = interpolate(frame, [25, 62], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp = interpolate(frame, [58, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qOp   = interpolate(frame, [85, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy, opacity: bgOp }}>
      <AnimBg frame={frame} lottie={bgTeaser} lottieOpacity={0.35} />

      {/* Orbiting particles centred on logo */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r  = 300 + i * 25;
        const px = Math.cos(angle + frame * 0.014) * r;
        const py = Math.sin(angle + frame * 0.014) * r;
        const pOp = interpolate(frame, [40, 70], [0, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          * (0.4 + Math.sin(frame * 0.07 + i) * 0.3);
        return (
          <div key={i} style={{
            position: "absolute", borderRadius: "50%",
            width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4,
            backgroundColor: C.amber, opacity: pOp,
            top: "42%", left: "50%",
            transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
          }} />
        );
      })}

      {/* SFX — logo draw tone starts with animation */}
      <Sequence from={8} durationInFrames={66}>
        <Audio src={staticFile("/sfx/logo_draw.wav")} volume={0.7} />
      </Sequence>

      {/* Logo block — centre at ~42 %, uses LogoDrawing SVG animation */}
      <div style={{
        position: "absolute", top: "42%", left: "50%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        textAlign: "center", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 20,
      }}>
        <LogoDrawing frame={frame - 8} size={140} />
        <div style={{ ...f(96, 800, C.amber), letterSpacing: -3 }}>KeepTrip</div>
        <div style={{ height: 5, backgroundColor: C.amber, borderRadius: 3, width: `${lineW}%`, alignSelf: "stretch" }} />
      </div>

      {/* Tagline — ~63 % */}
      <div style={{ position: "absolute", top: "63%", width: "100%", textAlign: "center", opacity: tagOp, ...f(38, 600) }}>
        Smart Travel Expense Tracker
      </div>

      {/* Hook question — ~76 % */}
      <div style={{
        position: "absolute", top: "76%", width: "100%",
        textAlign: "center", opacity: qOp, ...f(30, 600),
        color: `${C.white}aa`, padding: "0 80px", lineHeight: 1.7,
      }}>
        Every trip has a story.{"\n"}Are you tracking yours?
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Problem — category icons float instead of currency symbols ────────
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  const catIcons = [
    { path: "/icons/flight.svg",       color: C.blue    },
    { path: "/icons/food_noodles.svg", color: C.orange  },
    { path: "/icons/hotel.svg",        color: C.amber   },
    { path: "/icons/shopping_bag.svg", color: "#E060A0" },
    { path: "/icons/party.svg",        color: C.success },
    { path: "/icons/globe.svg",        color: C.blue    },
    { path: "/icons/money_bag.svg",    color: C.amber   },
    { path: "/icons/receipt.svg",      color: C.orange  },
  ];

  const bgOp   = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const cardOp = interpolate(frame, [50, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy, opacity: bgOp }}>
      {/* SFX — scene transition whoosh */}
      <Sequence from={0} durationInFrames={18}>
        <Audio src={staticFile("/sfx/scene_whoosh.wav")} volume={0.5} />
      </Sequence>

      <AnimBg frame={frame} lottie={bgSpend} lottieOpacity={0.2} />

      {/* Floating category icon tiles — 3 columns × 3 rows spread across 1920 px */}
      {catIcons.map(({ path, color }, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const bx  = col * 340 + 60;
        const by  = row * 560 + 160;
        const wx  = Math.sin(frame * 0.07 + i * 1.3) * 35;
        const wy  = Math.cos(frame * 0.09 + i * 0.8) * 45;
        const rot = Math.sin(frame * 0.04 + i) * 14;
        const op  = interpolate(frame, [i * 5, i * 5 + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const pulse = 1 + Math.sin(frame * 0.06 + i * 1.2) * 0.07;
        return (
          <div key={i} style={{
            position: "absolute", left: bx + wx, top: by + wy,
            transform: `rotate(${rot}deg) scale(${pulse})`,
            opacity: op,
            filter: `drop-shadow(0 0 20px ${color}60)`,
          }}>
            <div style={{
              width: 88, height: 88, backgroundColor: `${color}20`,
              borderRadius: 24, border: `2px solid ${color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon path={path} size={52} />
            </div>
          </div>
        );
      })}

      {/* Problem card */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: `${C.surface}ee`, borderRadius: 28,
        padding: "44px 72px", opacity: cardOp,
        boxShadow: "0 16px 56px rgba(0,0,0,0.7)",
        textAlign: "center", whiteSpace: "nowrap",
        border: `1px solid ${C.card}`,
      }}>
        <div style={{ ...f(48, 700) }}>Where did my</div>
        <div style={{ ...f(60, 800, C.orange), marginTop: 12 }}>budget go??</div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <Icon path="/icons/money_wings.svg" size={80} style={{ opacity: 0.9 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Trip Dashboard — card fits content, margin 16 ──────────────────
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 60 } });
  const cardSlide  = interpolate(cardSpring, [0, 1], [900, 0]);
  const donutP     = interpolate(frame, [40, 110], [0, 0.68], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const countVal   = Math.floor(interpolate(frame, [40, 110], [0, 340000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const headerOp   = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const circ       = 2 * Math.PI * 80;

  const cats = [
    { path: "/icons/flight.svg",       label: "Transport", color: C.blue,    amt: 82000,  pct: 24 },
    { path: "/icons/food_noodles.svg", label: "Food",      color: C.orange,  amt: 120000, pct: 35 },
    { path: "/icons/hotel.svg",        label: "Stay",      color: C.amber,   amt: 85000,  pct: 25 },
    { path: "/icons/shopping_bag.svg", label: "Shopping",  color: "#E060A0", amt: 35000,  pct: 10 },
    { path: "/icons/party.svg",        label: "Fun",       color: C.success, amt: 18000,  pct: 6  },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <AnimBg frame={frame} lottie={bgMap} lottieOpacity={0.20} accent={C.blue} />

      {/* Header */}
      <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", opacity: headerOp }}>
        <div style={{ ...f(52, 800, C.amber) }}>All your trips.</div>
        <div style={{ ...f(52, 800) }}>One place.</div>
      </div>

      {/* Card — margin 16, height fits content */}
      <div style={{
        position: "absolute", left: 16, right: 16, top: 200,
        backgroundColor: C.surface, borderRadius: 28,
        padding: 24,
        transform: `translateY(${cardSlide}px)`,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
        border: `1px solid ${C.card}`,
      }}>
        {/* Destination */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <Icon path="/icons/tower.svg" size={40} />
          <div style={{ ...f(36, 800) }}>Tokyo, Japan</div>
        </div>
        <div style={{ ...f(18, 500), color: `${C.white}60`, marginBottom: 20 }}>
          Mar 10 – Mar 20, 2025 · 10 days
        </div>

        {/* Donut + budget — compact row */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
          <svg width={160} height={160} viewBox="0 0 160 160">
            <circle cx={80} cy={80} r={80} fill="none" stroke={C.card} strokeWidth={18} />
            <circle cx={80} cy={80} r={80} fill="none" stroke={C.amber} strokeWidth={18}
              strokeDasharray={`${circ * donutP} ${circ}`}
              strokeDashoffset={circ * 0.25} strokeLinecap="round" />
            <text x={80} y={76} textAnchor="middle" fill={C.amber}
              style={{ fontFamily, fontSize: 22, fontWeight: 800 }}>68%</text>
            <text x={80} y={97} textAnchor="middle" fill={`${C.white}60`}
              style={{ fontFamily, fontSize: 14 }}>used</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ ...f(14, 500), color: `${C.white}50`, marginBottom: 4 }}>Total Spent</div>
            <div style={{ ...f(34, 800, C.amber) }}>¥ {countVal.toLocaleString()}</div>
            <div style={{ ...f(14, 500), color: `${C.white}50`, marginTop: 6 }}>of ¥ 500,000</div>
            <div style={{ backgroundColor: C.card, borderRadius: 6, height: 8, marginTop: 12, overflow: "hidden" }}>
              <div style={{ width: `${donutP * 100}%`, height: "100%", backgroundColor: C.amber, borderRadius: 6 }} />
            </div>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: `${C.white}12`, marginBottom: 16 }} />

        {/* Category list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {cats.map(({ path, label, color, amt, pct }, i) => {
            const barW  = interpolate(frame, [80 + i * 8, 110 + i * 8], [0, pct], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const rowOp = interpolate(frame, [70 + i * 8, 90 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={i} style={{ opacity: rowOp, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: `${color}20`, border: `1.5px solid ${color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon path={path} size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ ...f(17, 600) }}>{label}</span>
                    <span style={{ ...f(17, 700, color) }}>¥ {amt.toLocaleString()}</span>
                  </div>
                  <div style={{ backgroundColor: C.card, borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${barW}%`, height: "100%", backgroundColor: color, borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Multi-Currency — globe + fit conversion card, margin 16 ─────────
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  const currencies = ["USD", "JPY", "EUR", "IDR", "GBP", "THB"];
  const convAmt    = Math.floor(interpolate(frame, [40, 90], [0, 1583000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const headerOp   = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const cardOp     = interpolate(frame, [50, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const globeOp    = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const GLOBE_SIZE = 360;
  const GLOBE_TOP  = 180;
  const GLOBE_CY   = GLOBE_TOP + GLOBE_SIZE / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      {/* SFX — globe spin + scene whoosh */}
      <Sequence from={0} durationInFrames={18}>
        <Audio src={staticFile("/sfx/scene_whoosh.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={8} durationInFrames={48}>
        <Audio src={staticFile("/sfx/currency_spin.wav")} volume={0.55} />
      </Sequence>

      <AnimBg frame={frame} lottie={bgCurrencies} lottieOpacity={0.18} accent={C.amber} accent2={C.blue} />

      {/* Header */}
      <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", opacity: headerOp }}>
        <div style={{ ...f(52, 800) }}>One trip.</div>
        <div style={{ ...f(52, 800, C.amber) }}>Many currencies.</div>
      </div>

      {/* Globe */}
      <div style={{ position: "absolute", top: GLOBE_TOP, left: "50%", transform: "translateX(-50%)", opacity: globeOp }}>
        <div style={{
          width: GLOBE_SIZE, height: GLOBE_SIZE, borderRadius: "50%",
          overflow: "hidden", border: `2px solid ${C.amber}`,
          boxShadow: `0 0 60px ${C.amber}40, inset 0 0 40px rgba(0,0,0,0.5)`,
        }}>
          <Img src={staticFile("/images/earth-night.jpg")} style={{
            width: "120%", height: "120%", objectFit: "cover",
            marginLeft: "-10%", marginTop: "-10%",
            transform: `rotate(${frame * 0.22}deg)`,
            transformOrigin: "center center",
          }} />
        </div>
        <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: `1px solid ${C.amber}35` }} />
        <div style={{ position: "absolute", inset: -18, borderRadius: "50%", border: `1px solid ${C.amber}18` }} />
      </div>

      {/* Currency pills — orbit around globe centre */}
      {currencies.map((cur, i) => {
        const angle = (i / currencies.length) * Math.PI * 2 + frame * 0.022;
        const rx = 220, ry = 210;
        const px = Math.cos(angle) * rx;
        const py = Math.sin(angle) * ry;
        const pOp = interpolate(frame, [10 + i * 5, 30 + i * 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={cur} style={{
            position: "absolute", top: GLOBE_CY, left: "50%",
            transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
            backgroundColor: C.card, border: `1.5px solid ${C.amber}`,
            borderRadius: 20, padding: "6px 18px",
            ...f(20, 700, C.amber), opacity: pOp, whiteSpace: "nowrap",
          }}>
            {cur}
          </div>
        );
      })}

      {/* Conversion card — margin 16, fits content, sits below globe */}
      <div style={{
        position: "absolute",
        left: 16, right: 16,
        top: GLOBE_TOP + GLOBE_SIZE + 24,
        backgroundColor: C.surface, borderRadius: 28,
        padding: 24, opacity: cardOp,
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        border: `1px solid ${C.card}`,
      }}>
        {/* Conversion row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ ...f(14, 500), color: `${C.white}50`, marginBottom: 4 }}>You spend</div>
            <div style={{ ...f(38, 800) }}>$100 USD</div>
          </div>
          <Icon path="/icons/currency.svg" size={48} />
          <div style={{ textAlign: "right" }}>
            <div style={{ ...f(14, 500), color: `${C.white}50`, marginBottom: 4 }}>You get</div>
            <div style={{ ...f(32, 800, C.amber) }}>Rp {convAmt.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: `${C.white}12`, marginBottom: 16 }} />

        {[
          { from: "1 USD", to: "0.93 EUR", icon: "/icons/flight.svg"  },
          { from: "1 USD", to: "150.2 JPY", icon: "/icons/globe.svg"  },
          { from: "1 USD", to: "0.79 GBP",  icon: "/icons/map.svg"   },
        ].map(({ from, to, icon }, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            marginBottom: i < 2 ? 12 : 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon path={icon} size={22} style={{ opacity: 0.6 }} />
              <span style={{ ...f(17, 500), color: `${C.white}65` }}>{from}</span>
            </div>
            <span style={{ ...f(17, 700, C.amber) }}>{to}</span>
          </div>
        ))}

        <div style={{ marginTop: 16, textAlign: "center", ...f(14, 500), color: `${C.white}45` }}>
          Live rates · Updated every minute
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Add Expense — bottom sheet fits content, margin 16 ───────────────
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sheetSpring = spring({ frame: frame - 40, fps, config: { damping: 16, stiffness: 70 } });
  const sheetSlide  = interpolate(sheetSpring, [0, 1], [900, 0]);
  const amt         = Math.floor(interpolate(frame, [60, 108], [0, 2400], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const fabScale    = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const checkOp     = interpolate(frame, [150, 175], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const headerOp    = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fabOp       = interpolate(frame, [0, 18, 32, 46], [0, 0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const sheetCats = [
    { path: "/icons/food_noodles.svg", label: "Food",      active: true  },
    { path: "/icons/flight.svg",       label: "Transport", active: false },
    { path: "/icons/hotel.svg",        label: "Stay",      active: false },
    { path: "/icons/shopping_bag.svg", label: "Shop",      active: false },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      {/* SFX — whoosh in, tap when category selected, ding when saved */}
      <Sequence from={0} durationInFrames={18}>
        <Audio src={staticFile("/sfx/scene_whoosh.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={40} durationInFrames={4}>
        <Audio src={staticFile("/sfx/expense_tap.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={150} durationInFrames={33}>
        <Audio src={staticFile("/sfx/ding_success.wav")} volume={0.75} />
      </Sequence>

      <AnimBg frame={frame} lottie={bgPhotos} lottieOpacity={0.18} accent={C.orange} />

      {/* App top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 130,
        backgroundColor: `${C.surface}ee`,
        display: "flex", alignItems: "flex-end", padding: "0 24px 18px",
        borderBottom: `1px solid ${C.card}`, opacity: headerOp,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Icon path="/icons/tower.svg" size={32} />
          <div>
            <div style={{ ...f(26, 800) }}>Tokyo Trip</div>
            <div style={{ ...f(14, 500), color: `${C.white}55`, marginTop: 2 }}>Mar 10–20, 2025</div>
          </div>
        </div>
      </div>

      {/* Header text */}
      <div style={{ position: "absolute", top: 158, width: "100%", textAlign: "center", opacity: headerOp }}>
        <div style={{ ...f(48, 800) }}>Log it in</div>
        <div style={{ ...f(48, 800, C.amber) }}>seconds.</div>
      </div>

      {/* Summary stat cards — margin 16 */}
      <div style={{
        position: "absolute", top: 322, left: 16, right: 16,
        display: "flex", gap: 12, opacity: headerOp,
      }}>
        {[
          { label: "Expenses", val: "42",   icon: "/icons/receipt.svg"   },
          { label: "Avg/day",  val: "¥34k", icon: "/icons/analytics.svg" },
          { label: "Days",     val: "10",   icon: "/icons/compass.svg"   },
        ].map(({ label, val, icon }, i) => (
          <div key={i} style={{
            flex: 1, backgroundColor: C.surface, borderRadius: 20,
            padding: "18px 14px", textAlign: "center",
            border: `1px solid ${C.card}`,
          }}>
            <Icon path={icon} size={28} style={{ marginBottom: 10 }} />
            <div style={{ ...f(24, 800, C.amber) }}>{val}</div>
            <div style={{ ...f(13, 500), color: `${C.white}50`, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <div style={{
        position: "absolute", bottom: 500, left: "50%", zIndex: 20,
        transform: `translateX(-50%) scale(${fabScale})`,
        opacity: fabOp,
      }}>
        <div style={{
          width: 76, height: 76, backgroundColor: C.amber,
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          ...f(42, 400, C.navy), boxShadow: `0 6px 32px ${C.amber}80`,
        }}>+</div>
      </div>

      {/* Bottom sheet — margin 16 on sides, fits content */}
      <div style={{
        position: "absolute", bottom: 0, left: 16, right: 16,
        backgroundColor: C.card, borderRadius: "32px 32px 0 0",
        transform: `translateY(${sheetSlide}px)`,
        padding: "22px 20px 36px",
        boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
        border: `1px solid ${C.surface}`,
      }}>
        <div style={{ width: 48, height: 5, backgroundColor: `${C.white}25`, borderRadius: 3, margin: "0 auto 24px" }} />

        <div style={{ ...f(20, 600), color: `${C.white}55`, marginBottom: 16 }}>Select Category</div>

        {/* Category tiles */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {sheetCats.map(({ path, label, active }, i) => (
            <div key={i} style={{
              flex: 1, backgroundColor: active ? `${C.orange}22` : C.surface,
              borderRadius: 16, padding: "16px 10px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              border: active ? `2px solid ${C.orange}` : `2px solid ${C.surface}`,
            }}>
              <Icon path={path} size={34} />
              <span style={{ ...f(14, 600), color: active ? C.orange : `${C.white}65` }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ ...f(18, 500), color: `${C.white}50`, marginBottom: 10 }}>Amount</div>
        <div style={{ ...f(64, 800, C.amber), lineHeight: 1, marginBottom: 20 }}>
          ¥ {amt.toLocaleString()}
        </div>

        {/* AI badge */}
        <div style={{
          backgroundColor: `${C.blue}18`, border: `1.5px solid ${C.blue}`,
          borderRadius: 14, padding: "12px 20px",
          display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20,
        }}>
          <Icon path="/icons/ai.svg" size={28} />
          <div>
            <div style={{ ...f(16, 700, C.blue) }}>AI Receipt Scan</div>
            <div style={{ ...f(12, 500), color: `${C.white}50`, marginTop: 2 }}>Auto-fill from photo</div>
          </div>
        </div>

        {/* Save button */}
        <div style={{
          backgroundColor: C.amber, borderRadius: 18,
          padding: "20px", textAlign: "center",
          ...f(24, 800, C.navy),
          boxShadow: `0 8px 32px ${C.amber}55`,
        }}>
          Save Expense
        </div>
      </div>

      {/* Success overlay */}
      <AbsoluteFill style={{
        backgroundColor: `${C.success}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: checkOp,
      }}>
        <div style={{ textAlign: "center" }}>
          <Icon path="/icons/receipt.svg" size={130} />
          <div style={{ ...f(40, 800, C.success), marginTop: 20 }}>Saved!</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 6: Split Bill ───────────────────────────────────────────────────────
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const avatars = [
    { color: C.amber,   name: "You",  share: "$60" },
    { color: C.blue,    name: "Alex", share: "$60" },
    { color: "#E060A0", name: "Sam",  share: "$60" },
  ];

  const lineP   = interpolate(frame, [35, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const totalOp = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagOp   = interpolate(frame, [85, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const BILL_Y   = 614;
  const AVATAR_Y = 1190;

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <AnimBg frame={frame} accent={C.amber} accent2={C.blue} />

      {/* Header */}
      <div style={{
        position: "absolute", top: 80, width: "100%", textAlign: "center",
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        <div style={{ ...f(52, 800) }}>Travel together.</div>
        <div style={{ ...f(52, 800, C.amber) }}>Split fairly.</div>
      </div>

      {/* Bill total */}
      <div style={{
        position: "absolute", top: BILL_Y, left: "50%",
        transform: "translateX(-50%)", textAlign: "center", opacity: totalOp,
      }}>
        <div style={{ ...f(22, 600), color: `${C.white}55`, marginBottom: 8 }}>Total Bill</div>
        <div style={{ ...f(110, 800) }}>$180</div>
        <div style={{ ...f(20, 500), color: `${C.white}55`, marginTop: 8 }}>3 people · dinner</div>
      </div>

      {/* Animated split lines */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 1080 1920">
        {avatars.map((av, i) => {
          const endX = [180, 540, 900][i];
          const curX = 540 + (endX - 540) * lineP;
          const curY = (BILL_Y + 130) + (AVATAR_Y - (BILL_Y + 130)) * lineP;
          return (
            <line key={i} x1={540} y1={BILL_Y + 130} x2={curX} y2={curY}
              stroke={av.color} strokeWidth={4} opacity={0.7} />
          );
        })}
      </svg>

      {/* Avatar circles */}
      {avatars.map(({ color, name, share }, i) => {
        const lefts = ["17%", "50%", "83%"];
        const aOp   = interpolate(frame, [18 + i * 12, 40 + i * 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const aScale = spring({ frame: frame - 20 - i * 12, fps, config: { damping: 12, stiffness: 120 } });
        return (
          <div key={i} style={{
            position: "absolute", top: AVATAR_Y, left: lefts[i],
            transform: `translateX(-50%) scale(${aScale})`,
            textAlign: "center", opacity: aOp,
          }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              backgroundColor: `${color}25`, border: `4px solid ${color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", ...f(48, 700, color),
            }}>
              {name[0]}
            </div>
            <div style={{ ...f(24, 700) }}>{name}</div>
            <div style={{
              marginTop: 14, backgroundColor: `${color}20`,
              border: `2px solid ${color}`, borderRadius: 18,
              padding: "10px 28px", ...f(30, 800, color),
            }}>{share}</div>
          </div>
        );
      })}

      {/* Tagline */}
      <div style={{
        position: "absolute", bottom: 100, width: "100%",
        textAlign: "center", opacity: tagOp, ...f(30, 600), color: `${C.white}70`,
      }}>
        No awkward math. No arguments.
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 7: Yearly Wrapped — stats × 6 s, then 3 s category summary ─────────
// Total: 270 frames = 9 s
const Scene7: React.FC = () => {
  const frame = useCurrentFrame();

  const stats: Stat[] = [
    { icon: "/icons/globe.svg",        label: "Countries visited", value: 8              },
    { icon: "/icons/flight.svg",       label: "Trips this year",   value: 24             },
    { icon: "/icons/money_bag.svg",    label: "Total spent",       value: 12450, prefix: "$" },
    { icon: "/icons/food_noodles.svg", label: "Most spent on",     value: null,  text: "Food" },
    { icon: "/icons/trophy.svg",       label: "Saved vs budget",   value: 2100,  prefix: "$" },
  ];

  const summaryCategories = [
    { path: "/icons/flight.svg",       label: "Transport", color: C.blue,    amt: "¥82k",  pct: 24 },
    { path: "/icons/food_noodles.svg", label: "Food",      color: C.orange,  amt: "¥120k", pct: 35 },
    { path: "/icons/hotel.svg",        label: "Stay",      color: C.amber,   amt: "¥85k",  pct: 25 },
    { path: "/icons/shopping_bag.svg", label: "Shopping",  color: "#E060A0", amt: "¥35k",  pct: 10 },
    { path: "/icons/party.svg",        label: "Fun",       color: C.success, amt: "¥18k",  pct: 6  },
  ];

  const dur  = 36;
  const idx  = Math.min(Math.floor(frame / dur), stats.length - 1);
  const sf   = frame % dur;
  const stat = stats[idx];

  const displayVal = typeof stat.value === "number"
    ? Math.floor(interpolate(sf, [0, 24], [0, stat.value], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))
    : null;

  const bgOp       = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const showSummary = frame >= 182;

  const statOp    = showSummary
    ? interpolate(frame, [172, 182], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(sf, [0, 10, 28, 36], [0, 1, 1, 0]);
  const statScale = interpolate(sf, [0, 12], [0.8, 1], { extrapolateRight: "clamp" });
  const sumOp     = interpolate(frame, [185, 210], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const barOp     = interpolate(frame, [230, 255], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.purpleDark} 0%, ${C.navyDark} 100%)`, opacity: bgOp }}>
      {/* SFX — a pop at the start of every stat card (36-frame cycle) */}
      {[0, 36, 72, 108, 144].map((startF) => (
        <Sequence key={startF} from={startF} durationInFrames={7}>
          <Audio src={staticFile("/sfx/stat_pop.wav")} volume={0.6} />
        </Sequence>
      ))}
      {/* SFX — fanfare when summary row appears */}
      <Sequence from={182} durationInFrames={54}>
        <Audio src={staticFile("/sfx/wrapped_fanfare.wav")} volume={0.7} />
      </Sequence>

      <AnimBg frame={frame} lottie={bgCurrencies} lottieOpacity={0.28} accent={C.amber} accent2={"#a855f7"} />

      {/* bgFinale overlay fades in with summary */}
      <AbsoluteFill style={{ opacity: showSummary ? interpolate(frame, [182, 210], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0 }}>
        <Lottie animationData={bgFinale} loop style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>

      {/* WRAPPED badge */}
      <div style={{ position: "absolute", top: 80, width: "100%", textAlign: "center" }}>
        <div style={{
          display: "inline-block", border: `2px solid ${C.amber}`,
          borderRadius: 14, padding: "12px 32px",
          ...f(22, 700, C.amber), letterSpacing: 6,
        }}>
          2025 WRAPPED
        </div>
      </div>

      {/* Cycling stat — centre at 45 % */}
      <div style={{
        position: "absolute", top: "45%", left: "50%",
        transform: `translate(-50%, -50%) scale(${statScale})`,
        textAlign: "center", opacity: statOp, width: "85%",
        pointerEvents: "none",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Icon path={stat.icon} size={120} />
        </div>
        <div style={{ ...f(26, 600), color: `${C.white}65`, marginBottom: 14 }}>
          {stat.label}
        </div>
        {displayVal !== null ? (
          <div style={{ ...f(110, 800, C.amber), lineHeight: 1 }}>
            {stat.prefix ?? ""}{displayVal.toLocaleString()}
          </div>
        ) : (
          <div style={{ ...f(90, 800, C.amber), lineHeight: 1 }}>{stat.text ?? ""}</div>
        )}
      </div>

      {/* 3-second category summary row — frames 182–269 */}
      {showSummary && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "0 16px",
          opacity: sumOp,
        }}>
          <div style={{ ...f(26, 700, C.amber), marginBottom: 6, letterSpacing: 3 }}>
            YOUR 2025 BREAKDOWN
          </div>
          <div style={{ ...f(17, 500), color: `${C.white}50`, marginBottom: 36 }}>
            Total · ¥340,000
          </div>

          {/* 5-card row */}
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            {summaryCategories.map(({ path, label, color, amt }, i) => {
              const cOp = interpolate(frame, [188 + i * 10, 208 + i * 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              const cTy = interpolate(frame, [188 + i * 10, 208 + i * 10], [40, 0],  { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={i} style={{
                  flex: 1, backgroundColor: `${color}18`,
                  border: `2px solid ${color}50`, borderRadius: 20,
                  padding: "18px 6px", textAlign: "center",
                  opacity: cOp, transform: `translateY(${cTy}px)`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <Icon path={path} size={44} />
                  <div style={{ ...f(14, 700, color) }}>{amt}</div>
                  <div style={{ ...f(12, 500), color: `${C.white}55` }}>{label}</div>
                </div>
              );
            })}
          </div>

          {/* Stacked proportion bar */}
          <div style={{ marginTop: 28, width: "100%", opacity: barOp }}>
            <div style={{ display: "flex", height: 12, borderRadius: 8, overflow: "hidden" }}>
              {summaryCategories.map(({ color, pct }, i) => (
                <div key={i} style={{ flex: pct, backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Scene 8: CTA ─────────────────────────────────────────────────────────────
const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale   = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 60 } });
  const badgeSpring = spring({ frame: frame - 60, fps, config: { damping: 16, stiffness: 70 } });
  const badgeSlide  = interpolate(badgeSpring, [0, 1], [120, 0]);
  const lineW       = interpolate(frame, [40, 82], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const burstP      = interpolate(frame, [28, 88], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoOp      = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const tagOp       = interpolate(frame, [30, 54], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeOp     = interpolate(frame, [55, 78], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut     = interpolate(frame, [185, 210], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <AnimBg frame={frame} lottie={bgFinale} lottieOpacity={0.3} />

      {/* Particle burst */}
      {[...Array(24)].map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const r  = burstP * 400;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        const pOp = interpolate(burstP, [0, 0.2, 1], [0, 0.9, 0]);
        return (
          <div key={i} style={{
            position: "absolute", top: "40%", left: "50%",
            width: i % 3 === 0 ? 16 : 10, height: i % 3 === 0 ? 16 : 10,
            borderRadius: "50%",
            backgroundColor: i % 3 === 0 ? C.amber : i % 3 === 1 ? C.orange : C.white,
            opacity: pOp,
            transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
          }} />
        );
      })}

      {/* Logo — centre at 40 % */}
      <div style={{
        position: "absolute", top: "40%", left: "50%",
        transform: `translate(-50%, -50%) scale(${logoScale})`,
        textAlign: "center", opacity: logoOp,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>
        <LogoDrawing frame={Math.max(0, frame - 18)} size={150} />
        <div style={{ ...f(100, 800, C.amber), letterSpacing: -3 }}>KeepTrip</div>
        <div style={{
          height: 5, backgroundColor: C.amber, borderRadius: 3,
          width: `${lineW}%`, alignSelf: "stretch",
        }} />
      </div>

      {/* Tagline — ~62 % */}
      <div style={{ position: "absolute", top: "62%", width: "100%", textAlign: "center", opacity: tagOp }}>
        <div style={{ ...f(44, 700) }}>Travel smarter.</div>
        <div style={{ ...f(44, 800, C.amber) }}>Track better.</div>
      </div>

      {/* Google Play badge */}
      <div style={{
        position: "absolute", bottom: 100, left: "50%",
        transform: `translateX(-50%) translateY(${badgeSlide}px)`,
        opacity: badgeOp,
      }}>
        <div style={{
          backgroundColor: C.surface, border: `2px solid ${C.amber}`,
          borderRadius: 28, padding: "22px 52px",
          display: "flex", alignItems: "center", gap: 22,
          boxShadow: `0 12px 48px rgba(219,159,92,0.4)`,
          whiteSpace: "nowrap",
        }}>
          <Icon path="/icons/luggage.svg" size={50} />
          <div>
            <div style={{ ...f(16, 500), color: `${C.white}65` }}>GET IT ON</div>
            <div style={{ ...f(32, 800) }}>Google Play</div>
          </div>
        </div>
      </div>

      {/* Fade to black */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#000", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};

// ─── Composition
// Timing: S1=5s S2=5s S3=7s S4=5s S5=6s S6=4s S7=9s S8=7s → 48 s = 1440 frames
export const KeepTripMG: React.FC = () => (
  <>
    <Sequence durationInFrames={150}><Scene1 /></Sequence>
    <Sequence from={150}  durationInFrames={150}><Scene2 /></Sequence>
    <Sequence from={300}  durationInFrames={210}><Scene3 /></Sequence>
    <Sequence from={510}  durationInFrames={150}><Scene4 /></Sequence>
    <Sequence from={660}  durationInFrames={180}><Scene5 /></Sequence>
    <Sequence from={840}  durationInFrames={120}><Scene6 /></Sequence>
    <Sequence from={960}  durationInFrames={270}><Scene7 /></Sequence>
    <Sequence from={1230} durationInFrames={210}><Scene8 /></Sequence>
  </>
);
