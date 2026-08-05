import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
});

// ── Palette (light bg + video, dark text, teal + sunset orange accents) ───────
const C = {
  bg: "#f3f3f3",
  white: "#1C1C2E", // primary DARK text (name kept to minimise churn)
  teal: "#12A594",
  orange: "#FF5C39",
  green: "#2FA96A",
  red: "#EF4444",
  dim: "#5A5A78",
} as const;

const ec = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Content is rendered inside this scale so every edge keeps a safe padding
// (~4% margin all round). The background video stays full-bleed behind it.
const CONTENT_SCALE = 0.92;

// ── Animation helpers ─────────────────────────────────────────────────────────
const sp = (
  frame: number,
  config: { damping: number; stiffness: number; mass?: number } = { damping: 20, stiffness: 200 }
) => spring({ frame, fps: 30, config });

/** heavy scale-slam: overshoots from 3 → 1 on a beat */
const stomp = (frame: number): number => {
  if (frame < 0) return 0;
  return interpolate(sp(frame, { damping: 13, stiffness: 420, mass: 0.6 }), [0, 1], [3, 1]);
};

/** masked slide-up reveal (percentage translateY 110 → 0) */
const maskY = (frame: number, delay = 0): number =>
  interpolate(sp(frame - delay, { damping: 18, stiffness: 220 }), [0, 1], [110, 0]);

/** left → right wipe 0 → 100 */
const wipe = (frame: number, start: number, dur = 20): number =>
  interpolate(frame, [start, start + dur], [0, 100], ec);

const shake = (frame: number, amp = 11): { x: number; y: number } => {
  const decay = Math.max(0, 1 - frame / 10);
  return { x: Math.sin(frame * 2.4) * amp * decay, y: Math.cos(frame * 1.9) * amp * 0.6 * decay };
};

// ── Base text style ───────────────────────────────────────────────────────────
const T: React.CSSProperties = {
  fontFamily,
  fontWeight: 900,
  textAlign: "center",
  lineHeight: 1.02,
  letterSpacing: -2,
  display: "block",
};

// ── OpenStreetMap raster-tile map ─────────────────────────────────────────────
const TILE = 256;
const lon2tile = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
const lat2tile = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};

