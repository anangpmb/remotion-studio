import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
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

// ── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#f3f3f3",
  white: "#1C1C2E",
  amber: "#F5A623",
  orange: "#FF5C39",
  green: "#4CAF82",
  blue: "#5C8FE0",
  dim: "#5A5A78",
} as const;

// ── Animation helpers ─────────────────────────────────────────────────────────
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

const shake = (frame: number): { x: number; y: number } => {
  const decay = Math.max(0, 1 - frame / 10);
  return {
    x: Math.sin(frame * 2.4) * 11 * decay,
    y: Math.cos(frame * 1.9) * 7 * decay,
  };
};

// ── Base text style ───────────────────────────────────────────────────────────
const T: React.CSSProperties = {
  fontFamily,
  fontWeight: 900,
  textAlign: "center",
  lineHeight: 1.04,
  letterSpacing: -3,
  display: "block",
};

// ── Logo (from public/images/Keeptrip.svg) ────────────────────────────────────
const P1 = "M358.5 68.5H423.5L272 256.5L423.5 445H358.5L192 256.5L358.5 68.5Z";
const P2 = "M183.5 172H244L169 257L244 340.5H183.5L93.5 257L183.5 172Z";
const P1_LEN = 1116;
const P2_LEN = 593;
const LOGO_CLR = "#EA9C2F";

