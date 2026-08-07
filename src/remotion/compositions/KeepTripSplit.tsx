/**
 * KeepTripSplit — 6-scene kinetic ad for the group-split feature.
 * Each scene is exactly 7 s (210 frames @ 30 fps) = 1260 frames total.
 *
 * Scene transitions: a colored circle blooms to fill the canvas at the end
 * of every scene (TransOut), then collapses at the start of the next (TransIn).
 *
 * SFX palette: digital-nature theme
 *   water_drop.wav   — element pops / avatar entrances
 *   forest_whoosh.wav — transition swooshes / text slides
 *   compute_tick.wav  — arrow snaps / calculation clicks
 *   zen_bell.wav      — success moments / checkmarks
 *   nature_rise.wav   — finales / brand reveal
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

const C = {
  bg:     "#0D1117",
  teal:   "#00C9B8",
  orange: "#FF6835",
  amber:  "#EA9C2F",
  white:  "#F0F0F0",
  dim:    "#5A6478",
  dark:   "#0D1B2A",
  green:  "#4CAF82",
} as const;

// Every scene is 7 s × 30 fps
const SCENE_DUR = 210;
// Exit-transition starts this many frames before scene end
const TRANS_OFFSET = 190;

// ── Animation helpers ────────────────────────────────────────────────────────

const sp = (
  frame: number,
  config: { damping: number; stiffness: number; mass?: number } = { damping: 20, stiffness: 200 }
) => spring({ frame, fps: 30, config });

const stomp = (frame: number): number => {
  if (frame < 0) return 0;
  const s = sp(frame, { damping: 13, stiffness: 420, mass: 0.6 });
  return interpolate(s, [0, 1], [3, 1]);
};

const maskY = (frame: number, delay = 0): number => {
  const s = sp(frame - delay, { damping: 18, stiffness: 220 });
  return interpolate(s, [0, 1], [110, 0]);
};

const wipe = (frame: number, start: number, dur = 20): number =>
  interpolate(frame, [start, start + dur], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const shake = (frame: number) => ({
  x: Math.sin(frame * 2.4) * 14 * Math.max(0, 1 - frame / 10),
  y: Math.cos(frame * 1.9) *  9 * Math.max(0, 1 - frame / 10),
});

// ── Base text style ──────────────────────────────────────────────────────────

const TX: React.CSSProperties = {
  fontFamily,
  fontWeight: 900,
  textAlign: "center",
  lineHeight: 1.04,
  letterSpacing: -2,
  display: "block",
};

// Shared layout + safe-zone padding applied to every scene's AbsoluteFill
const SCENE: React.CSSProperties = {
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  paddingLeft: 72, paddingRight: 72,
  paddingTop: 96, paddingBottom: 96,
};

// ── Scene transitions ────────────────────────────────────────────────────────

/**
 * A 120×120 circle scaled to 22× (~covers full 1080×1920) that blooms out
 * from the centre at the end of a scene. zIndex 100 sits above all content.
 */
const TransOut: React.FC<{ frame: number; start: number; color: string; dur?: number }> = ({
  frame, start, color, dur = 18,
}) => {
  const s = interpolate(frame, [start, start + dur], [0, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < start) return null;
  return (
    <div style={{
      position: "absolute", width: 120, height: 120,
      borderRadius: "50%", backgroundColor: color,
      left: "50%", top: "50%",
      transform: `translate(-50%,-50%) scale(${s})`,
      zIndex: 100,
    }} />
  );
};

/** Same circle, starts fully expanded and collapses — enters each scene. */
const TransIn: React.FC<{ frame: number; color: string; dur?: number }> = ({
  frame, color, dur = 16,
}) => {
  const s = interpolate(frame, [0, dur], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{
      position: "absolute", width: 120, height: 120,
      borderRadius: "50%", backgroundColor: color,
      left: "50%", top: "50%",
      transform: `translate(-50%,-50%) scale(${s})`,
      zIndex: 100, pointerEvents: "none",
    }} />
  );
};

// ── Logo K ───────────────────────────────────────────────────────────────────