const OSMMap: React.FC<{
  lat: number;
  lon: number;
  zoom: number;
  width: number;
  height: number;
  scale?: number;
}> = ({ lat, lon, zoom, width, height, scale = 1 }) => {
  const cx = lon2tile(lon, zoom);
  const cy = lat2tile(lat, zoom);
  const cols = Math.ceil(width / TILE) + 2;
  const rows = Math.ceil(height / TILE) + 2;
  const startX = Math.floor(cx - cols / 2);
  const startY = Math.floor(cy - rows / 2);
  const n = 2 ** zoom;

  const tiles: React.ReactNode[] = [];
  for (let ix = 0; ix < cols; ix++) {
    for (let iy = 0; iy < rows; iy++) {
      const tx = startX + ix;
      const ty = startY + iy;
      if (ty < 0 || ty >= n) continue;
      const wrappedX = ((tx % n) + n) % n;
      const px = width / 2 + (tx - cx) * TILE;
      const py = height / 2 + (ty - cy) * TILE;
      tiles.push(
        <Img
          key={`${tx}_${ty}`}
          src={`https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`}
          style={{ position: "absolute", left: px, top: py, width: TILE, height: TILE }}
        />
      );
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          filter: "saturate(1) brightness(1) contrast(1.02)",
        }}
      >
        {tiles}
      </div>
      {/* Soft vignette for depth (light theme) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(28,28,46,0) 58%, rgba(28,28,46,0.16) 100%)",
        }}
      />
    </div>
  );
};

// ── Icons (thin-weight line art) ──────────────────────────────────────────────
const CompassSvg: React.FC<{ size?: number; rot?: number }> = ({ size = 200, rot = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="52" stroke={C.teal} strokeWidth="3" />
    <circle cx="60" cy="60" r="42" stroke={C.dim} strokeWidth="1.5" opacity={0.5} />
    <g transform={`rotate(${rot} 60 60)`}>
      <path d="M60 22 L72 60 L60 52 L48 60 Z" fill={C.orange} />
      <path d="M60 98 L48 60 L60 68 L72 60 Z" fill={C.white} opacity={0.85} />
      <circle cx="60" cy="60" r="5" fill={C.teal} />
    </g>
  </svg>
);

const PinSvg: React.FC<{ size?: number }> = ({ size = 130 }) => (
  <svg width={size} height={size} viewBox="0 0 80 110" fill="none">
    <path
      d="M40 6 C21 6 8 20 8 39 C8 63 40 100 40 100 C40 100 72 63 72 39 C72 20 59 6 40 6 Z"
      stroke={C.orange}
      strokeWidth="4"
      fill="rgba(255,122,61,0.12)"
    />
    <circle cx="40" cy="38" r="13" stroke={C.teal} strokeWidth="4" fill="none" />
  </svg>
);

const PlusSvg: React.FC<{ size?: number }> = ({ size = 170 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="52" stroke={C.teal} strokeWidth="3" />
    <line x1="60" y1="34" x2="60" y2="86" stroke={C.white} strokeWidth="7" strokeLinecap="round" />
    <line x1="34" y1="60" x2="86" y2="60" stroke={C.white} strokeWidth="7" strokeLinecap="round" />
  </svg>
);

const CheckSvg: React.FC<{ size?: number; p?: number }> = ({ size = 170, p = 1 }) => {
  const LEN = 90;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="52" stroke={C.green} strokeWidth="3" />
      <path
        d="M36 62 L54 80 L86 42"
        stroke={C.green}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={LEN}
        strokeDashoffset={LEN * (1 - p)}
      />
    </svg>
  );
};

const BellSvg: React.FC<{ size?: number; swing?: number }> = ({ size = 150, swing = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <g transform={`rotate(${swing} 50 20)`}>
      <path
        d="M50 16 C34 16 28 28 28 44 C28 62 20 68 20 68 L80 68 C80 68 72 62 72 44 C72 28 66 16 50 16 Z"
        stroke={C.orange}
        strokeWidth="4"
        strokeLinejoin="round"
        fill="rgba(255,122,61,0.1)"
      />
      <path d="M42 76 C42 82 58 82 58 76" stroke={C.orange} strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="12" r="4" fill={C.orange} />
    </g>
  </svg>
);

const GlassesSvg: React.FC<{ size?: number }> = ({ size = 220 }) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 200 100" fill="none">
    <rect x="12" y="34" width="72" height="46" rx="20" stroke={C.teal} strokeWidth="4" fill="rgba(45,225,194,0.1)" />
    <rect x="116" y="34" width="72" height="46" rx="20" stroke={C.teal} strokeWidth="4" fill="rgba(45,225,194,0.1)" />
    <path d="M84 46 Q100 38 116 46" stroke={C.teal} strokeWidth="4" strokeLinecap="round" />
    <path d="M12 44 L2 30" stroke={C.dim} strokeWidth="4" strokeLinecap="round" />
    <path d="M188 44 L198 30" stroke={C.dim} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// ── KEEPTRIP logo mark (K) ────────────────────────────────────────────────────
const P1 = "M358.5 68.5H423.5L272 256.5L423.5 445H358.5L192 256.5L358.5 68.5Z";
const P2 = "M183.5 172H244L169 257L244 340.5H183.5L93.5 257L183.5 172Z";
const LogoK: React.FC<{ size?: number }> = ({ size = 150 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
    <path d={P1} fill={C.teal} />
    <path d={P2} fill={C.teal} />
  </svg>
);

// ── Google Play badge (vector outline) ────────────────────────────────────────
const PlayBadge: React.FC<{ width?: number; opacity?: number; yOff?: number }> = ({
  width = 400,
  opacity = 1,
  yOff = 0,
}) => (
  <svg
    width={width}
    height={width * 0.295}
    viewBox="0 0 380 112"
    style={{ opacity, transform: `translateY(${yOff}px)` }}
  >
    <rect x="1.5" y="1.5" width="377" height="109" rx="18" stroke={C.dim} strokeWidth="2" fill="rgba(255,255,255,0.04)" />
    <path d="M32 30 L32 82 L76 56 Z" fill={C.green} />
    <path d="M32 30 L56 54 L32 56 Z" fill={C.teal} opacity={0.9} />
    <path d="M32 82 L56 58 L32 56 Z" fill={C.orange} opacity={0.9} />
    <path d="M76 56 L56 54 L56 58 Z" fill="#F5C84B" opacity={0.9} />
    <text x="94" y="46" fill={C.dim} fontFamily="sans-serif" fontSize="14" fontWeight="400">GET IT ON</text>
    <text x="92" y="80" fill={C.white} fontFamily="sans-serif" fontSize="30" fontWeight="700">Google Play</text>
  </svg>
);

// ── One-shot SFX cue ──────────────────────────────────────────────────────────
// Fires at `at` and plays the clip's full natural length (no artificial cap);
// it is only ever trimmed by the enclosing scene's own boundary.
const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.7 }) => (
  <Sequence from={at} layout="none">
    <Audio src={staticFile(`/sfx/${src}`)} volume={vol} />
  </Sequence>
);

// ── Persistent top-left step counter ──────────────────────────────────────────
const StepBadge: React.FC<{ n: number }> = ({ n }) => {
  const f = useCurrentFrame();
  const s = f >= 2 ? sp(f - 2, { damping: 12, stiffness: 300 }) : 0;
  const op = interpolate(f, [2, 9], [0, 1], ec);
  return (
    <>
      <Sfx at={2} src="lofi_tick.wav" vol={0.5} />
      <div
        style={{
          position: "absolute",
          top: 78,
          left: 80,
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        transform: `scale(${s})`,
        opacity: op,
        transformOrigin: "left center",
      }}
    >
        <span style={{ ...T, fontSize: 40, color: C.teal, letterSpacing: 4 }}>STEP {n}</span>
        <span style={{ ...T, fontSize: 34, color: C.dim, letterSpacing: 4 }}>/ 4</span>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scene 0 — Intro: "PLAN IT. TRACK IT." / "SMART BUDGETING IN 4 STEPS"
// ═══════════════════════════════════════════════════════════════════════════════
const Scene0: React.FC = () => {
  const f = useCurrentFrame();

  const rot = interpolate(f, [4, 42], [0, 360], ec);
  const compOp = interpolate(f, [4, 14, 44, 54], [0, 1, 1, 0], ec);
  const pinScale = f >= 46 ? sp(f - 46, { damping: 11, stiffness: 260 }) : 0;
  const pinOp = interpolate(f, [46, 56], [0, 1], ec);

  const planScale = f >= 60 ? stomp(f - 60) : 0;
  const planOp = interpolate(f, [60, 66], [0, 1], ec);
  const trackScale = f >= 78 ? stomp(f - 78) : 0;
  const trackOp = interpolate(f, [78, 84], [0, 1], ec);

  const subY = maskY(f, 100);
  const subOp = interpolate(f, [100, 116], [0, 1], ec);
  const fadeOut = interpolate(f, [138, 150], [1, 0], ec);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        opacity: fadeOut,
      }}
    >
      <Sfx at={4} src="lofi_whoosh.wav" vol={0.5} />
      <Sfx at={60} src="lofi_thump.wav" vol={0.85} />
      <Sfx at={78} src="lofi_thump.wav" vol={0.85} />
      <Sfx at={100} src="lofi_swipe.wav" vol={0.5} />

      {/* Compass → pin morph */}
      <div style={{ position: "relative", width: 220, height: 220, marginBottom: 20 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: compOp }}>
          <CompassSvg size={200} rot={rot} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pinScale})`, opacity: pinOp }}>
          <PinSvg size={150} />
        </div>
      </div>

      {/* PLAN IT. TRACK IT. */}
      <div style={{ display: "flex", gap: 34, alignItems: "center", height: 130 }}>
        <div style={{ transform: `scale(${planScale})`, opacity: planOp, transformOrigin: "center" }}>
          <span style={{ ...T, fontSize: 100, color: C.white }}>PLAN IT.</span>
        </div>
        <div style={{ transform: `scale(${trackScale})`, opacity: trackOp, transformOrigin: "center" }}>
          <span style={{ ...T, fontSize: 100, color: C.teal }}>TRACK IT.</span>
        </div>
      </div>

      {/* SMART BUDGETING IN 4 STEPS */}
      <div style={{ overflow: "hidden", height: 80 }}>
        <div style={{ transform: `translateY(${subY}%)`, opacity: subOp }}>
          <span style={{ fontFamily, fontWeight: 800, fontSize: 52, color: C.dim, letterSpacing: 8 }}>
            SMART BUDGETING IN <span style={{ color: C.orange }}>4 STEPS</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scene 1 — STEP 1: CREATE TRIP (OSM map flies + zooms Bali → Japan → Tokyo)
// ═══════════════════════════════════════════════════════════════════════════════
const DESTS = [
  { name: "BALI", lat: -8.45, lon: 115.15, zoom: 9 },
  { name: "JAPAN", lat: 36.5, lon: 138.3, zoom: 5 },
  { name: "MADAGASCAR", lat: -19, lon: 46.8, zoom: 6 },
] as const;
const SEG = 90; // 3 s per destination @ 30 fps

const Scene1: React.FC = () => {
  const f = useCurrentFrame();

  const mapOp = interpolate(f, [0, 20], [0, 1], ec);

  // Filmstrip slides horizontally between destinations; each panel zooms in.
  // Slide is eased so it accelerates out and settles into place.
  const slidePos = interpolate(
    f,
    [SEG - 11, SEG + 11, 2 * SEG - 11, 2 * SEG + 11],
    [0, 1, 1, 2],
    { ...ec, easing: Easing.inOut(Easing.cubic) }
  );
  const segZoom = (i: number) => interpolate(f, [i * SEG, i * SEG + SEG], [1.06, 1.16], ec);

  // Pin re-drops onto every new destination once it has slid into place
  const dropAt = f >= 2 * SEG + 12 ? 2 * SEG + 12 : f >= SEG + 12 ? SEG + 12 : 22;
  const pinDrop = f >= dropAt ? sp(f - dropAt, { damping: 12, stiffness: 220 }) : 0;
  const pinY = interpolate(pinDrop, [0, 1], [-460, 0]);
  const pinOp = interpolate(f, [22, 34], [0, 1], ec);
  const ring = ((f - dropAt) % 40) / 40;
  const ringOn = f >= dropAt;

  // CREATE TRIP expands early, then stays
  const createScale = f >= 40 ? stomp(f - 40) : 0;
  const createOp = interpolate(f, [40, 46], [0, 1], ec);

  // Departures board — highlight tracks the active destination
  const active = Math.min(DESTS.length - 1, Math.floor(f / SEG));
  const boardY = maskY(f, 58);
  const boardOp = interpolate(f, [58, 72], [0, 1], ec);
  const fadeOut = interpolate(f, [258, 270], [1, 0], ec);

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* SFX — title stomp, board flip, pin-drop pops; each location change gets a
          swoosh transition over a soft wind bed */}
      <Sfx at={22} src="lofi_pop.wav" vol={0.85} />
      <Sfx at={40} src="lofi_thump.wav" vol={0.9} />
      <Sfx at={58} src="lofi_flip.wav" vol={0.6} />
      <Sfx at={SEG - 8} src="lofi_wind.wav" vol={0.45} />
      <Sfx at={SEG - 8} src="lofi_swoosh.wav" vol={0.6} />
      <Sfx at={SEG + 4} src="lofi_pop.wav" vol={0.8} />
      <Sfx at={2 * SEG - 8} src="lofi_wind.wav" vol={0.45} />
      <Sfx at={2 * SEG - 8} src="lofi_swoosh.wav" vol={0.6} />
      <Sfx at={2 * SEG + 4} src="lofi_pop.wav" vol={0.8} />

      {/* Map card */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 90,
          width: 900,
          height: 760,
          borderRadius: 40,
          overflow: "hidden",
          border: `3px solid ${C.teal}`,
          boxShadow: "0 0 60px rgba(45,225,194,0.25)",
          opacity: mapOp,
        }}
      >
        {/* Sliding filmstrip — each destination slides in from the right */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            display: "flex",
            transform: `translateX(${-slidePos * 900}px)`,
          }}
        >
          {DESTS.map((d, i) => (
            <div key={d.name} style={{ position: "relative", width: 900, height: "100%", flexShrink: 0 }}>
              <OSMMap lat={d.lat} lon={d.lon} zoom={d.zoom} width={900} height={760} scale={segZoom(i)} />
            </div>
          ))}
        </div>

        {/* destination label chip */}
        <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", opacity: boardOp }}>
          <div style={{ padding: "8px 24px", borderRadius: 999, background: "rgba(28,28,46,0.72)", border: `2px solid ${C.teal}` }}>
            <span style={{ fontFamily, fontWeight: 800, fontSize: 34, color: "#fff", letterSpacing: 3 }}>{DESTS[active].name}</span>
          </div>
        </div>

        {/* corner brackets */}
        {[
          { t: 22, l: 22, r: 90 },
          { t: 22, r2: 22, r: 0 },
          { b: 22, l: 22, r: 180 },
          { b: 22, r2: 22, r: 270 },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: c.t,
              bottom: c.b,
              left: c.l,
              right: c.r2,
              width: 34,
              height: 34,
              borderTop: `3px solid ${C.orange}`,
              borderLeft: `3px solid ${C.orange}`,
              transform: `rotate(${c.r}deg)`,
              transformOrigin: "center",
              opacity: 0.9,
            }}
          />
        ))}

        {/* pulsing ring + pin at map center */}
        <div style={{ position: "absolute", top: 380, left: 450, transform: "translate(-50%,-50%)" }}>
          {ringOn && (
            <div
              style={{
                position: "absolute",
                top: 24,
                left: "50%",
                transform: `translate(-50%,-50%) scale(${1 + ring * 2.4})`,
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: `3px solid ${C.orange}`,
                opacity: (1 - ring) * 0.7,
              }}
            />
          )}
          <div style={{ transform: `translateY(${pinY}px)`, opacity: pinOp }}>
            <PinSvg size={120} />
          </div>
        </div>
      </div>

      <StepBadge n={1} />

      {/* CREATE TRIP */}
      <div
        style={{
          position: "absolute",
          top: 1160,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ transform: `scale(${createScale})`, opacity: createOp, transformOrigin: "center" }}>
          <span style={{ ...T, fontSize: 130, color: C.white }}>
            CREATE <span style={{ color: C.orange }}>TRIP</span>
          </span>
        </div>
      </div>

      {/* Departures board */}
      <div
        style={{
          position: "absolute",
          top: 1420,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ transform: `translateY(${boardY}%)`, opacity: boardOp, display: "flex", gap: 26, alignItems: "center" }}>
          {DESTS.map((d, i) => (
            <React.Fragment key={d.name}>
              {i > 0 && <span style={{ ...T, fontSize: 42, color: C.dim }}>•</span>}
              <span
                style={{
                  ...T,
                  fontSize: 50,
                  letterSpacing: 2,
                  color: active === i ? C.teal : C.dim,
                  transform: active === i ? "scale(1.1)" : "scale(1)",
                  opacity: active === i ? 1 : 0.45,
                }}
              >
                {d.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scene 2 — STEP 2: SET YOUR BUDGET (slider locks at $) / YOU MAKE THE RULES.
// ═══════════════════════════════════════════════════════════════════════════════
const Scene2: React.FC = () => {
  const f = useCurrentFrame();

  const trackW = 760;
  const knobP = f >= 14 ? sp(f - 14, { damping: 16, stiffness: 130 }) : 0;
  const knobX = interpolate(knobP, [0, 1], [0, trackW]);
  const barOp = interpolate(f, [8, 20], [0, 1], ec);
  const locked = f >= 58;
  const dollarPop = locked ? stomp(f - 58) : 0;

  const setScale = f >= 62 ? stomp(f - 62) : 0;
  const setOp = interpolate(f, [62, 68], [0, 1], ec);

  const ruleW = wipe(f, 92, 24);
  const ruleOp = interpolate(f, [92, 100], [0, 1], ec);
  const fadeOut = interpolate(f, [138, 150], [1, 0], ec);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
        opacity: fadeOut,
      }}
    >
      <StepBadge n={2} />
      <Sfx at={14} src="lofi_sweep.wav" vol={0.45} />
      <Sfx at={58} src="lofi_click.wav" vol={0.7} />
      <Sfx at={62} src="lofi_thump.wav" vol={0.85} />
      <Sfx at={92} src="lofi_swipe.wav" vol={0.5} />

      {/* Slider */}
      <div style={{ position: "relative", width: trackW, height: 120, opacity: barOp, marginBottom: 20 }}>
        <div style={{ position: "absolute", top: 56, left: 0, width: trackW, height: 8, borderRadius: 4, background: C.dim, opacity: 0.35 }} />
        <div style={{ position: "absolute", top: 56, left: 0, width: knobX, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${C.teal}, ${C.orange})` }} />
        <div
          style={{
            position: "absolute",
            top: 60,
            left: knobX,
            transform: "translate(-50%,-50%)",
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: C.bg,
            border: `4px solid ${C.teal}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(45,225,194,0.5)",
          }}
        >
          <div style={{ transform: `scale(${locked ? dollarPop : 0.6})` }}>
            <span style={{ fontFamily, fontWeight: 900, fontSize: 40, color: C.orange }}>$</span>
          </div>
        </div>
      </div>

      {/* SET YOUR BUDGET */}
      <div style={{ transform: `scale(${setScale})`, opacity: setOp, transformOrigin: "center", height: 260, display: "flex", alignItems: "center" }}>
        <span style={{ ...T, fontSize: 116, color: C.white }}>
          SET YOUR<br />
          <span style={{ color: C.teal }}>BUDGET</span>
        </span>
      </div>

      {/* YOU MAKE THE RULES. */}
      <div style={{ clipPath: `inset(0 ${100 - ruleW}% 0 0)`, opacity: ruleOp }}>
        <span style={{ fontFamily, fontWeight: 800, fontSize: 54, color: C.orange, letterSpacing: 4 }}>
          YOU MAKE THE RULES.
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scene 3 — STEP 3: LOG EXPENSES / 3 SECONDS. DONE. (plus → check, screen shake)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene3: React.FC = () => {
  const f = useCurrentFrame();

  const plusRot = interpolate(f, [6, 44], [0, 180], ec);
  const plusOp = interpolate(f, [4, 12, 46, 54], [0, 1, 1, 0], ec);
  const checkOp = interpolate(f, [48, 56], [0, 1], ec);
  const checkP = interpolate(f, [50, 66], [0, 1], ec);

  const logX = interpolate(f, [10, 26], [900, 0], ec);
  const logOp = interpolate(f, [10, 22], [0, 1], ec);

  const secScale = f >= 74 ? stomp(f - 74) : 0;
  const secOp = interpolate(f, [74, 79, 92, 98], [0, 1, 1, 0], ec);

  const doneScale = f >= 100 ? stomp(f - 100) : 0;
  const doneOp = interpolate(f, [100, 106], [0, 1], ec);
  const shk = f >= 100 && f < 114 ? shake(f - 100, 16) : { x: 0, y: 0 };
  const fadeOut = interpolate(f, [138, 150], [1, 0], ec);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 46,
        opacity: fadeOut,
        transform: `translate(${shk.x}px, ${shk.y}px)`,
      }}
    >
      <StepBadge n={3} />
      <Sfx at={10} src="lofi_swipe.wav" vol={0.5} />
      <Sfx at={48} src="lofi_check.wav" vol={0.8} />
      <Sfx at={74} src="lofi_tap.wav" vol={0.6} />
      <Sfx at={100} src="lofi_boom.wav" vol={0.85} />

      {/* Plus → check */}
      <div style={{ position: "relative", width: 190, height: 190, marginBottom: 14 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${plusRot}deg)`, opacity: plusOp }}>
          <PlusSvg size={170} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: checkOp }}>
          <CheckSvg size={170} p={checkP} />
        </div>
      </div>

      {/* LOG EXPENSES slides in from right */}
      <div style={{ transform: `translateX(${logX}px)`, opacity: logOp }}>
        <span style={{ ...T, fontSize: 122, color: C.white }}>
          LOG <span style={{ color: C.teal }}>EXPENSES</span>
        </span>
      </div>

      {/* 3 SECONDS. → DONE. */}
      <div style={{ position: "relative", height: 160, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div style={{ position: "absolute", transform: `scale(${secScale})`, opacity: secOp }}>
          <span style={{ ...T, fontSize: 96, color: C.dim }}>3 SECONDS.</span>
        </div>
        <div style={{ position: "absolute", transform: `scale(${doneScale})`, opacity: doneOp, transformOrigin: "center" }}>
          <span style={{ ...T, fontSize: 150, color: C.orange }}>DONE.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scene 4 — STEP 4: ALMOST OVERSPENT? / GET INSTANT ALERTS. (8s)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene4: React.FC = () => {
  const f = useCurrentFrame();

  // Progress bar green → orange, fills toward the limit
  const barProg = interpolate(f, [24, 96], [0.1, 0.94], ec);
  const barOp = interpolate(f, [16, 30], [0, 1], ec);
  const barFill = interpolateColors(barProg, [0.1, 0.94], [C.green, C.orange]);

  const bellSwing = f >= 48 ? Math.sin((f - 48) * 0.7) * Math.max(0, 14 - (f - 48) * 0.25) : 0;
  const bellOp = interpolate(f, [40, 52], [0, 1], ec);

  // ALMOST OVERSPENT? — vibrates + white→orange color shift (push-notification feel)
  const alertOp = interpolate(f, [58, 68], [0, 1], ec);
  const vib = f >= 58 && f < 150 ? Math.sin(f * 1.6) * interpolate(f, [58, 120], [10, 2], ec) : 0;
  const alertColor = interpolateColors(Math.sin(f * 0.5) * 0.5 + 0.5, [0, 1], [C.white, C.orange]);

  // Push-notification card slides in
  const cardP = f >= 96 ? sp(f - 96, { damping: 15, stiffness: 160 }) : 0;
  const cardY = interpolate(cardP, [0, 1], [-260, 0]);
  const cardOp = interpolate(f, [96, 106], [0, 1], ec);

  // GET INSTANT ALERTS. drops down to stabilise
  const getP = f >= 150 ? sp(f - 150, { damping: 18, stiffness: 200 }) : 0;
  const getY = interpolate(getP, [0, 1], [-160, 0]);
  const getOp = interpolate(f, [150, 162], [0, 1], ec);
  const fadeOut = interpolate(f, [226, 240], [1, 0], ec);

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <StepBadge n={4} />
      <Sfx at={24} src="lofi_riser.wav" vol={0.5} />
      <Sfx at={40} src="lofi_alert.wav" vol={0.7} />
      <Sfx at={96} src="lofi_pop.wav" vol={0.9} />
      <Sfx at={150} src="lofi_chime.wav" vol={0.6} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 50,
        }}
      >
        {/* Bell */}
        <div style={{ opacity: bellOp }}>
          <BellSvg size={150} swing={bellSwing} />
        </div>

        {/* Progress bar green → orange */}
        <div style={{ opacity: barOp }}>
          <svg width={820} height={22} viewBox="0 0 820 22">
            <rect x="0" y="7" width="820" height="8" rx="4" fill={C.dim} opacity={0.3} />
            <rect
              x="0"
              y="7"
              width={820 * barProg}
              height="8"
              rx="4"
              fill={barFill}
            />
            <line x1="780" y1="2" x2="780" y2="20" stroke={C.red} strokeWidth="3" strokeDasharray="3 3" />
          </svg>
        </div>

        {/* ALMOST OVERSPENT? */}
        <div style={{ transform: `translateX(${vib}px)`, opacity: alertOp }}>
          <span style={{ ...T, fontSize: 104, color: alertColor }}>ALMOST OVERSPENT?</span>
        </div>

        {/* Push-notification card */}
        <div style={{ transform: `translateY(${cardY}px)`, opacity: cardOp }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "26px 40px",
              borderRadius: 26,
              background: "rgba(255,122,61,0.12)",
              border: `2px solid ${C.orange}`,
              maxWidth: 820,
            }}
          >
            <BellSvg size={64} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left" }}>
              <span style={{ fontFamily, fontWeight: 900, fontSize: 40, color: C.orange, letterSpacing: 1 }}>BUDGET ALERT</span>
              <span style={{ fontFamily, fontWeight: 700, fontSize: 32, color: C.white, letterSpacing: 0.5 }}>
                You've used 94% of your budget
              </span>
            </div>
          </div>
        </div>

        {/* GET INSTANT ALERTS. */}
        <div style={{ transform: `translateY(${getY}px)`, opacity: getOp }}>
          <span style={{ ...T, fontSize: 92, color: C.teal }}>GET INSTANT ALERTS.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scene 5 — STAY IN CONTROL. / ENJOY THE TRIP. (calm resolve)