/** Animated stroke-draw reveal → filled logo */
const LogoK: React.FC<{ frame: number; size?: number }> = ({ frame, size = 210 }) => {
  const p1 = interpolate(frame, [0, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const p2 = interpolate(frame, [18, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fillOp   = interpolate(frame, [60, 88], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const strokeOp = interpolate(frame, [80, 105], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sw = Math.max(2, Math.round((size / 512) * 16));
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <g opacity={strokeOp}>
        <path d={P1} stroke={LOGO_CLR} strokeWidth={sw}
          strokeDasharray={P1_LEN} strokeDashoffset={P1_LEN * (1 - p1)}
          strokeLinejoin="round" strokeLinecap="round" />
        <path d={P2} stroke={LOGO_CLR} strokeWidth={sw}
          strokeDasharray={P2_LEN} strokeDashoffset={P2_LEN * (1 - p2)}
          strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <g opacity={fillOp}>
        <path d={P1} fill={LOGO_CLR} />
        <path d={P2} fill={LOGO_CLR} />
      </g>
    </svg>
  );
};

/** Static filled K — for the finale brand mark */
const LogoKStatic: React.FC<{ size?: number; scaleVal?: number; opacityVal?: number }> = ({
  size = 160, scaleVal = 1, opacityVal = 1,
}) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none"
    style={{ transform: `scale(${scaleVal})`, opacity: opacityVal }}>
    <path d={P1} fill={LOGO_CLR} />
    <path d={P2} fill={LOGO_CLR} />
  </svg>
);

// ── SVG Icons ─────────────────────────────────────────────────────────────────


const WifiSlashSvg: React.FC<{ size?: number; slashP?: number }> = ({ size = 170, slashP = 1 }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 120 102" fill="none">
    <circle cx="60" cy="82" r="4" fill={C.white} />
    <path d="M44 68 Q60 57 76 68" stroke={C.white} strokeWidth="4" strokeLinecap="round" />
    <path d="M30 54 Q60 35 90 54" stroke={C.white} strokeWidth="4" strokeLinecap="round" />
    <path d="M16 40 Q60 13 104 40" stroke={C.white} strokeWidth="4" strokeLinecap="round" />
    <line
      x1="8" y1="8"
      x2={interpolate(slashP, [0, 1], [8, 112])}
      y2={interpolate(slashP, [0, 1], [8, 94])}
      stroke={C.orange} strokeWidth="5" strokeLinecap="round"
    />
  </svg>
);



const ShareArrow: React.FC<{ size?: number; pulse?: number }> = ({ size = 90, pulse = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none"
    style={{ transform: `scale(${1 + pulse * 0.1})` }}>
    <path d="M18 62 L55 25 M55 25 L28 22 M55 25 L52 52"
      stroke={C.amber} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="40" cy="40" r="36" stroke={C.amber} strokeWidth="2"
      opacity={0.25 + pulse * 0.35} />
  </svg>
);

const PlayBadge: React.FC<{ width?: number; opacity?: number; yOff?: number }> = ({
  width = 380, opacity = 1, yOff = 0,
}) => (
  <svg width={width} height={width * 0.295} viewBox="0 0 380 112"
    style={{ opacity, transform: `translateY(${yOff}px)` }}>
    <rect x="1.5" y="1.5" width="377" height="109" rx="16"
      stroke={C.dim} strokeWidth="2" fill={C.dim} fillOpacity={0.08} />
    <path d="M32 30 L32 82 L76 56 Z" fill={C.green} />
    <path d="M32 30 L56 54 L32 56 Z" fill={C.blue} opacity={0.85} />
    <path d="M32 82 L56 58 L32 56 Z" fill={C.orange} opacity={0.85} />
    <path d="M76 56 L56 54 L56 58 Z" fill={C.amber} opacity={0.85} />
    <text x="94" y="46" fill={C.dim} fontFamily="sans-serif" fontSize="14" fontWeight="400" opacity={0.8}>GET IT ON</text>
    <text x="92" y="80" fill={C.white} fontFamily="sans-serif" fontSize="30" fontWeight="700">Google Play</text>
  </svg>
);

// ── Scene 1: VACATION MODE: ON → BUDGET MODE: ??? ─────────────────────────────
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const BEAT = 70;

  const vacX = interpolate(f, [0, 18], [-1300, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vacOp = interpolate(f, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Bounce scale-in (low damping → overshoot), then shrinks on beat
  const illBounce = f >= 4 ? sp(f - 4, { damping: 6, stiffness: 260, mass: 0.85 }) : 0;
  const illExit   = interpolate(f, [BEAT - 8, BEAT], [1, 0.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const illScale  = illBounce * illExit;
  const illOp     = interpolate(f, [BEAT, BEAT + 6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qOp      = interpolate(f, [BEAT, BEAT + 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qScale   = f >= BEAT ? stomp(f - BEAT) : 0;

  const shk = f >= BEAT && f < BEAT + 12 ? shake(f - BEAT) : { x: 0, y: 0 };

  const budScale = f >= BEAT ? stomp(f - BEAT) : 0;
  const budOp    = interpolate(f, [BEAT, BEAT + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut  = interpolate(f, [150, 165], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
      transform: `translate(${shk.x}px, ${shk.y}px)`,
      opacity: fadeOut,
    }}>
      {/* SFX */}
      <Sequence from={0} durationInFrames={17}>
        <Audio src={staticFile("/sfx/scene_whoosh.wav")} volume={0.55} />
      </Sequence>
      <Sequence from={69} durationInFrames={7}>
        <Audio src={staticFile("/sfx/stat_pop.wav")} volume={0.95} />
      </Sequence>

      {/* Illustration: vacation svg draws in bottom-to-top, shrinks on beat → question mark */}
      <div style={{ position: "relative", width: 320, height: 300, marginBottom: 24 }}>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${illScale})`, opacity: illOp,
        }}>
          <Img
            src={staticFile("/images/illustration_vacation.svg")}
            width={320} height={300}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          transform: `scale(${qScale})`, opacity: qOp,
        }}>
          <svg width={180} height={220} viewBox="0 0 100 120" fill="none">
            <text x="50" y="92" textAnchor="middle" fill={C.amber} fontSize="108"
              fontFamily="sans-serif" fontWeight="900">?</text>
          </svg>
        </div>
      </div>

      {/* VACATION MODE: ON */}
      <div style={{ overflow: "hidden", transform: `translateX(${vacX}px)`, opacity: vacOp }}>
        <span style={{ ...T, fontSize: 86, color: C.white }}>
          VACATION MODE: <span style={{ color: C.green }}>ON</span>
        </span>
      </div>

      {/* BUDGET MODE: ??? */}
      <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `scale(${budScale})`, opacity: budOp, transformOrigin: "center" }}>
          <span style={{ ...T, fontSize: 86, color: C.white }}>
            BUDGET MODE: <span style={{ color: C.amber }}>???</span>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 2: MEET KEEPTRIP (logo draw) / SMART. TRIP. BUDGET. ─────────────────
const Scene2: React.FC = () => {
  const f = useCurrentFrame();

  // Logo drawing animation driven from frame 0
  const logoScale = sp(f - 4, { damping: 18, stiffness: 200 });
  const logoOp    = interpolate(f, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // "MEET KEEPTRIP" label fades up after logo appears
  const meetY  = maskY(f, 22);
  const meetOp = interpolate(f, [22, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Kinetic word stack
  const smartScale = f >= 62 ? stomp(f - 62) : 0;
  const smartOp    = interpolate(f, [62, 67], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const smartY     = interpolate(f, [78, 92], [0, -140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tripScale  = f >= 90 ? stomp(f - 90) : 0;
  const tripOp     = interpolate(f, [90, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tripY      = interpolate(f, [106, 120], [0, -140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const budScale   = f >= 118 ? stomp(f - 118) : 0;
  const budOp      = interpolate(f, [118, 123], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const fadeOut = interpolate(f, [138, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24,
      opacity: fadeOut,
    }}>
      {/* SFX */}
      <Sequence from={0} durationInFrames={66}>
        <Audio src={staticFile("/sfx/logo_draw.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={62} durationInFrames={7}>
        <Audio src={staticFile("/sfx/stat_pop.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={90} durationInFrames={7}>
        <Audio src={staticFile("/sfx/stat_pop.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={118} durationInFrames={7}>
        <Audio src={staticFile("/sfx/stat_pop.wav")} volume={0.8} />
      </Sequence>

      {/* Logo drawing + MEET KEEPTRIP label */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ transform: `scale(${logoScale})`, opacity: logoOp }}>
          <LogoK frame={f} size={200} />
        </div>
        <div style={{ overflow: "hidden", height: 80 }}>
          <div style={{
            transform: `translateY(${meetY}%)`, opacity: meetOp,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 22,
          }}>
            <span style={{ fontFamily, fontWeight: 800, fontSize: 58, color: C.dim, letterSpacing: 8 }}>MEET</span>
            <span style={{ fontFamily, fontWeight: 900, fontSize: 58, color: C.amber, letterSpacing: 2 }}>KEEPTRIP</span>
          </div>
        </div>
      </div>

      {/* Kinetic word stack */}
      <div style={{
        position: "relative", height: 140, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", transform: `scale(${smartScale}) translateY(${smartY}px)`, opacity: smartOp }}>
          <span style={{ ...T, fontSize: 130, color: C.white }}>SMART.</span>
        </div>
        <div style={{ position: "absolute", transform: `scale(${tripScale}) translateY(${tripY}px)`, opacity: tripOp }}>
          <span style={{ ...T, fontSize: 130, color: C.amber }}>TRIP.</span>
        </div>
        <div style={{ position: "absolute", transform: `scale(${budScale})`, opacity: budOp }}>
          <span style={{ ...T, fontSize: 130, color: C.white }}>BUDGETING.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 3: NO WI-FI? / NO PROBLEM. / 100% OFFLINE. ────────────────────────
const Scene3: React.FC = () => {
  const f = useCurrentFrame();

  const slashP  = interpolate(f, [12, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const airOp   = interpolate(f, [62, 82], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wifiOp  = interpolate(f, [62, 78], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const noWifiW = wipe(f, 8, 22);
  const noWifiOp = interpolate(f, [8, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const probW  = wipe(f, 32, 22);
  const probOp = interpolate(f, [32, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const offScale = f >= 58 ? stomp(f - 58) : 0;
  const offOp    = interpolate(f, [58, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut  = interpolate(f, [138, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 30,
      opacity: fadeOut,
    }}>
      {/* SFX */}
      <Sequence from={0} durationInFrames={17}>
        <Audio src={staticFile("/sfx/scene_whoosh.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={57} durationInFrames={33}>
        <Audio src={staticFile("/sfx/ding_success.wav")} volume={0.65} />
      </Sequence>

      {/* Icon: WiFi-slash → Airplane */}
      <div style={{ position: "relative", width: 200, height: 175, marginBottom: 18 }}>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          opacity: wifiOp,
        }}>
          <WifiSlashSvg size={170} slashP={slashP} />
        </div>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          opacity: airOp,
        }}>
          <Img src={staticFile("/icons/flight.svg")} width={155} height={155} />
        </div>
      </div>

      <div style={{ clipPath: `inset(0 ${100 - noWifiW}% 0 0)`, opacity: noWifiOp }}>
        <span style={{ ...T, fontSize: 96, color: C.white }}>
          NO <span style={{ color: C.amber }}>WI-FI?</span>
        </span>
      </div>

      <div style={{ clipPath: `inset(0 ${100 - probW}% 0 0)`, opacity: probOp }}>
        <span style={{ ...T, fontSize: 96, color: C.white }}>
          NO <span style={{ color: C.orange }}>PROBLEM.</span>
        </span>
      </div>

      <div style={{ transform: `scale(${offScale})`, opacity: offOp, transformOrigin: "center", marginTop: 10 }}>
        <span style={{ ...T, fontSize: 108, color: C.green }}>100% OFFLINE.</span>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 4: Currency Slot Machine ────────────────────────────────────────────
const SLOT_SYMS = ["$", "€", "¥", "Rp", "£", "₩", "$", "€", "¥", "Rp", "£", "₩"];
const FINAL_SYMS = ["$", "€", "¥", "Rp"];

const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const LOCK = 62;

  const spinRate = interpolate(f, [0, LOCK], [14, 0.6], { extrapolateRight: "clamp" });
  const offset   = (f * spinRate) % 12;
  const locked   = f >= LOCK;

  const lockScale = (i: number) => (locked ? stomp(f - LOCK - i * 10) : 0);
  const lockOp    = (i: number) =>
    interpolate(f, [LOCK + i * 10, LOCK + i * 10 + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const anyY  = interpolate(f, [85, 112], [220, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const anyOp = interpolate(f, [85, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [138, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 50,
      opacity: fadeOut,
    }}>
      {/* SFX */}
      <Sequence from={0} durationInFrames={49}>
        <Audio src={staticFile("/sfx/currency_spin.wav")} volume={0.6} />
      </Sequence>
      {[0, 10, 20, 30].map((delay) => (
        <Sequence key={delay} from={LOCK + delay} durationInFrames={7}>
          <Audio src={staticFile("/sfx/stat_pop.wav")} volume={0.7} />
        </Sequence>
      ))}

      {/* Slot machine */}
      <div style={{ height: 190, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!locked ? (
          <div style={{ display: "flex", gap: 40 }}>
            {[0, 1, 2, 3].map((col) => {
              const rawIdx = offset + col * 3;
              const idx     = Math.floor(rawIdx) % 12;
              const nextIdx = (idx + 1) % 12;
              const frac    = rawIdx - Math.floor(rawIdx);
              return (
                <div key={col} style={{ overflow: "hidden", height: 160, width: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ transform: `translateY(${-frac * 160}px)` }}>
                    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ ...T, fontSize: 110, color: C.amber }}>{SLOT_SYMS[idx]}</span>
                    </div>
                    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ ...T, fontSize: 110, color: C.amber }}>{SLOT_SYMS[nextIdx]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
            {FINAL_SYMS.map((sym, i) => (
              <div key={sym} style={{ transform: `scale(${lockScale(i)})`, opacity: lockOp(i) }}>
                <span style={{ ...T, fontSize: 110, color: C.amber }}>{sym}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ANY CURRENCY. ANYWHERE. */}
      <div style={{
        transform: `translateY(${anyY}px)`, opacity: anyOp,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <span style={{ ...T, fontSize: 84, color: C.white }}>ANY CURRENCY.</span>
        <span style={{ ...T, fontSize: 84, color: C.amber }}>ANYWHERE.</span>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 5: FOOD. FLIGHTS. FUN. / NEVER OVERSPEND. ─────────────────────────
const Scene5: React.FC = () => {
  const f = useCurrentFrame();

  const icons = [
    { label: "FOOD.",    color: C.orange, Icon: <Img src={staticFile("/icons/food_noodles.svg")} width={92} height={92} />, delay: 0  },
    { label: "FLIGHTS.", color: C.white,  Icon: <Img src={staticFile("/icons/flight.svg")}       width={92} height={92} />, delay: 20 },
    { label: "FUN.",     color: C.amber,  Icon: <Img src={staticFile("/icons/party.svg")}         width={92} height={92} />, delay: 40 },
  ];

  const iconPop = (d: number) => (f >= 8 + d ? stomp(f - 8 - d) : 0);
  const iconOp  = (d: number) =>
    interpolate(f, [8 + d, 14 + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const wordY  = (d: number) => maskY(f, 10 + d);
  const wordOp = (d: number) =>
    interpolate(f, [10 + d, 22 + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const neverY  = maskY(f, 88);
  const neverOp = interpolate(f, [88, 102], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const barProg = interpolate(f, [95, 145], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const barOp   = interpolate(f, [93, 102], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [138, 150], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 44,
      opacity: fadeOut,
    }}>
      {/* SFX */}
      <Sequence from={0} durationInFrames={17}>
        <Audio src={staticFile("/sfx/scene_whoosh.wav")} volume={0.5} />
      </Sequence>
      {icons.map(({ delay }, i) => (
        <Sequence key={i} from={8 + delay} durationInFrames={5}>
          <Audio src={staticFile("/sfx/expense_tap.wav")} volume={0.75} />
        </Sequence>
      ))}
      <Sequence from={95} durationInFrames={33}>
        <Audio src={staticFile("/sfx/ding_success.wav")} volume={0.6} />
      </Sequence>

      {/* Icons + words — vertical list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {icons.map(({ label, color, Icon, delay }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div style={{ transform: `scale(${iconPop(delay)})`, opacity: iconOp(delay), flexShrink: 0 }}>
              {Icon}
            </div>
            <div style={{ overflow: "hidden", height: 108 }}>
              <div style={{ transform: `translateY(${wordY(delay)}%)`, opacity: wordOp(delay) }}>
                <span style={{ ...T, fontSize: 96, color, textAlign: "left" }}>{label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NEVER OVERSPEND. */}
      <div style={{ overflow: "hidden", height: 110 }}>
        <div style={{ transform: `translateY(${neverY}%)`, opacity: neverOp }}>
          <span style={{ ...T, fontSize: 88, color: C.white }}>
            NEVER <span style={{ color: C.orange }}>OVERSPEND.</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ opacity: barOp }}>
        <svg width={920} height={18} viewBox="0 0 920 18">
          <rect x="0" y="7" width="920" height="4" rx="2" fill={C.dim} opacity={0.3} />
          <rect x="0" y="7" width={920 * barProg} height="4" rx="2" fill="url(#ktPG)" />
          <defs>
            <linearGradient id="ktPG" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={C.green} />
              <stop offset="65%" stopColor={C.amber} />
              <stop offset="100%" stopColor={C.orange} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 6: WRAPPED! / SHARE YOUR STATS. ────────────────────────────────────
const CONFETTI_COLORS = [C.amber, C.orange, C.green, C.white, "#E060A0", C.blue, C.amber, C.orange];

const Scene6: React.FC = () => {
  const f = useCurrentFrame();

  const cardSp = sp(f, { damping: 18, stiffness: 170 });
  const cardY  = interpolate(cardSp, [0, 1], [1400, 0]);

  const yourY  = maskY(f, 12);
  const yourOp = interpolate(f, [12, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const wrappedScale = f >= 32 ? stomp(f - 32) : 0;
  const wrappedOp    = interpolate(f, [32, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const crownSp  = f >= 38 ? sp(f - 38, { damping: 12, stiffness: 320 }) : 0;
  const crownOp  = interpolate(f, [38, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const shareY  = maskY(f, 55);
  const shareOp = interpolate(f, [55, 68], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const pulse  = Math.sin(f * 0.22) * 0.5 + 0.5;
  const confF  = Math.max(0, f - 32);
  const fadeOut = interpolate(f, [120, 135], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28,
      opacity: fadeOut,
      overflow: "hidden",
    }}>
      {/* SFX */}
      <Sequence from={32} durationInFrames={55}>
        <Audio src={staticFile("/sfx/wrapped_fanfare.wav")} volume={0.8} />
      </Sequence>

      {/* Confetti burst (deterministic — no Math.random) */}
      {confF > 0 && confF < 68 && Array.from({ length: 28 }).map((_, ci) => {
        const angle = (ci / 28) * Math.PI * 2;
        const speed = 3.5 + (ci % 4) * 1.2;
        const dist  = confF * speed;
        const grav  = confF * confF * 0.055;
        const confX = Math.sin(angle) * dist;
        const confY = -Math.cos(angle) * dist + grav * (Math.cos(angle) < 0 ? -1 : 1);
        const cOp   = interpolate(confF, [0, 5, 52, 68], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const sz    = 8 + (ci % 3) * 5;
        return (
          <div key={ci} style={{
            position: "absolute", top: "52%", left: "50%",
            width: sz, height: sz,
            borderRadius: ci % 3 === 0 ? "50%" : ci % 3 === 1 ? "2px" : "1px",
            backgroundColor: CONFETTI_COLORS[ci % CONFETTI_COLORS.length],
            transform: `translate(calc(${confX}px - ${sz / 2}px), calc(${confY}px - ${sz / 2}px)) rotate(${confF * (ci + 1) * 4}deg)`,
            opacity: cOp,
          }} />
        );
      })}

      {/* Card outline with crown inside */}
      <div style={{ transform: `translateY(${cardY}px)`, position: "relative" }}>
        <svg width={270} height={390} viewBox="0 0 270 390" fill="none">
          <rect x="4" y="4" width="262" height="382" rx="24"
            stroke={C.amber} strokeWidth="2.5" strokeDasharray="10 5" />
        </svg>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: `translate(-50%, -50%) scale(${crownSp})`,
          opacity: crownOp,
        }}>
          <Img src={staticFile("/images/Keeptrip.svg")} width={140} height={140} />
        </div>
      </div>

      {/* YOUR TRIP... */}
      <div style={{ overflow: "hidden", height: 88 }}>
        <div style={{ transform: `translateY(${yourY}%)`, opacity: yourOp }}>
          <span style={{ ...T, fontSize: 78, color: C.dim }}>YOUR TRIP...</span>
        </div>
      </div>

      {/* WRAPPED! */}
      <div style={{ transform: `scale(${wrappedScale})`, opacity: wrappedOp, transformOrigin: "center" }}>
        <span style={{ ...T, fontSize: 118, color: C.amber }}>WRAPPED!</span>
      </div>

      {/* Share row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 18,
        transform: `translateY(${shareY}%)`, opacity: shareOp, overflow: "hidden",
      }}>
        <span style={{ ...T, fontSize: 66, color: C.white }}>SHARE YOUR STATS.</span>
        <ShareArrow size={82} pulse={pulse} />
      </div>
    </AbsoluteFill>
  );
};

// ── Scene 7: TRAVEL MORE. WORRY LESS. / [logo] KEEPTRIP / Google Play ─────────
const Scene7: React.FC = () => {
  const f = useCurrentFrame();

  const travelY  = maskY(f, 5);
  const travelOp = interpolate(f, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const worryY   = maskY(f, 22);
  const worryOp  = interpolate(f, [22, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Logo K pops in first, then KEEPTRIP text stomps next to it
  const logoSp   = f >= 40 ? sp(f - 40, { damping: 16, stiffness: 220 }) : 0;
  const logoOp   = interpolate(f, [40, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ktScale  = f >= 50 ? stomp(f - 50) : 0;
  const ktOp     = interpolate(f, [50, 56], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const badgeOp  = interpolate(f, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const badgeY   = interpolate(f, [70, 90], [50, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const bannerY  = maskY(f, 90);
  const bannerOp = interpolate(f, [90, 105], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28,
    }}>
      {/* SFX */}
      <Sequence from={50} durationInFrames={7}>
        <Audio src={staticFile("/sfx/stat_pop.wav")} volume={0.85} />
      </Sequence>
      <Sequence from={70} durationInFrames={17}>
        <Audio src={staticFile("/sfx/scene_whoosh.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={70} durationInFrames={33}>
        <Audio src={staticFile("/sfx/ding_success.wav")} volume={0.55} />
      </Sequence>

      {/* TRAVEL MORE. */}
      <div style={{ overflow: "hidden", height: 116 }}>
        <div style={{ transform: `translateY(${travelY}%)`, opacity: travelOp }}>
          <span style={{ ...T, fontSize: 102, color: C.white }}>
            TRAVEL <span style={{ color: C.green }}>MORE.</span>
          </span>
        </div>
      </div>

      {/* WORRY LESS. */}
      <div style={{ overflow: "hidden", height: 116 }}>
        <div style={{ transform: `translateY(${worryY}%)`, opacity: worryOp }}>
          <span style={{ ...T, fontSize: 102, color: C.white }}>
            WORRY <span style={{ color: C.orange }}>LESS.</span>
          </span>
        </div>
      </div>

      {/* Logo K + KEEPTRIP wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
        <div style={{ transform: `scale(${logoSp})`, opacity: logoOp }}>
          <LogoKStatic size={150} />
        </div>
        <div style={{ transform: `scale(${ktScale})`, opacity: ktOp, transformOrigin: "left center" }}>
          <span style={{ ...T, fontSize: 118, color: C.amber, letterSpacing: 6 }}>KEEPTRIP</span>
        </div>
      </div>

      {/* Google Play badge */}
      <div style={{ marginTop: 10 }}>
        <PlayBadge width={380} opacity={badgeOp} yOff={badgeY} />
      </div>

      {/* No Sign-Up Needed */}
      <div style={{ overflow: "hidden", height: 60 }}>
        <div style={{ transform: `translateY(${bannerY}%)`, opacity: bannerOp }}>
          <span style={{ fontFamily, fontSize: 42, fontWeight: 700, color: C.green, letterSpacing: 2 }}>
            No Sign-Up Needed!
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
export const KeepTripKinetic: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    {/* Background video — muted, looped, dimmed to 28% so text stays legible */}
    <OffthreadVideo
      src={staticFile("/videos/background.webm")}
      volume={0}
      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.28 }}
    />
    <Sequence from={0}   durationInFrames={165}><Scene1 /></Sequence>
    <Sequence from={165} durationInFrames={150}><Scene2 /></Sequence>
    <Sequence from={315} durationInFrames={150}><Scene3 /></Sequence>
    <Sequence from={465} durationInFrames={150}><Scene4 /></Sequence>
    <Sequence from={615} durationInFrames={150}><Scene5 /></Sequence>
    <Sequence from={765} durationInFrames={135}><Scene6 /></Sequence>
    <Sequence from={900} durationInFrames={165}><Scene7 /></Sequence>
  </AbsoluteFill>
);