const P1 = "M358.5 68.5H423.5L272 256.5L423.5 445H358.5L192 256.5L358.5 68.5Z";
const P2 = "M183.5 172H244L169 257L244 340.5H183.5L93.5 257L183.5 172Z";
const P1_LEN = 1116;
const P2_LEN = 593;

const LogoK: React.FC<{ frame: number; size?: number }> = ({ frame, size = 180 }) => {
  const p1 = interpolate(frame, [0, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p2 = interpolate(frame, [18, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fillOp   = interpolate(frame, [60, 88], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const strokeOp = interpolate(frame, [80, 105], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sw = Math.max(2, Math.round((size / 512) * 16));
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <g opacity={strokeOp}>
        <path d={P1} stroke={C.amber} strokeWidth={sw}
          strokeDasharray={P1_LEN} strokeDashoffset={P1_LEN * (1 - p1)}
          strokeLinejoin="round" strokeLinecap="round" />
        <path d={P2} stroke={C.amber} strokeWidth={sw}
          strokeDasharray={P2_LEN} strokeDashoffset={P2_LEN * (1 - p2)}
          strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <g opacity={fillOp}>
        <path d={P1} fill={C.amber} />
        <path d={P2} fill={C.amber} />
      </g>
    </svg>
  );
};

// ── Google Play badge ─────────────────────────────────────────────────────────

const PlayBadge: React.FC<{ width?: number; scaleVal?: number; opacity?: number }> = ({
  width = 380, scaleVal = 1, opacity = 1,
}) => (
  <svg width={width} height={width * 0.295} viewBox="0 0 380 112"
    style={{ opacity, transform: `scale(${scaleVal})` }}>
    <rect x="1.5" y="1.5" width="377" height="109" rx="16"
      stroke={C.dim} strokeWidth="2" fill={C.white} fillOpacity={0.06} />
    <path d="M32 30 L32 82 L76 56 Z" fill={C.green} />
    <path d="M32 30 L56 54 L32 56 Z" fill={C.teal}   opacity={0.85} />
    <path d="M32 82 L56 58 L32 56 Z" fill={C.orange} opacity={0.85} />
    <path d="M76 56 L56 54 L56 58 Z" fill={C.amber}  opacity={0.85} />
    <text x="94" y="46" fill={C.white} fontFamily="sans-serif" fontSize="14"
      fontWeight="400" opacity={0.6}>GET IT ON</text>
    <text x="92" y="80" fill={C.white} fontFamily="sans-serif" fontSize="30"
      fontWeight="700">Google Play</text>
  </svg>
);

// ── Avatar circle ─────────────────────────────────────────────────────────────

const Avatar: React.FC<{
  label: string;
  scaleVal?: number;
  opacity?: number;
  color?: string;
  size?: number;
}> = ({ label, scaleVal = 1, opacity = 1, color = C.teal, size = 130 }) => (
  <div style={{
    width: size, height: size,
    borderRadius: "50%",
    border: `4px solid ${color}`,
    backgroundColor: `${color}22`,
    display: "flex", alignItems: "center", justifyContent: "center",
    transform: `scale(${scaleVal})`,
    opacity, flexShrink: 0,
  }}>
    <span style={{ fontFamily, fontWeight: 900, fontSize: size * 0.42, color }}>{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Scene 1 · 0–209f · "A PAID TRANSPORT. B PAID TICKETS. WHO OWES WHO?"
// Transition out → teal bloom
// ─────────────────────────────────────────────────────────────────────────────
const Scene1: React.FC = () => {
  const f = useCurrentFrame();

  const aX  = interpolate(f, [0, 18], [-1100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const aOp = interpolate(f, [0, 14], [0, 1],     { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bX  = interpolate(f, [12, 30], [1100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bOp = interpolate(f, [12, 26], [0, 1],    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const avs = [
    { label: "A", color: C.teal,   d: 30 },
    { label: "B", color: C.orange, d: 42 },
    { label: "C", color: C.amber,  d: 54 },
  ];

  const arrowOp = interpolate(f, [56, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const whoSc = f >= 70 ? stomp(f - 70) : 0;
  const whoOp = interpolate(f, [70, 76], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shk   = f >= 70 && f < 82 ? shake(f - 70) : { x: 0, y: 0 };

  return (
    <AbsoluteFill style={{ ...SCENE, gap: 32, transform: `translate(${shk.x}px,${shk.y}px)` }}>
      {/* SFX — digital-nature */}
      <Sequence from={0} durationInFrames={20}>
        <Audio src={staticFile("/sfx/forest_whoosh.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={12} durationInFrames={20}>
        <Audio src={staticFile("/sfx/forest_whoosh.wav")} volume={0.5} />
      </Sequence>
      {avs.map(({ d }, i) => (
        <Sequence key={i} from={d} durationInFrames={12}>
          <Audio src={staticFile("/sfx/water_drop.wav")} volume={0.75} />
        </Sequence>
      ))}
      <Sequence from={70} durationInFrames={8}>
        <Audio src={staticFile("/sfx/stomp.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={72} durationInFrames={12}>
        <Audio src={staticFile("/sfx/boom.mp3")} volume={0.45} />
      </Sequence>

      {/* A PAID TRANSPORT. */}
      <div style={{ transform: `translateX(${aX}px)`, opacity: aOp }}>
        <span style={{ ...TX, fontSize: 74, color: C.white }}>
          <span style={{ color: C.teal }}>A</span> PAID TRANSPORT.
        </span>
      </div>

      {/* B PAID TICKETS. */}
      <div style={{ transform: `translateX(${bX}px)`, opacity: bOp }}>
        <span style={{ ...TX, fontSize: 74, color: C.white }}>
          <span style={{ color: C.orange }}>B</span> PAID TICKETS.
        </span>
      </div>

      {/* Avatars A B C with tangled arrows */}
      <div style={{ position: "relative", width: 840, height: 210 }}>
        <svg width={840} height={210} viewBox="0 0 840 210"
          style={{ position: "absolute", inset: 0, opacity: arrowOp }}>
          <defs>
            <marker id="s1ah1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill={C.amber} />
            </marker>
            <marker id="s1ah2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill={C.orange} />
            </marker>
          </defs>
          <path d="M155 105 C 265 28,445 176,585 78 C 652 44,705 122,695 105"
            stroke={C.amber} strokeWidth="2.5" fill="none" strokeDasharray="8 4"
            markerEnd="url(#s1ah1)" />
          <path d="M695 105 C 524 152,364 54,205 126 C 178 137,158 117,155 105"
            stroke={C.orange} strokeWidth="2" fill="none" strokeDasharray="6 5"
            markerEnd="url(#s1ah2)" />
          <text x="330" y="58"  fill={C.amber}  fontSize="44" fontFamily="sans-serif"
            fontWeight="900" opacity={0.65} textAnchor="middle">?</text>
          <text x="492" y="162" fill={C.orange} fontSize="36" fontFamily="sans-serif"
            fontWeight="900" opacity={0.55} textAnchor="middle">?</text>
        </svg>
        {avs.map(({ label, color, d }, i) => {
          const sc = f >= d ? stomp(f - d) : 0;
          const op = interpolate(f, [d, d + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={label} style={{ position: "absolute", left: i === 0 ? 60 : i === 1 ? 355 : 650, top: 35 }}>
              <Avatar label={label} scaleVal={sc} opacity={op} color={color} size={140} />
            </div>
          );
        })}
      </div>

      {/* WHO OWES WHO? */}
      <div style={{ transform: `scale(${whoSc})`, opacity: whoOp, transformOrigin: "center" }}>
        <span style={{ ...TX, fontSize: 108, color: C.white }}>
          WHO OWES <span style={{ color: C.orange }}>WHO?</span>
        </span>
      </div>

      <TransOut frame={f} start={TRANS_OFFSET} color={C.teal} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene 2 · 210–419f · "GROUP TRIPS? SPLIT THE BILL ZERO DRAMA."
// Transition in ← teal  |  out → dark bloom
// ─────────────────────────────────────────────────────────────────────────────
const Scene2: React.FC = () => {
  const f = useCurrentFrame();

  const gpW  = wipe(f, 14, 22);
  const gpOp = interpolate(f, [14, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const receiptOp    = interpolate(f, [18, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const receiptSplit = interpolate(f, [28, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const splitSc = f >= 38 ? stomp(f - 38) : 0;
  const splitOp = interpolate(f, [38, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const zeroY  = maskY(f, 64);
  const zeroOp = interpolate(f, [64, 78], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...SCENE, gap: 36 }}>
      {/* SFX */}
      <Sequence from={14} durationInFrames={20}>
        <Audio src={staticFile("/sfx/forest_whoosh.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={38} durationInFrames={30}>
        <Audio src={staticFile("/sfx/zen_bell.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={64} durationInFrames={33}>
        <Audio src={staticFile("/sfx/nature_rise.wav")} volume={0.65} />
      </Sequence>

      <TransIn frame={f} color={C.teal} />

      {/* GROUP TRIPS? */}
      <div style={{ clipPath: `inset(0 ${100 - gpW}% 0 0)`, opacity: gpOp }}>
        <span style={{ ...TX, fontSize: 88, color: C.dim, letterSpacing: 4 }}>GROUP TRIPS?</span>
      </div>

      {/* Receipt splitting illustration */}
      <div style={{ opacity: receiptOp }}>
        <svg width={300} height={190} viewBox="0 0 300 190" fill="none">
          <g transform={`translate(${-receiptSplit * 38},0)`}>
            <rect x="30" y="10" width="110" height="165" rx="10"
              stroke={C.teal} strokeWidth="2.5" fill={`${C.teal}18`} />
            <line x1="48" y1="52" x2="122" y2="52" stroke={C.teal} strokeWidth="2" opacity={0.5} />
            <line x1="48" y1="74" x2="122" y2="74" stroke={C.teal} strokeWidth="2" opacity={0.5} />
            <line x1="48" y1="96" x2="95"  y2="96" stroke={C.teal} strokeWidth="2" opacity={0.5} />
            <text x="85" y="150" fill={C.teal} fontFamily="sans-serif" fontSize="24"
              fontWeight="700" textAnchor="middle">50%</text>
          </g>
          <g transform={`translate(${receiptSplit * 38},0)`}>
            <rect x="160" y="10" width="110" height="165" rx="10"
              stroke={C.amber} strokeWidth="2.5" fill={`${C.amber}18`} />
            <line x1="178" y1="52" x2="252" y2="52" stroke={C.amber} strokeWidth="2" opacity={0.5} />
            <line x1="178" y1="74" x2="252" y2="74" stroke={C.amber} strokeWidth="2" opacity={0.5} />
            <line x1="178" y1="96" x2="225" y2="96" stroke={C.amber} strokeWidth="2" opacity={0.5} />
            <text x="215" y="150" fill={C.amber} fontFamily="sans-serif" fontSize="24"
              fontWeight="700" textAnchor="middle">50%</text>
          </g>
          <line x1="150" y1="10" x2="150" y2="175"
            stroke={C.white} strokeWidth="2" strokeDasharray="6 4"
            opacity={receiptSplit * 0.55} />
        </svg>
      </div>

      {/* SPLIT THE BILL */}
      <div style={{ transform: `scale(${splitSc})`, opacity: splitOp, transformOrigin: "center" }}>
        <span style={{ ...TX, fontSize: 114, color: C.teal }}>SPLIT THE BILL</span>
      </div>

      {/* ZERO DRAMA. */}
      <div style={{ overflow: "hidden", height: 100 }}>
        <div style={{ transform: `translateY(${zeroY}%)`, opacity: zeroOp }}>
          <span style={{ ...TX, fontSize: 88, color: C.white }}>
            ZERO <span style={{ color: C.green }}>DRAMA.</span>
          </span>
        </div>
      </div>

      <TransOut frame={f} start={TRANS_OFFSET} color={C.dark} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene 3 · 420–629f · "TRACK WHO PAID & WHO JOINED A • B • C"
// Transition in ← dark  |  out → teal bloom
// ─────────────────────────────────────────────────────────────────────────────
const Scene3: React.FC = () => {
  const f = useCurrentFrame();

  const trackSp = f >= 12 ? sp(f - 12, { damping: 12, stiffness: 280, mass: 0.85 }) : 0;
  const trackY  = interpolate(trackSp, [0, 1], [-180, 0]);
  const trackOp = interpolate(f, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const avs = [
    { label: "A", color: C.teal,   d: 36, cd: 62 },
    { label: "B", color: C.orange, d: 50, cd: 76 },
    { label: "C", color: C.amber,  d: 64, cd: 90 },
  ];

  const joinY  = maskY(f, 74);
  const joinOp = interpolate(f, [74, 88], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ulW    = wipe(f, 88, 22);

  const dotItems = ["A", "•", "B", "•", "C"];

  return (
    <AbsoluteFill style={{ ...SCENE, gap: 30 }}>
      {/* SFX */}
      <Sequence from={12} durationInFrames={20}>
        <Audio src={staticFile("/sfx/forest_whoosh.wav")} volume={0.5} />
      </Sequence>
      {avs.map(({ d }, i) => (
        <Sequence key={i} from={d} durationInFrames={14}>
          <Audio src={staticFile("/sfx/water_drop.wav")} volume={0.7} />
        </Sequence>
      ))}
      {avs.map(({ cd }, i) => (
        <Sequence key={`ck${i}`} from={cd} durationInFrames={10}>
          <Audio src={staticFile("/sfx/compute_tick.wav")} volume={0.65} />
        </Sequence>
      ))}
      <Sequence from={74} durationInFrames={22}>
        <Audio src={staticFile("/sfx/forest_whoosh.wav")} volume={0.4} />
      </Sequence>
      {dotItems.filter(x => x !== "•").map((_, i) => {
        const dd = 104 + i * 12;
        return (
          <Sequence key={`dot${i}`} from={dd} durationInFrames={10}>
            <Audio src={staticFile("/sfx/water_drop.wav")} volume={0.55} />
          </Sequence>
        );
      })}

      <TransIn frame={f} color={C.dark} />

      {/* TRACK WHO PAID */}
      <div style={{ transform: `translateY(${trackY}px)`, opacity: trackOp }}>
        <span style={{ ...TX, fontSize: 94, color: C.white }}>
          TRACK WHO <span style={{ color: C.teal }}>PAID</span>
        </span>
      </div>

      {/* Avatar row + checkmarks */}
      <div style={{ display: "flex", gap: 52, alignItems: "flex-start" }}>
        {avs.map(({ label, color, d, cd }) => {
          const sc  = f >= d  ? stomp(f - d)  : 0;
          const op  = interpolate(f, [d, d + 6],   [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const csc = f >= cd ? sp(f - cd, { damping: 14, stiffness: 380 }) : 0;
          const cop = interpolate(f, [cd, cd + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <Avatar label={label} scaleVal={sc} opacity={op} color={color} size={148} />
              <div style={{ transform: `scale(${csc})`, opacity: cop }}>
                <svg width={46} height={46} viewBox="0 0 46 46">
                  <circle cx="23" cy="23" r="21" fill={color} />
                  <path d="M13 23 L20 30 L33 15"
                    stroke={C.bg} strokeWidth="3.5"
                    strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* & WHO JOINED + animated underline */}
      <div style={{ position: "relative" }}>
        <div style={{ overflow: "hidden", height: 100 }}>
          <div style={{ transform: `translateY(${joinY}%)`, opacity: joinOp }}>
            <span style={{ ...TX, fontSize: 80, color: C.dim }}>
              &amp; WHO <span style={{ color: C.white }}>JOINED</span>
            </span>
          </div>
        </div>
        <div style={{
          position: "absolute", bottom: 8, left: "50%",
          transform: "translateX(-50%)",
          width: `${ulW}%`, height: 4,
          backgroundColor: C.amber, borderRadius: 2,
        }} />
      </div>

      {/* A • B • C */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {dotItems.map((item, i) => {
          const d  = 104 + i * 12;
          const sc = f >= d ? stomp(f - d) : 0;
          const op = interpolate(f, [d, d + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const col = item === "A" ? C.teal : item === "B" ? C.orange : item === "C" ? C.amber : C.dim;
          return (
            <div key={i} style={{ transform: `scale(${sc})`, opacity: op }}>
              <span style={{ ...TX, fontSize: item === "•" ? 56 : 90, color: col }}>{item}</span>
            </div>
          );
        })}
      </div>

      <TransOut frame={f} start={TRANS_OFFSET} color={C.teal} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene 4 · 630–839f · "AUTO-CALCULATE WHO PAYS WHO INSTANT MATH."
// Transition in ← teal  |  out → orange bloom
// ─────────────────────────────────────────────────────────────────────────────
const Scene4: React.FC = () => {
  const f = useCurrentFrame();

  const autoLS = interpolate(f, [12, 40], [-2, 12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const autoOp = interpolate(f, [12, 24], [0, 1],   { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const wpaW  = wipe(f, 40, 22);
  const wpaOp = interpolate(f, [40, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const arr1Sc = f >= 64 ? stomp(f - 64) : 0;
  const arr1Op = interpolate(f, [64, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const arr2Sc = f >= 80 ? stomp(f - 80) : 0;
  const arr2Op = interpolate(f, [80, 86], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const insSc = f >= 108 ? stomp(f - 108) : 0;
  const insOp = interpolate(f, [108, 114], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...SCENE, gap: 30 }}>
      {/* SFX */}
      <Sequence from={12} durationInFrames={20}>
        <Audio src={staticFile("/sfx/forest_whoosh.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={64} durationInFrames={8}>
        <Audio src={staticFile("/sfx/compute_tick.wav")} volume={0.8} />
      </Sequence>
      <Sequence from={80} durationInFrames={8}>
        <Audio src={staticFile("/sfx/compute_tick.wav")} volume={0.8} />
      </Sequence>
      <Sequence from={108} durationInFrames={29}>
        <Audio src={staticFile("/sfx/zen_bell.wav")} volume={0.75} />
      </Sequence>

      <TransIn frame={f} color={C.teal} />

      {/* AUTO-CALCULATE — letter-spacing expands */}
      <div style={{ opacity: autoOp }}>
        <span style={{ ...TX, fontSize: 92, color: C.white, letterSpacing: autoLS }}>
          AUTO-CALCULATE
        </span>
      </div>

      {/* WHO PAYS WHO */}
      <div style={{ clipPath: `inset(0 ${100 - wpaW}% 0 0)`, opacity: wpaOp }}>
        <span style={{ ...TX, fontSize: 78, color: C.dim }}>WHO PAYS WHO</span>
      </div>

      {/* Settlement arrows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* C → A */}
        <div style={{ transform: `scale(${arr1Sc})`, opacity: arr1Op, transformOrigin: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar label="C" color={C.amber} size={112} />
            <svg width={200} height={52} viewBox="0 0 200 52">
              <path d="M10 26 L162 26 M146 10 L170 26 L146 42"
                stroke={C.teal} strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <text x="100" y="16" fill={C.teal} fontSize="18" fontFamily="sans-serif"
                fontWeight="700" textAnchor="middle">$42.50</text>
            </svg>
            <Avatar label="A" color={C.teal} size={112} />
          </div>
        </div>
        {/* C → B */}
        <div style={{ transform: `scale(${arr2Sc})`, opacity: arr2Op, transformOrigin: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar label="C" color={C.amber} size={112} />
            <svg width={200} height={52} viewBox="0 0 200 52">
              <path d="M10 26 L162 26 M146 10 L170 26 L146 42"
                stroke={C.orange} strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <text x="100" y="16" fill={C.orange} fontSize="18" fontFamily="sans-serif"
                fontWeight="700" textAnchor="middle">$31.00</text>
            </svg>
            <Avatar label="B" color={C.orange} size={112} />
          </div>
        </div>
      </div>

      {/* INSTANT MATH. */}
      <div style={{ transform: `scale(${insSc})`, opacity: insOp, transformOrigin: "center" }}>
        <span style={{ ...TX, fontSize: 108, color: C.amber }}>INSTANT MATH.</span>
      </div>

      <TransOut frame={f} start={TRANS_OFFSET} color={C.orange} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene 5 · 840–1049f · "TAP: MARK AS PAID · REMAINING BALANCE: $0.00"
// Transition in ← orange  |  out → teal bloom
// ─────────────────────────────────────────────────────────────────────────────
const Scene5: React.FC = () => {
  const f = useCurrentFrame();

  const tapSp = f >= 12 ? sp(f - 12, { damping: 16, stiffness: 240 }) : 0;
  const tapOp = interpolate(f, [12, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tapBg = interpolate(f, [28, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const balOp = interpolate(f, [46, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Odometer $128.50 → $0.00
  const prog   = interpolate(f, [54, 148], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const amount = 128.5 * (1 - prog);
  const amtStr = `$${amount.toFixed(2)}`;
  const amtCol = amount < 0.01 ? C.teal : amount < 40 ? C.green : C.white;

  const chkSc = f >= 152 ? stomp(f - 152) : 0;
  const chkOp = interpolate(f, [152, 158], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...SCENE, gap: 36 }}>
      {/* SFX */}
      <Sequence from={12} durationInFrames={14}>
        <Audio src={staticFile("/sfx/water_drop.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={54} durationInFrames={55}>
        <Audio src={staticFile("/sfx/currency_spin.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={148} durationInFrames={30}>
        <Audio src={staticFile("/sfx/zen_bell.wav")} volume={0.9} />
      </Sequence>
      <Sequence from={155} durationInFrames={33}>
        <Audio src={staticFile("/sfx/nature_rise.wav")} volume={0.5} />
      </Sequence>

      <TransIn frame={f} color={C.orange} />

      {/* TAP: MARK AS PAID — button */}
      <div style={{ transform: `scale(${tapSp})`, opacity: tapOp, transformOrigin: "center" }}>
        <div style={{
          border: `3px solid ${C.teal}`,
          borderRadius: 24,
          paddingLeft: 52, paddingRight: 52,
          paddingTop: 22, paddingBottom: 22,
          backgroundColor: `rgba(0,201,184,${tapBg * 0.16})`,
        }}>
          <span style={{ ...TX, fontSize: 70, color: C.teal }}>TAP: MARK AS PAID</span>
        </div>
      </div>

      {/* REMAINING BALANCE: */}
      <div style={{ opacity: balOp }}>
        <span style={{
          fontFamily, fontWeight: 800, fontSize: 50,
          color: C.dim, letterSpacing: 4, display: "block", textAlign: "center",
        }}>REMAINING BALANCE:</span>
      </div>

      {/* Rolling counter */}
      <div style={{ opacity: balOp }}>
        <span style={{ ...TX, fontSize: 152, color: amtCol, letterSpacing: -4 }}>
          {amtStr}
        </span>
      </div>

      {/* Double checkmark ✓✓ */}
      <div style={{ transform: `scale(${chkSc})`, opacity: chkOp, transformOrigin: "center" }}>
        <svg width={196} height={108} viewBox="0 0 196 108">
          <circle cx="54"  cy="54" r="48" fill={C.teal} opacity={0.14} />
          <circle cx="142" cy="54" r="48" fill={C.teal} opacity={0.14} />
          <path d="M22 54 L44 74 L86 30"
            stroke={C.teal} strokeWidth="5.5"
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M110 54 L132 74 L174 30"
            stroke={C.teal} strokeWidth="5.5"
            strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>

      <TransOut frame={f} start={TRANS_OFFSET} color={C.teal} />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Scene 6 · 1050–1259f · "KEEPTRIP · SMART. GROUP. BUDGET. · DOWNLOAD NOW"
// Transition in ← teal  |  (last scene — no exit)
// ─────────────────────────────────────────────────────────────────────────────
const Scene6: React.FC = () => {
  const f = useCurrentFrame();

  const words = [
    { text: "SMART.",  color: C.white,  d: 16 },
    { text: "GROUP.",  color: C.teal,   d: 34 },
    { text: "BUDGET.", color: C.amber,  d: 52 },
  ];

  const logoSp = f >= 66 ? sp(f - 66, { damping: 16, stiffness: 220 }) : 0;
  const logoOp = interpolate(f, [66, 78], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ktSc   = f >= 76 ? stomp(f - 76) : 0;
  const ktOp   = interpolate(f, [76, 82], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const badgeSp = f >= 90 ? sp(f - 90, { damping: 10, stiffness: 260, mass: 0.7 }) : 0;
  const badgeOp = interpolate(f, [90, 102], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const dlW  = wipe(f, 104, 22);
  const dlOp = interpolate(f, [104, 112], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...SCENE, gap: 28 }}>
      {/* SFX */}
      {words.map(({ d }, i) => (
        <Sequence key={i} from={d} durationInFrames={10}>
          <Audio src={staticFile("/sfx/water_drop.wav")} volume={0.65} />
        </Sequence>
      ))}
      <Sequence from={66} durationInFrames={66}>
        <Audio src={staticFile("/sfx/logo_draw.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={76} durationInFrames={8}>
        <Audio src={staticFile("/sfx/compute_tick.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={90} durationInFrames={44}>
        <Audio src={staticFile("/sfx/nature_rise.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={104} durationInFrames={20}>
        <Audio src={staticFile("/sfx/forest_whoosh.wav")} volume={0.4} />
      </Sequence>

      <TransIn frame={f} color={C.teal} />

      {/* SMART. GROUP. BUDGET. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {words.map(({ text, color, d }) => {
          const sc = f >= d ? stomp(f - d) : 0;
          const op = interpolate(f, [d, d + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={text} style={{ transform: `scale(${sc})`, opacity: op, transformOrigin: "center" }}>
              <span style={{ ...TX, fontSize: 126, color }}>{text}</span>
            </div>
          );
        })}
      </div>

      {/* Logo K + KEEPTRIP lockup */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10 }}>
        <div style={{ transform: `scale(${logoSp})`, opacity: logoOp }}>
          <LogoK frame={Math.max(0, f - 66)} size={155} />
        </div>
        <div style={{ transform: `scale(${ktSc})`, opacity: ktOp, transformOrigin: "left center" }}>
          <span style={{ ...TX, fontSize: 106, color: C.amber, letterSpacing: 4 }}>KEEPTRIP</span>
        </div>
      </div>

      {/* Google Play badge — overshoot spring */}
      <div style={{ transform: `scale(${badgeSp})`, opacity: badgeOp }}>
        <PlayBadge width={380} />
      </div>

      {/* DOWNLOAD NOW */}
      <div style={{ clipPath: `inset(0 ${100 - dlW}% 0 0)`, opacity: dlOp }}>
        <span style={{
          fontFamily, fontWeight: 800, fontSize: 56,
          color: C.teal, letterSpacing: 8, display: "block", textAlign: "center",
        }}>DOWNLOAD NOW</span>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root export · 1260 frames / 42 s (6 scenes × 7 s)
// ─────────────────────────────────────────────────────────────────────────────
export const KeepTripSplit: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <OffthreadVideo
      src={staticFile("/videos/background.webm")}
      volume={0}
      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.12 }}
    />
    <Sequence from={0 * SCENE_DUR} durationInFrames={SCENE_DUR}><Scene1 /></Sequence>
    <Sequence from={1 * SCENE_DUR} durationInFrames={SCENE_DUR}><Scene2 /></Sequence>
    <Sequence from={2 * SCENE_DUR} durationInFrames={SCENE_DUR}><Scene3 /></Sequence>
    <Sequence from={3 * SCENE_DUR} durationInFrames={SCENE_DUR}><Scene4 /></Sequence>
    <Sequence from={4 * SCENE_DUR} durationInFrames={SCENE_DUR}><Scene5 /></Sequence>
    <Sequence from={5 * SCENE_DUR} durationInFrames={SCENE_DUR}><Scene6 /></Sequence>
  </AbsoluteFill>
);