// ═══════════════════════════════════════════════════════════════════════════════
const Scene5: React.FC = () => {
  const f = useCurrentFrame();

  const glassP = f >= 8 ? sp(f - 8, { damping: 16, stiffness: 150 }) : 0;
  const glassOp = interpolate(f, [8, 24], [0, 1], ec);

  const stayP = f >= 34 ? sp(f - 34, { damping: 20, stiffness: 130 }) : 0;
  const stayY = interpolate(stayP, [0, 1], [70, 0]);
  const stayOp = interpolate(f, [34, 52], [0, 1], ec);

  const enjoyP = f >= 60 ? sp(f - 60, { damping: 20, stiffness: 130 }) : 0;
  const enjoyY = interpolate(enjoyP, [0, 1], [70, 0]);
  const enjoyOp = interpolate(f, [60, 78], [0, 1], ec);
  const fadeOut = interpolate(f, [136, 150], [1, 0], ec);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 44,
        opacity: fadeOut,
      }}
    >
      <Sfx at={34} src="lofi_chime.wav" vol={0.5} />

      <div style={{ transform: `scale(${glassP})`, opacity: glassOp, marginBottom: 28 }}>
        <GlassesSvg size={240} />
      </div>

      <div style={{ transform: `translateY(${stayY}px)`, opacity: stayOp }}>
        <span style={{ ...T, fontSize: 108, color: C.white }}>
          STAY IN <span style={{ color: C.teal }}>CONTROL.</span>
        </span>
      </div>

      <div style={{ transform: `translateY(${enjoyY}px)`, opacity: enjoyOp }}>
        <span style={{ ...T, fontSize: 108, color: C.orange }}>ENJOY THE TRIP.</span>
      </div>
    </AbsoluteFill>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Scene 6 — Finale: KEEPTRIP lockup / SMART. TRIP. BUDGET. / Google Play
// ═══════════════════════════════════════════════════════════════════════════════
const Scene6: React.FC = () => {
  const f = useCurrentFrame();

  const logoP = sp(f, { damping: 14, stiffness: 240 });
  const ktScale = f >= 6 ? stomp(f - 6) : 0;
  const ktOp = interpolate(f, [6, 12], [0, 1], ec);

  const tagOp = interpolate(f, [18, 28], [0, 1], ec);

  const badgeP = f >= 28 ? sp(f - 28, { damping: 10, stiffness: 220 }) : 0;
  const badgeScale = interpolate(badgeP, [0, 1], [0.4, 1]);
  const badgeOp = interpolate(f, [28, 38], [0, 1], ec);

  const dlOp = interpolate(f, [40, 50], [0, 1], ec);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 34,
      }}
    >
      <Sfx at={0} src="lofi_shimmer.wav" vol={0.6} />
      <Sfx at={6} src="lofi_thump.wav" vol={0.8} />
      <Sfx at={28} src="lofi_pop.wav" vol={0.7} />
      <Sfx at={28} src="lofi_fanfare.wav" vol={0.7} />

      {/* Logo lockup */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ transform: `scale(${logoP})` }}>
          <LogoK size={150} />
        </div>
        <div style={{ transform: `scale(${ktScale})`, opacity: ktOp, transformOrigin: "left center" }}>
          <span style={{ ...T, fontSize: 128, color: C.teal, letterSpacing: 4 }}>KEEPTRIP</span>
        </div>
      </div>

      {/* SMART. TRIP. BUDGET. */}
      <div style={{ opacity: tagOp, display: "flex", gap: 22 }}>
        <span style={{ ...T, fontSize: 48, color: C.white, letterSpacing: 3 }}>SMART.</span>
        <span style={{ ...T, fontSize: 48, color: C.orange, letterSpacing: 3 }}>TRIP.</span>
        <span style={{ ...T, fontSize: 48, color: C.teal, letterSpacing: 3 }}>BUDGET.</span>
      </div>

      {/* Google Play badge */}
      <div style={{ transform: `scale(${badgeScale})`, opacity: badgeOp, marginTop: 20 }}>
        <PlayBadge width={420} />
      </div>

      <div style={{ opacity: dlOp }}>
        <span style={{ fontFamily, fontWeight: 900, fontSize: 46, color: C.white, letterSpacing: 6 }}>DOWNLOAD NOW</span>
      </div>
    </AbsoluteFill>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
export const SmartTravelSteps: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    {/* Background video — muted, dimmed to 28% so text stays legible */}
    <OffthreadVideo
      src={staticFile("/videos/background.webm")}
      volume={0}
      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.28 }}
    />
    {/* Content sits inside a safe-area padding; the video stays full-bleed */}
    <AbsoluteFill style={{ transform: `scale(${CONTENT_SCALE})`, transformOrigin: "center center" }}>
      <Sequence from={0} durationInFrames={150}><Scene0 /></Sequence>
      <Sequence from={150} durationInFrames={270}><Scene1 /></Sequence>
      <Sequence from={420} durationInFrames={150}><Scene2 /></Sequence>
      <Sequence from={570} durationInFrames={150}><Scene3 /></Sequence>
      <Sequence from={720} durationInFrames={240}><Scene4 /></Sequence>
      <Sequence from={960} durationInFrames={150}><Scene5 /></Sequence>
      <Sequence from={1110} durationInFrames={60}><Scene6 /></Sequence>
    </AbsoluteFill>
  </AbsoluteFill>
);
