import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Nunito";

const { fontFamily } = loadFont();

// ─── Brand palette: energetic travel ─────────────────────────────────────────
const C = {
  teal:    "#00C9B8",
  orange:  "#FF6835",
  amber:   "#EA9C2F",      // KeepTrip brand gold
  white:   "#F5F7FF",
  bg:      "#0D1B2A",
  bgMid:   "#132032",
  card:    "#1A2B3D",
  cardHi:  "#213447",
  red:     "#FF3B5C",
  green:   "#00D68F",
  purple:  "#7C4DFF",
  pink:    "#FF6EB4",
  yellow:  "#FFD166",
} as const;

const f = (
  size: number,
  weight = 600,
  color: string = C.white,
): React.CSSProperties => ({
  fontFamily,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.25,
});

const ec = {
  extrapolateLeft:  "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ─── Animated KeepTrip K logo (draws from SVG paths) ──────────────────────────
const PATH1_D = "M358.5 68.5H423.5L272 256.5L423.5 445H358.5L192 256.5L358.5 68.5Z";
const PATH2_D = "M183.5 172H244L169 257L244 340.5H183.5L93.5 257L183.5 172Z";
const P1_LEN  = 1116;
const P2_LEN  = 593;

const KeepTripLogo: React.FC<{
  size?: number;
  animated?: boolean;
  frame?: number;
}> = ({ size = 80, animated = false, frame = 100 }) => {
  if (!animated) {
    return (
      <Img
        src={staticFile("images/Keeptrip.svg")}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }
  const p1      = interpolate(frame, [0, 55], [0, 1], ec);
  const p2      = interpolate(frame, [22, 70], [0, 1], ec);
  const fillOp  = interpolate(frame, [65, 88], [0, 1], ec);
  const strkOp  = interpolate(frame, [72, 95], [1, 0], ec);
  const sw      = Math.max(4, (size / 512) * 14);

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <g opacity={strkOp}>
        <path d={PATH1_D} stroke={C.amber} strokeWidth={sw} fill="none"
          strokeDasharray={P1_LEN} strokeDashoffset={P1_LEN * (1 - p1)}
          strokeLinejoin="round" strokeLinecap="round" />
        <path d={PATH2_D} stroke={C.amber} strokeWidth={sw} fill="none"
          strokeDasharray={P2_LEN} strokeDashoffset={P2_LEN * (1 - p2)}
          strokeLinejoin="round" strokeLinecap="round" />
      </g>
      <g opacity={fillOp}>
        <path d={PATH1_D} fill={C.amber} />
        <path d={PATH2_D} fill={C.amber} />
      </g>
    </svg>
  );
};

// ─── Phone shell ──────────────────────────────────────────────────────────────
const Phone: React.FC<{
  children?: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
}> = ({ children, width = 340, style }) => {
  const h = width * 2.1;
  const r = width * 0.115;
  return (
    <div style={{
      width, height: h, position: "relative",
      backgroundColor: "#080E1A",
      borderRadius: r,
      border: `${Math.max(2, width * 0.008)}px solid #263346`,
      boxShadow: [
        "0 50px 120px rgba(0,0,0,0.85)",
        "0 0 0 1px rgba(255,255,255,0.05)",
        "inset 0 1px 0 rgba(255,255,255,0.07)",
      ].join(","),
      overflow: "hidden",
      ...style,
    }}>
      {/* status bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: width * 0.1,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
        zIndex: 20, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: `0 ${width * 0.07}px`,
      }}>
        <span style={{ ...f(width * 0.04, 600), color: `${C.white}90` }}>9:41</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <svg width={width * 0.065} height={width * 0.04} viewBox="0 0 20 14">
            <rect x="0" y="8"   width="3" height="6" rx="0.5" fill={`${C.white}80`} />
            <rect x="4.5" y="5" width="3" height="9" rx="0.5" fill={`${C.white}80`} />
            <rect x="9"  y="2"  width="3" height="12" rx="0.5" fill={`${C.white}80`} />
            <rect x="13.5" y="0" width="3" height="14" rx="0.5" fill={`${C.white}80`} />
          </svg>
        </div>
      </div>
      {/* dynamic island */}
      <div style={{
        position: "absolute", top: width * 0.028, left: "50%",
        transform: "translateX(-50%)",
        width: width * 0.2, height: width * 0.04,
        backgroundColor: "#080E1A", borderRadius: width * 0.025, zIndex: 21,
      }} />
      {children}
    </div>
  );
};

// ─── Floating ambient blob ────────────────────────────────────────────────────
const Blob: React.FC<{
  x: number; y: number; size: number; color: string;
  frame: number; phase?: number;
}> = ({ x, y, size, color, frame, phase = 0 }) => (
  <div style={{
    position: "absolute",
    left: x + Math.sin(frame * 0.016 + phase) * 60,
    top:  y + Math.cos(frame * 0.019 + phase) * 80,
    width: size, height: size, borderRadius: "50%",
    background: `radial-gradient(circle, ${color}20 0%, transparent 65%)`,
    pointerEvents: "none",
  }} />
);

// ─── Scene 1 · Globe Hook  0-5 s ──────────────────────────────────────────────
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp      = interpolate(frame, [0, 18], [0, 1], ec);
  const globeSc   = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 55 } });
  const planeOp   = interpolate(frame, [38, 55], [0, 1], ec);
  const planeSc   = interpolate(frame, [38, 52], [0, 1], { ...ec, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const warnY     = interpolate(frame, [98, 120], [220, 0],  { ...ec, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const warnOp    = interpolate(frame, [98, 115], [0, 1], ec);
  const tagOp     = interpolate(frame, [8, 30], [0, 1], ec);

  // receipt data: [offsetX, offsetY, baseRot, appearDelay]
  const receipts = [
    [-340, -260, -42, 18], [ 280, -180,  28, 26],
    [-220,  140, -22, 22], [ 320,  170,  58, 32],
    [-360,   40, -65, 38], [ 200, -320,  14, 24],
    [-120,  300, -32, 30], [ 390,  -60,  75, 20],
  ] as const;

  const currSymbols = ["$$$", "???", "¥¥¥", "€€€", "!!!"];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: bgOp }}>
      {/* SFX */}
      <Sequence from={0}  durationInFrames={22}><Audio src="https://remotion.media/whoosh.wav"     volume={0.6} /></Sequence>
      <Sequence from={20} durationInFrames={20}><Audio src="https://remotion.media/page-turn.wav"  volume={0.5} /></Sequence>

      {/* BG radial */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 90% 60% at 50% 40%, #1A3050 0%, transparent 70%)",
      }} />
      <Blob x={-120} y={200}  size={700} color={C.teal}   frame={frame} phase={0}   />
      <Blob x={600}  y={-100} size={600} color={C.orange} frame={frame} phase={2.1} />

      {/* Globe SVG */}
      <div style={{
        position: "absolute", top: "16%", left: "50%",
        transform: `translate(-50%, 0) scale(${globeSc})`,
      }}>
        <svg width={500} height={500} viewBox="0 0 500 500">
          <defs>
            <radialGradient id="gGrad" cx="32%" cy="28%">
              <stop offset="0%"   stopColor="#1B4A70" />
              <stop offset="55%"  stopColor="#0D2A48" />
              <stop offset="100%" stopColor="#040D1A" />
            </radialGradient>
            <radialGradient id="gShine" cx="28%" cy="24%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.16)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
            </radialGradient>
            <clipPath id="gClip"><circle cx="250" cy="250" r="228" /></clipPath>
          </defs>
          <circle cx="250" cy="250" r="228" fill="url(#gGrad)" />

          {/* Latitude lines */}
          <g clipPath="url(#gClip)" stroke={C.teal} strokeWidth={1} fill="none" opacity={0.25}>
            {[-3,-2,-1,0,1,2,3].map(i => {
              const cy2 = 250 + i * 57;
              const rx  = Math.sqrt(Math.max(0, 228 * 228 - (cy2 - 250) ** 2));
              return <ellipse key={i} cx={250} cy={cy2} rx={rx} ry={rx * 0.14} />;
            })}
          </g>
          {/* Longitude lines (animated "spin") */}
          <g clipPath="url(#gClip)" stroke={C.teal} strokeWidth={1} fill="none" opacity={0.18}>
            {[0,1,2,3,4,5,6,7].map(i => {
              const ang = ((i / 8) * Math.PI + frame * 0.009) % Math.PI;
              const x1  = 250 + Math.cos(ang) * 228;
              const x2  = 250 - Math.cos(ang) * 228;
              return <line key={i} x1={x1} y1={22} x2={x2} y2={478} />;
            })}
          </g>
          {/* Continent blobs */}
          <g clipPath="url(#gClip)" fill={`${C.green}55`}>
            <ellipse cx={155 + Math.cos(frame * 0.012) * 6} cy={195} rx={52} ry={84} />
            <ellipse cx={165 + Math.cos(frame * 0.012) * 6} cy={300} rx={42} ry={62} />
            <ellipse cx={280} cy={178} rx={38} ry={32} />
            <ellipse cx={273} cy={268} rx={32} ry={52} />
            <ellipse cx={368} cy={158} rx={64} ry={46} />
            <ellipse cx={378} cy={295} rx={28} ry={35} />
          </g>
          {/* Shine */}
          <circle cx="250" cy="250" r="228" fill="url(#gShine)" />
          <circle cx="250" cy="250" r="228" fill="none" stroke={C.teal} strokeWidth={3} opacity={0.65} />
          <circle cx="250" cy="250" r="234" fill="none" stroke={C.teal} strokeWidth={1} opacity={0.2}  />
          <circle cx="250" cy="250" r="242" fill="none" stroke={C.teal} strokeWidth={1} opacity={0.08} />

          {/* Traveler plane landing */}
          <text
            x={295} y={290}
            fontSize={60} textAnchor="middle"
            opacity={planeOp}
            transform={`scale(${planeSc}) translate(${(1 - planeSc) * -295}, ${(1 - planeSc) * -290})`}
          >✈️</text>
        </svg>
      </div>

      {/* Chaotic receipts */}
      {receipts.map(([ox, oy, rot, delay], i) => {
        const rOp  = interpolate(frame, [delay, delay + 18], [0, 1], ec);
        const wob  = Math.sin(frame * 0.09 + i * 1.4) * 14;
        const rotA = rot + frame * 0.28;
        return (
          <div key={i} style={{
            position: "absolute",
            top: "42%", left: "50%",
            transform: `translate(calc(-50% + ${ox + wob}px), calc(-50% + ${oy + wob * 0.5}px)) rotate(${rotA}deg)`,
            opacity: rOp,
          }}>
            <div style={{
              width: 70, height: 92,
              backgroundColor: "#FAFAFA", borderRadius: 6,
              padding: "10px 8px",
              boxShadow: "0 4px 18px rgba(0,0,0,0.5)",
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              <div style={{ height: 8, backgroundColor: "#DDD", borderRadius: 2 }} />
              <div style={{ height: 5, backgroundColor: "#EEE", borderRadius: 2, width: "70%" }} />
              <div style={{ height: 5, backgroundColor: "#EEE", borderRadius: 2 }} />
              <div style={{ height: 5, backgroundColor: "#EEE", borderRadius: 2, width: "80%" }} />
              <div style={{ height: 9, backgroundColor: C.orange, borderRadius: 2, marginTop: 4 }} />
            </div>
          </div>
        );
      })}

      {/* "???" currency symbols */}
      {currSymbols.map((sym, i) => {
        const positions = [[-400,-340],[370,-300],[-340, 210],[360, 260],[0,-400]];
        const [sx, sy] = positions[i];
        const sOp = interpolate(frame, [40 + i * 8, 56 + i * 8], [0, 0.9], ec);
        const wx  = Math.sin(frame * 0.055 + i * 2.1) * 22;
        const wy  = Math.cos(frame * 0.07  + i)       * 16;
        return (
          <div key={i} style={{
            position: "absolute", top: "42%", left: "50%",
            transform: `translate(calc(-50% + ${sx + wx}px), calc(-50% + ${sy + wy}px))`,
            opacity: sOp, ...f(38, 800, C.orange),
            textShadow: `0 0 22px ${C.orange}80`,
          }}>
            {sym}
          </div>
        );
      })}

      {/* Red warning bar */}
      <div style={{
        position: "absolute", top: "75%", left: 44, right: 44,
        transform: `translateY(${warnY}px)`,
        opacity: warnOp,
        backgroundColor: C.red, borderRadius: 22,
        padding: "24px 38px",
        display: "flex", alignItems: "center", gap: 20,
        boxShadow: `0 10px 44px ${C.red}60`,
      }}>
        <span style={{ fontSize: 50 }}>⚠️</span>
        <div>
          <div style={{ ...f(42, 800) }}>Overspending!</div>
          <div style={{ ...f(28, 500, `${C.white}CC`) }}>on vacation again?</div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{
        position: "absolute", bottom: 50, width: "100%", textAlign: "center",
        opacity: tagOp, padding: "0 80px",
        ...f(34, 500, `${C.white}80`),
      }}>
        Love traveling, but hate losing track of your money?
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2 · Solution Intro  5-10 s ─────────────────────────────────────────
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const suckP    = interpolate(frame, [0, 42], [0, 1], { ...ec, easing: Easing.bezier(0.4, 0, 0.6, 1) });
  const phoneSc  = spring({ frame: frame - 28, fps, config: { damping: 14, stiffness: 70 } });
  const phoneY   = interpolate(phoneSc, [0, 1], [700, 0]);
  const dashOp   = interpolate(frame, [72, 92], [0, 1], ec);
  const dashY    = interpolate(frame, [72, 92], [55, 0], ec);
  const titleOp  = interpolate(frame, [95, 115], [0, 1], ec);
  const titleSc  = interpolate(frame, [95, 115], [0.85, 1], ec);
  const logoF    = Math.max(0, frame - 46);
  const bgOp     = interpolate(frame, [0, 16], [0, 1], ec);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: bgOp }}>
      {/* SFX */}
      <Sequence from={4}  durationInFrames={18}><Audio src="https://remotion.media/whoosh.wav"     volume={0.5} /></Sequence>
      <Sequence from={72} durationInFrames={15}><Audio src="https://remotion.media/ding.wav"       volume={0.65} /></Sequence>
      <Sequence from={92} durationInFrames={10}><Audio src="https://remotion.media/mouse-click.wav" volume={0.5} /></Sequence>

      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 80% 70% at 50% 60%, #1A3A5A 0%, transparent 72%)",
      }} />
      <Blob x={-80}  y={400}  size={650} color={C.teal}  frame={frame} phase={0.8} />
      <Blob x={550}  y={100}  size={550} color={C.amber} frame={frame} phase={3.2} />

      {/* Receipts being sucked in */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const sx    = Math.cos(angle) * 380;
        const sy    = Math.sin(angle) * 380;
        const rx    = interpolate(suckP, [0, 1], [sx, 0]);
        const ry    = interpolate(suckP, [0, 1], [sy, 0]);
        const sc    = interpolate(suckP, [0, 0.72, 1], [1, 0.7, 0]);
        const op    = interpolate(suckP, [0, 0.78, 1], [0.85, 0.6, 0]);
        return (
          <div key={i} style={{
            position: "absolute", top: "42%", left: "50%",
            transform: `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px)) scale(${sc}) rotate(${frame * 5 + i * 45}deg)`,
            opacity: op,
          }}>
            <div style={{ width: 56, height: 72, backgroundColor: "#FAFAFA", borderRadius: 5 }}>
              <div style={{ height: 6, backgroundColor: "#DDD", borderRadius: 2, margin: "8px 6px 4px" }} />
              <div style={{ height: 4, backgroundColor: "#EEE", borderRadius: 2, margin: "0 6px 3px" }} />
              <div style={{ height: 4, backgroundColor: "#EEE", borderRadius: 2, margin: "0 6px" }} />
            </div>
          </div>
        );
      })}

      {/* Phone */}
      <div style={{
        position: "absolute", top: "9%", left: "50%",
        transform: `translateX(-50%) translateY(${phoneY}px)`,
      }}>
        <Phone width={370}>
          <AbsoluteFill style={{ backgroundColor: C.card, paddingTop: 42 }}>
            {/* App header */}
            <div style={{
              padding: "18px 24px 14px",
              borderBottom: `1px solid ${C.cardHi}`,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <KeepTripLogo size={46} animated frame={logoF} />
              <div>
                <div style={{ ...f(30, 800, C.amber), fontSize: 30 }}>KeepTrip</div>
                <div style={{ ...f(14, 500, `${C.white}60`), fontSize: 14 }}>Smart Trip Budget</div>
              </div>
            </div>

            {/* Dashboard */}
            <div style={{ opacity: dashOp, transform: `translateY(${dashY}px)`, padding: "18px 20px" }}>
              {/* Budget summary card */}
              <div style={{
                backgroundColor: C.bgMid, borderRadius: 16,
                padding: "16px 18px", marginBottom: 14,
                border: `1px solid ${C.cardHi}`,
              }}>
                <div style={{ ...f(17, 700, C.amber), fontSize: 17, marginBottom: 8 }}>🗼 Tokyo Trip</div>
                <div style={{ ...f(12, 500, `${C.white}55`), fontSize: 12, marginBottom: 12 }}>Mar 10 – 20, 2025 · 10 days</div>
                <div style={{ backgroundColor: C.cardHi, borderRadius: 5, height: 7, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{
                    width: `${interpolate(dashOp, [0, 1], [0, 68])}%`,
                    height: "100%", backgroundColor: C.amber, borderRadius: 5,
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ ...f(11, 500, `${C.white}55`), fontSize: 11 }}>68% used</span>
                  <span style={{ ...f(11, 700, C.amber), fontSize: 11 }}>¥340k / ¥500k</span>
                </div>
              </div>

              {/* Recent expenses */}
              {[
                { icon: "🍜", label: "Ramen dinner",  amt: "¥2,800",  color: C.orange },
                { icon: "🚇", label: "Metro pass",    amt: "¥1,200",  color: C.teal   },
                { icon: "🏨", label: "Hotel night",   amt: "¥15,000", color: C.amber  },
              ].map(({ icon, label, amt, color }, i) => {
                const rowOp = interpolate(frame, [78 + i * 9, 94 + i * 9], [0, 1], ec);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: i < 2 ? `1px solid ${C.cardHi}` : "none",
                    opacity: rowOp,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{icon}</span>
                      <span style={{ ...f(14, 600), fontSize: 14 }}>{label}</span>
                    </div>
                    <span style={{ ...f(14, 700, color), fontSize: 14 }}>{amt}</span>
                  </div>
                );
              })}
            </div>
          </AbsoluteFill>
        </Phone>
      </div>

      {/* Title below phone */}
      <div style={{
        position: "absolute", bottom: 72, width: "100%", textAlign: "center",
        opacity: titleOp,
        transform: `scale(${titleSc})`,
        padding: "0 60px",
      }}>
        <div style={{ ...f(62, 800, C.amber) }}>KeepTrip</div>
        <div style={{ ...f(38, 700) }}>Smart Trip Budget</div>
        <div style={{ ...f(28, 500, `${C.white}65`), marginTop: 10 }}>
          Your ultimate pocket travel treasurer!
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3 · Offline + Multi-Currency  10-20 s ─────────────────────────────
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp     = interpolate(frame, [0, 16], [0, 1], ec);
  // Offline phase 0-150
  const planeX   = interpolate(frame, [0, 65], [-380, 0], { ...ec, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const planeOp  = interpolate(frame, [0, 20], [0, 1], ec);
  const wifiBdge = spring({ frame: frame - 55, fps, config: { damping: 14, stiffness: 80 } });
  const plusSc   = spring({ frame: frame - 85, fps, config: { damping: 12, stiffness: 100 } });
  const offSc    = spring({ frame: frame - 115, fps, config: { damping: 10, stiffness: 90 } });
  const lbl1Op   = interpolate(frame, [20, 38], [0, 1], ec);

  // Currency phase 150-300
  const currencies = [
    { code: "USD", symbol: "$",  amount: "100.00",     flag: "🇺🇸" },
    { code: "EUR", symbol: "€",  amount: "93.20",      flag: "🇪🇺" },
    { code: "IDR", symbol: "Rp", amount: "1,583,000",  flag: "🇮🇩" },
  ];
  const currIdx = Math.min(2, Math.floor(interpolate(frame, [175, 275], [0, 3], ec)));
  const curr    = currencies[currIdx];
  const crdOp   = interpolate(frame, [155, 178], [0, 1], ec);
  const lbl2Op  = interpolate(frame, [155, 175], [0, 1], ec);
  const lbl3Op  = interpolate(frame, [250, 270], [0, 1], ec);

  const featureBadges = [
    { text: "Log Expenses in Seconds", icon: "⚡" },
    { text: "Multi-Currency Support",  icon: "💱" },
    { text: "100% Full Offline",       icon: "📵" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: bgOp }}>
      {/* SFX */}
      <Sequence from={0}   durationInFrames={20}><Audio src="https://remotion.media/whoosh.wav"      volume={0.5} /></Sequence>
      <Sequence from={85}  durationInFrames={10}><Audio src="https://remotion.media/mouse-click.wav" volume={0.55} /></Sequence>
      <Sequence from={160} durationInFrames={12}><Audio src="https://remotion.media/switch.wav"      volume={0.65} /></Sequence>
      <Sequence from={193} durationInFrames={12}><Audio src="https://remotion.media/switch.wav"      volume={0.65} /></Sequence>
      <Sequence from={226} durationInFrames={12}><Audio src="https://remotion.media/switch.wav"      volume={0.65} /></Sequence>

      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 90% 60% at 50% 50%, #1A3050 0%, transparent 70%)",
      }} />
      <Blob x={-100} y={300}  size={650} color={C.teal}   frame={frame} />
      <Blob x={600}  y={-50}  size={580} color={C.orange} frame={frame} phase={1.8} />

      {/* ── PHASE 1: Offline ── */}
      <Sequence durationInFrames={150}>
        {/* Airplane */}
        <div style={{
          position: "absolute", top: "18%", left: "50%",
          transform: `translate(calc(-50% + ${planeX}px), 0)`,
          opacity: planeOp, fontSize: 130, lineHeight: 1,
          filter: `drop-shadow(0 0 32px ${C.teal}60)`,
        }}>✈️</div>

        {/* No-Wi-Fi badge */}
        <div style={{
          position: "absolute", top: "27%", right: 52,
          transform: `scale(${wifiBdge})`,
          backgroundColor: `${C.red}1A`,
          border: `2px solid ${C.red}`,
          borderRadius: 20, padding: "16px 26px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 38 }}>📵</span>
          <div>
            <div style={{ ...f(26, 700, C.red) }}>No Wi-Fi</div>
            <div style={{ ...f(18, 500, `${C.white}70`) }}>No Signal</div>
          </div>
        </div>

        {/* "+" tap FAB */}
        <div style={{
          position: "absolute", top: "54%", left: "50%",
          transform: `translate(-50%, -50%) scale(${plusSc})`,
        }}>
          <div style={{
            width: 110, height: 110, backgroundColor: C.amber,
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            ...f(66, 400, C.bg), boxShadow: `0 10px 44px ${C.amber}70`,
          }}>+</div>
        </div>

        {/* 100% Offline badge stamp */}
        <div style={{
          position: "absolute", top: "71%", left: "50%",
          transform: `translate(-50%, -50%) scale(${offSc}) rotate(-3deg)`,
        }}>
          <div style={{
            backgroundColor: `${C.green}1A`, border: `3px solid ${C.green}`,
            borderRadius: 22, padding: "20px 48px", textAlign: "center",
            boxShadow: `0 0 56px ${C.green}40`,
          }}>
            <div style={{ ...f(22, 600, `${C.white}80`), marginBottom: 4 }}>✓ WORKS EVERYWHERE</div>
            <div style={{ ...f(50, 800, C.green) }}>100% Offline</div>
            <div style={{ ...f(20, 600, `${C.white}60`), marginTop: 4 }}>No Cell Service Needed</div>
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 100, width: "100%", textAlign: "center",
          opacity: lbl1Op, ...f(34, 600, `${C.white}80`),
        }}>
          Log expenses anywhere — even offline
        </div>
      </Sequence>

      {/* ── PHASE 2: Multi-Currency ── */}
      <Sequence from={150} durationInFrames={150}>
        <AbsoluteFill>
          <div style={{
            position: "absolute", top: "10%", width: "100%", textAlign: "center",
            opacity: lbl2Op,
          }}>
            <div style={{ ...f(78, 800) }}>Multi-Currency</div>
            <div style={{ ...f(40, 600, `${C.white}65`), marginTop: 6 }}>Support</div>
          </div>

          {/* Currency toggle card */}
          <div style={{
            position: "absolute", top: "42%", left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: C.card, borderRadius: 32, padding: "44px 64px",
            boxShadow: "0 28px 90px rgba(0,0,0,0.65)",
            border: `1px solid ${C.cardHi}`,
            textAlign: "center", minWidth: 750,
            opacity: crdOp,
          }}>
            <div style={{ ...f(120, 800, C.amber), lineHeight: 1, marginBottom: 14 }}>
              {curr.symbol} {curr.amount}
            </div>
            <div style={{ ...f(32, 600, `${C.white}55`), marginBottom: 32 }}>
              {curr.flag} {curr.code}
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              {currencies.map(({ code, flag }, i) => {
                const active = i === currIdx;
                return (
                  <div key={code} style={{
                    backgroundColor: active ? `${C.amber}22` : C.bgMid,
                    border: `2px solid ${active ? C.amber : C.cardHi}`,
                    borderRadius: 18, padding: "13px 26px",
                    ...f(24, active ? 700 : 500, active ? C.amber : `${C.white}50`),
                  }}>
                    {flag} {code}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            position: "absolute", bottom: 100, width: "100%", textAlign: "center",
            opacity: lbl3Op,
          }}>
            <div style={{ ...f(40, 700, C.teal) }}>Instant Auto-Conversion</div>
            <div style={{ ...f(26, 500, `${C.white}60`), marginTop: 8 }}>Anytime, Anywhere</div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Feature badges */}
      <div style={{
        position: "absolute", bottom: 30, left: "50%",
        transform: "translateX(-50%)",
        display: "flex", gap: 18, whiteSpace: "nowrap",
      }}>
        {featureBadges.map(({ text, icon }, i) => (
          <div key={i} style={{
            opacity: interpolate(frame, [14 + i * 8, 30 + i * 8], [0, 1], ec),
            backgroundColor: `${C.white}0D`, borderRadius: 16, padding: "11px 20px",
            border: `1px solid ${C.white}18`,
            display: "flex", alignItems: "center", gap: 9,
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ ...f(19, 600) }}>{text}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4 · Category Budgeting + Alert  20-28 s ───────────────────────────
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp   = interpolate(frame, [0, 16], [0, 1], ec);
  const titleOp = interpolate(frame, [0, 22], [0, 1], ec);

  const categories = [
    { label: "Food",          icon: "🍕", color: C.orange,  pct: 35, fillPct: 88, budget: "¥120k" },
    { label: "Transport",     icon: "✈️", color: C.teal,   pct: 24, fillPct: 60, budget: "¥80k"  },
    { label: "Accommodation", icon: "🏨", color: C.amber,  pct: 25, fillPct: 72, budget: "¥85k"  },
    { label: "Shopping",      icon: "🛍️", color: C.pink,   pct: 16, fillPct: 91, budget: "¥50k"  },
  ];

  // Pie chart
  const pieP = interpolate(frame, [22, 110], [0, 1], { ...ec, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const CX = 270, CY = 270, OR = 210, IR = 115;

  // Compute cumulative angles once
  const slices = (() => {
    let angle = -90;
    return categories.map(cat => {
      const start = angle;
      angle += cat.pct * 3.6;
      return { ...cat, startAngle: start, endAngle: angle };
    });
  })();

  const toRad  = (deg: number) => (deg * Math.PI) / 180;
  const ptOuter = (a: number) => [CX + OR * Math.cos(toRad(a)), CY + OR * Math.sin(toRad(a))] as const;
  const ptInner = (a: number) => [CX + IR * Math.cos(toRad(a)), CY + IR * Math.sin(toRad(a))] as const;

  // Warning
  const warnSpring = spring({ frame: frame - 175, fps, config: { damping: 12, stiffness: 80 } });
  const warnY = interpolate(warnSpring, [0, 1], [-280, 0]);
  const ctaOp = interpolate(frame, [200, 220], [0, 1], ec);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, opacity: bgOp }}>
      {/* SFX */}
      <Sequence from={0}   durationInFrames={20}><Audio src="https://remotion.media/whoosh.wav" volume={0.45} /></Sequence>
      <Sequence from={175} durationInFrames={16}><Audio src="https://remotion.media/ding.wav"  volume={0.75} /></Sequence>

      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1E2D50 0%, transparent 70%)",
      }} />
      <Blob x={-100} y={100}  size={600} color={C.teal}   frame={frame} />
      <Blob x={560}  y={600}  size={550} color={C.orange} frame={frame} phase={2.5} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 60, width: "100%", textAlign: "center",
        opacity: titleOp,
      }}>
        <div style={{ ...f(72, 800) }}>Category-Based</div>
        <div style={{ ...f(72, 800, C.teal) }}>Budgeting</div>
      </div>

      {/* Pie chart */}
      <div style={{ position: "absolute", top: "24%", left: "50%", transform: "translateX(-50%)" }}>
        <svg width={540} height={540} viewBox="0 0 540 540">
          <circle cx={CX} cy={CY} r={IR} fill={C.card} />
          {slices.map(({ color, startAngle, endAngle, pct }, i) => {
            const animEnd = startAngle + (endAngle - startAngle) * pieP;
            if (animEnd <= startAngle) return null;
            const large = (animEnd - startAngle) > 180 ? 1 : 0;
            const [x1, y1] = ptOuter(startAngle);
            const [x2, y2] = ptOuter(animEnd);
            const [xi1, yi1] = ptInner(startAngle);
            const [xi2, yi2] = ptInner(animEnd);
            return (
              <path key={i}
                d={`M ${xi1} ${yi1} L ${x1} ${y1} A ${OR} ${OR} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${IR} ${IR} 0 ${large} 0 ${xi1} ${yi1} Z`}
                fill={color} opacity={0.9}
              />
            );
          })}
          {/* Inner labels */}
          <text x={CX} y={CY - 16} textAnchor="middle" fill={C.amber}
            style={{ fontFamily, fontSize: 30, fontWeight: 800 }}>Budget</text>
          <text x={CX} y={CY + 18} textAnchor="middle" fill={`${C.white}60`}
            style={{ fontFamily, fontSize: 18 }}>Overview</text>
        </svg>
      </div>

      {/* Progress bars */}
      <div style={{
        position: "absolute", top: "62%", left: 44, right: 44,
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        {categories.map(({ label, icon, color, fillPct }, i) => {
          const barW  = interpolate(frame, [55 + i * 12, 98 + i * 12], [0, fillPct], ec);
          const rowOp = interpolate(frame, [46 + i * 10, 65 + i * 10], [0, 1], ec);
          const near  = fillPct > 85;
          return (
            <div key={i} style={{ opacity: rowOp }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{icon}</span>
                  <span style={{ ...f(26, 600) }}>{label}</span>
                </div>
                <span style={{ ...f(24, 700, color) }}>{Math.round(barW)}%</span>
              </div>
              <div style={{
                backgroundColor: C.card, borderRadius: 7, height: 14, overflow: "hidden",
                border: near && frame > 130 ? `1px solid ${color}55` : "none",
              }}>
                <div style={{
                  width: `${barW}%`, height: "100%", backgroundColor: color, borderRadius: 7,
                  boxShadow: near && frame > 130 ? `0 0 14px ${color}80` : "none",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget alert notification */}
      <div style={{
        position: "absolute", top: 128, left: 44, right: 44,
        transform: `translateY(${warnY}px)`,
        backgroundColor: `${C.pink}1A`,
        border: `2px solid ${C.pink}`,
        borderRadius: 24, padding: "22px 30px",
        display: "flex", alignItems: "center", gap: 20,
        boxShadow: `0 14px 44px ${C.pink}30`,
      }}>
        <span style={{ fontSize: 44 }}>⚠️</span>
        <div>
          <div style={{ ...f(28, 800, C.pink) }}>Budget Alert!</div>
          <div style={{ ...f(22, 500, `${C.white}80`) }}>Careful! Approaching Shopping Budget</div>
        </div>
      </div>

      {/* CTA text */}
      <div style={{
        position: "absolute", bottom: 50, width: "100%", textAlign: "center",
        opacity: ctaOp,
      }}>
        <div style={{ ...f(38, 700) }}>Set limits. Get instant alerts.</div>
        <div style={{ ...f(30, 600, C.green), marginTop: 10 }}>Never Overspend Again ✓</div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5 · Trip Wrapped  28-38 s ─────────────────────────────────────────
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp       = interpolate(frame, [0, 18], [0, 1], ec);
  const rotY       = interpolate(frame, [0, 65], [88, 0], { ...ec, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });
  const cardOp     = interpolate(frame, [58, 82], [0, 1], ec);
  const badge1Sc   = spring({ frame: frame - 88, fps, config: { damping: 10, stiffness: 120 } });
  const badge2Sc   = spring({ frame: frame - 110, fps, config: { damping: 10, stiffness: 120 } });
  const swipeX     = interpolate(frame, [175, 228], [0, -680], { ...ec, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const shareOp    = interpolate(frame, [210, 230], [0, 1], ec);
  const titleOp    = interpolate(frame, [0, 22], [0, 1], ec);
  const bottomOp   = interpolate(frame, [62, 80], [0, 1], ec);

  const hearts = [
    { x: -230, delay: 218 }, { x: 160, delay: 228 }, { x: -90, delay: 238 },
    { x: 240, delay: 223 }, { x: -170, delay: 233 },
  ];

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(155deg, #1A0A36 0%, #0D2040 50%, #0A1A2A 100%)",
      opacity: bgOp,
    }}>
      {/* SFX */}
      <Sequence from={0}   durationInFrames={22}><Audio src="https://remotion.media/whip.wav"               volume={0.5} /></Sequence>
      <Sequence from={68}  durationInFrames={15}><Audio src="https://remotion.media/ding.wav"               volume={0.55} /></Sequence>
      <Sequence from={88}  durationInFrames={12}><Audio src="https://remotion.media/mouse-click.wav"        volume={0.5} /></Sequence>
      <Sequence from={170} durationInFrames={16}><Audio src="https://remotion.media/shutter-modern.wav"     volume={0.62} /></Sequence>
      <Sequence from={208} durationInFrames={22}><Audio src="https://remotion.media/snapchat-notification.wav" volume={0.5} /></Sequence>

      {/* Stars */}
      {[...Array(18)].map((_, i) => {
        const sx  = (i * 77 + 55) % 1000;
        const sy  = (i * 141 + 90) % 1820;
        const sOp = 0.25 + Math.sin(frame * 0.06 + i * 0.7) * 0.2;
        return (
          <div key={i} style={{
            position: "absolute", left: sx, top: sy,
            width: i % 3 === 0 ? 5 : 3, height: i % 3 === 0 ? 5 : 3,
            borderRadius: "50%", backgroundColor: C.amber, opacity: sOp,
          }} />
        );
      })}

      {/* Ambient blobs */}
      <Blob x={-100} y={300}  size={700} color={C.purple} frame={frame} />
      <Blob x={550}  y={-100} size={600} color={C.teal}   frame={frame} phase={2.2} />

      {/* Title */}
      <div style={{
        position: "absolute", top: 70, width: "100%", textAlign: "center",
        opacity: titleOp,
      }}>
        <div style={{ ...f(60, 800, C.amber) }}>✨ Trip Wrapped</div>
        <div style={{ ...f(30, 500, `${C.white}65`), marginTop: 10 }}>Your personalized travel recap</div>
      </div>

      {/* 3D rotating phone */}
      <div style={{
        position: "absolute", top: "17%", left: "50%",
        transform: `translateX(-50%) perspective(1300px) rotateY(${rotY}deg)`,
      }}>
        <Phone width={355}>
          <AbsoluteFill style={{
            background: "linear-gradient(158deg, #2A0A52 0%, #1A2B4A 50%, #0A1A30 100%)",
            opacity: cardOp,
          }}>
            <div style={{ padding: "50px 22px 18px", textAlign: "center" }}>
              <div style={{
                display: "inline-block", border: `2px solid ${C.amber}`,
                borderRadius: 10, padding: "6px 18px", marginBottom: 14,
              }}>
                <span style={{ ...f(14, 700, C.amber), fontSize: 14, letterSpacing: 4 }}>2025 WRAPPED</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 5 }}>
                <KeepTripLogo size={34} />
                <span style={{ ...f(26, 800, C.amber), fontSize: 26 }}>Tokyo Trip</span>
              </div>
              <div style={{ ...f(12, 500, `${C.white}50`), fontSize: 12 }}>Mar 10 – 20, 2025</div>
            </div>

            <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Total Spent",     value: "¥340,000", icon: "💰", color: C.amber  },
                { label: "Days Traveled",   value: "10 days",  icon: "📅", color: C.teal   },
                { label: "Expenses Logged", value: "42 items", icon: "📝", color: C.orange },
                { label: "Saved vs Budget", value: "¥160,000", icon: "🎉", color: C.green  },
              ].map(({ label, value, icon, color }, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  backgroundColor: `${color}10`, borderRadius: 12, padding: "11px 14px",
                  border: `1px solid ${color}22`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 19 }}>{icon}</span>
                    <span style={{ ...f(12, 600, `${C.white}70`), fontSize: 12 }}>{label}</span>
                  </div>
                  <span style={{ ...f(14, 800, color), fontSize: 14 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Pop badges */}
            <div style={{
              position: "absolute", top: 118, right: -22,
              transform: `scale(${badge1Sc}) rotate(8deg)`,
              backgroundColor: "#FFD700", borderRadius: 16, padding: "8px 14px",
              boxShadow: "0 6px 24px rgba(255,215,0,0.55)",
            }}>
              <span style={{ ...f(15, 800, "#000"), fontSize: 15 }}>👑 Budget King</span>
            </div>
            <div style={{
              position: "absolute", bottom: 200, left: -22,
              transform: `scale(${badge2Sc}) rotate(-6deg)`,
              backgroundColor: C.orange, borderRadius: 16, padding: "8px 14px",
              boxShadow: `0 6px 24px ${C.orange}70`,
            }}>
              <span style={{ ...f(15, 800, C.white), fontSize: 15 }}>🌮 Top: Food</span>
            </div>
          </AbsoluteFill>
        </Phone>
      </div>

      {/* Share swipe */}
      <div style={{
        position: "absolute", bottom: "16%", left: "50%",
        transform: `translate(calc(-50% + ${swipeX}px), 0)`,
        display: "flex", gap: 18, alignItems: "center",
      }}>
        <div style={{
          backgroundColor: C.card, border: `2px solid ${C.purple}`,
          borderRadius: 24, padding: "18px 34px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <span style={{ fontSize: 34 }}>📸</span>
          <div>
            <div style={{ ...f(22, 700) }}>Share to</div>
            <div style={{ ...f(17, 600, C.purple) }}>Instagram · TikTok</div>
          </div>
        </div>
        <div style={{ ...f(30, 700, `${C.white}50`) }}>→</div>
      </div>

      {/* Story ready */}
      <div style={{
        position: "absolute", bottom: "12%", right: 55,
        opacity: shareOp,
        backgroundColor: `${C.purple}1A`, border: `2px solid ${C.purple}`,
        borderRadius: 22, padding: "14px 28px",
      }}>
        <div style={{ ...f(20, 700) }}>📱 Story Ready!</div>
        <div style={{ ...f(15, 500, `${C.white}60`) }}>Tap to share</div>
      </div>

      {/* Floating hearts */}
      {hearts.map(({ x, delay }, i) => {
        const hy  = interpolate(frame, [delay, delay + 85], [0, -520], ec);
        const hOp = interpolate(frame, [delay, delay + 22, delay + 75, delay + 85], [0, 1, 0.8, 0], ec);
        return (
          <div key={i} style={{
            position: "absolute", bottom: "18%", left: "50%",
            transform: `translate(calc(-50% + ${x}px), ${hy}px)`,
            opacity: hOp, fontSize: 34,
          }}>
            {["❤️","🧡","💛","💚","💙"][i]}
          </div>
        );
      })}

      {/* Bottom text */}
      <div style={{
        position: "absolute", bottom: 42, width: "100%", textAlign: "center",
        opacity: bottomOp,
      }}>
        <div style={{ ...f(34, 700) }}>Share Ready-to-Post Templates</div>
        <div style={{ ...f(24, 500, `${C.white}60`), marginTop: 7 }}>Instagram · TikTok · Twitter</div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 6 · CTA  38-45 s ───────────────────────────────────────────────────
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOp      = interpolate(frame, [0, 18], [0, 1], ec);
  const logoSc    = spring({ frame: frame - 16, fps, config: { damping: 14, stiffness: 60 } });
  const tagOp     = interpolate(frame, [36, 56], [0, 1], ec);
  const badgeSc   = spring({ frame: frame - 72, fps, config: { damping: 12, stiffness: 80 } });
  const badgeY    = interpolate(badgeSc, [0, 1], [160, 0]);
  const badgeOp   = interpolate(badgeSc, [0, 1], [0, 1]);
  const noRegSc   = spring({ frame: frame - 96, fps, config: { damping: 10, stiffness: 120 } });
  const noRegOp   = interpolate(frame, [96, 115], [0, 1], ec);
  const burstP    = interpolate(frame, [14, 82], [0, 1], ec);
  const ringScale = 1 + Math.sin(frame * 0.08) * 0.035;
  const fadeOut   = interpolate(frame, [190, 210], [0, 1], ec);

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(160deg, #0D1B3A 0%, #0A2535 42%, #112030 100%)",
      opacity: bgOp,
    }}>
      {/* SFX */}
      <Sequence from={0}  durationInFrames={20}><Audio src="https://remotion.media/whoosh.wav" volume={0.4} /></Sequence>
      <Sequence from={72} durationInFrames={18}><Audio src="https://remotion.media/ding.wav"  volume={0.7} /></Sequence>
      <Sequence from={96} durationInFrames={18}><Audio src="https://remotion.media/yippee.wav" volume={0.45} /></Sequence>

      {/* Radial rays */}
      <AbsoluteFill style={{ opacity: 0.07 }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920">
          {[...Array(18)].map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return (
              <line key={i} x1={540} y1={900}
                x2={540 + Math.cos(a) * 1250} y2={900 + Math.sin(a) * 1250}
                stroke={C.amber} strokeWidth={2} />
            );
          })}
        </svg>
      </AbsoluteFill>

      {/* Ambient blobs */}
      <Blob x={-120} y={200}  size={700} color={C.teal}   frame={frame} />
      <Blob x={580}  y={1000} size={600} color={C.orange} frame={frame} phase={1.9} />

      {/* Particle burst */}
      {[...Array(22)].map((_, i) => {
        const a   = (i / 22) * Math.PI * 2;
        const r   = burstP * 440;
        const px  = Math.cos(a) * r;
        const py  = Math.sin(a) * r;
        const pOp = interpolate(burstP, [0, 0.22, 1], [0, 1, 0]);
        return (
          <div key={i} style={{
            position: "absolute", top: "44%", left: "50%",
            width: i % 4 === 0 ? 16 : 9, height: i % 4 === 0 ? 16 : 9,
            borderRadius: "50%",
            backgroundColor: [C.amber, C.orange, C.teal, C.white][i % 4],
            opacity: pOp,
            transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
          }} />
        );
      })}

      {/* Pulse ring */}
      <div style={{
        position: "absolute", top: "44%", left: "50%",
        width: 240, height: 240, borderRadius: "50%",
        transform: `translate(-50%, -50%) scale(${ringScale})`,
        border: `2px solid ${C.amber}28`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "44%", left: "50%",
        width: 320, height: 320, borderRadius: "50%",
        transform: `translate(-50%, -50%) scale(${ringScale * 0.95})`,
        border: `1px solid ${C.amber}12`,
        pointerEvents: "none",
      }} />

      {/* Logo block */}
      <div style={{
        position: "absolute", top: "44%", left: "50%",
        transform: `translate(-50%, -50%) scale(${logoSc})`,
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
      }}>
        <KeepTripLogo size={140} animated frame={Math.max(0, frame - 14)} />
        <div style={{ ...f(100, 800, C.amber), letterSpacing: -3 }}>KeepTrip</div>
        <div style={{ ...f(36, 600, `${C.white}75`) }}>Smart Trip Budget</div>
      </div>

      {/* Tagline */}
      <div style={{
        position: "absolute", top: "68%", width: "100%", textAlign: "center",
        opacity: tagOp,
      }}>
        <div style={{ ...f(54, 800) }}>Travel More,</div>
        <div style={{ ...f(54, 800, C.teal) }}>Worry Less.</div>
      </div>

      {/* Google Play badge */}
      <div style={{
        position: "absolute", bottom: 160, left: "50%",
        transform: `translateX(-50%) translateY(${badgeY}px)`,
        opacity: badgeOp,
      }}>
        <div style={{
          backgroundColor: C.card, border: `2px solid ${C.amber}`,
          borderRadius: 30, padding: "26px 65px",
          display: "flex", alignItems: "center", gap: 24,
          boxShadow: `0 18px 65px ${C.amber}30`,
          whiteSpace: "nowrap",
        }}>
          <span style={{ fontSize: 62 }}>▶</span>
          <div>
            <div style={{ ...f(20, 500, `${C.white}65`) }}>Download on</div>
            <div style={{ ...f(42, 800) }}>Google Play</div>
          </div>
        </div>
      </div>

      {/* No Registration badge */}
      <div style={{
        position: "absolute", bottom: 82, left: "50%",
        transform: `translateX(-50%) scale(${noRegSc})`,
        opacity: noRegOp,
        whiteSpace: "nowrap",
      }}>
        <div style={{
          backgroundColor: `${C.green}16`, border: `2px solid ${C.green}`,
          borderRadius: 20, padding: "13px 34px",
          display: "flex", alignItems: "center", gap: 13,
        }}>
          <span style={{ fontSize: 26 }}>✓</span>
          <span style={{ ...f(26, 700, C.green) }}>No Registration Required!</span>
        </div>
      </div>

      {/* Subtitle */}
      <div style={{
        position: "absolute", bottom: 28, width: "100%", textAlign: "center",
        opacity: interpolate(frame, [115, 135], [0, 1], ec),
        ...f(24, 500, `${C.white}55`),
      }}>
        Start Instantly · Free Download
      </div>

      {/* Fade to black */}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// ─── Subtitle Overlay ────────────────────────────────────────────────────────
type SWord = { text: string; bold?: boolean };
type SubLine = { words: SWord[]; from: number; to: number };

const SUBTITLES: SubLine[] = [
  // Scene 1  (global 0-150)
  { from:  18, to:  72, words: [
    { text: "Love " },
    { text: "traveling,", bold: true },
  ]},
  { from:  65, to: 145, words: [
    { text: "but hate " },
    { text: "losing track", bold: true },
    { text: " of your " },
    { text: "money?", bold: true },
  ]},

  // Scene 2  (global 150-300)
  { from: 165, to: 232, words: [
    { text: "Meet " },
    { text: "KeepTrip", bold: true },
    { text: " —" },
  ]},
  { from: 218, to: 297, words: [
    { text: "your ultimate " },
    { text: "pocket travel treasurer!", bold: true },
  ]},

  // Scene 3  (global 300-600)
  { from: 318, to: 383, words: [
    { text: "Log your expenses " },
    { text: "in seconds,", bold: true },
  ]},
  { from: 370, to: 436, words: [
    { text: "in " },
    { text: "any currency", bold: true },
    { text: " —" },
  ]},
  { from: 422, to: 495, words: [
    { text: "anytime,", bold: true },
    { text: " anywhere.", bold: true },
  ]},
  { from: 460, to: 540, words: [
    { text: "Even " },
    { text: "100% offline", bold: true },
  ]},
  { from: 514, to: 596, words: [
    { text: "with no " },
    { text: "cell service!", bold: true },
  ]},

  // Scene 4  (global 600-840)
  { from: 618, to: 692, words: [
    { text: "Set " },
    { text: "custom limits", bold: true },
    { text: " for food, transport & shopping." },
  ]},
  { from: 675, to: 754, words: [
    { text: "Get " },
    { text: "instant visual alerts", bold: true },
  ]},
  { from: 736, to: 836, words: [
    { text: "so you " },
    { text: "stay on track!", bold: true },
  ]},

  // Scene 5  (global 840-1140)
  { from: 858, to: 926, words: [
    { text: "Trip over?", bold: true },
  ]},
  { from: 910, to: 994, words: [
    { text: "Get your personalized " },
    { text: "'Trip Wrapped'", bold: true },
    { text: " infographic" },
  ]},
  { from: 976, to: 1068, words: [
    { text: "and " },
    { text: "share", bold: true },
    { text: " your travel stats with friends!" },
  ]},

  // Scene 6  (global 1140-1350)
  { from: 1158, to: 1230, words: [
    { text: "Travel more,", bold: true },
    { text: " worry less." },
  ]},
  { from: 1215, to: 1292, words: [
    { text: "Download " },
    { text: "KeepTrip", bold: true },
    { text: " today" },
  ]},
  { from: 1274, to: 1346, words: [
    { text: "on " },
    { text: "Google Play!", bold: true },
  ]},
];

const SubtitleOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {SUBTITLES.map((line, li) => {
        if (frame < line.from - 2 || frame > line.to + 2) return null;

        const inP  = interpolate(frame, [line.from, line.from + 14], [0, 1], ec);
        const outP = interpolate(frame, [line.to - 10, line.to],     [1, 0], ec);
        const op   = inP * outP;
        const ty   = interpolate(inP, [0, 1], [30, 0]);

        return (
          <div key={li} style={{
            position: "absolute",
            bottom: 118,
            left: 40, right: 40,
            textAlign: "center",
            opacity: op,
            transform: `translateY(${ty}px)`,
          }}>
            {/* Frosted pill background */}
            <div style={{
              display: "inline-flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "baseline",
              backgroundColor: "rgba(8, 14, 26, 0.80)",
              borderRadius: 22,
              padding: "13px 30px",
              gap: 0,
            }}>
              {line.words.map((w, wi) => {
                if (!w.bold) {
                  return (
                    <span key={wi} style={{
                      fontFamily, fontSize: 40, fontWeight: 600,
                      color: `${C.white}EE`,
                      textShadow: "0 1px 8px rgba(0,0,0,0.9)",
                      letterSpacing: 0.3,
                    }}>
                      {w.text}
                    </span>
                  );
                }

                // Bold word: amber + scale pop + animated underline sweep
                const wordSc  = interpolate(frame, [line.from, line.from + 14], [0.86, 1.0], ec);
                const sweepW  = interpolate(frame, [line.from + 10, line.from + 25], [0, 100], ec);

                return (
                  <span key={wi} style={{
                    position: "relative",
                    display: "inline-block",
                    transform: `scale(${wordSc})`,
                    transformOrigin: "bottom center",
                  }}>
                    {/* Amber glow text */}
                    <span style={{
                      fontFamily, fontSize: 46, fontWeight: 800,
                      color: C.amber,
                      textShadow: `0 0 28px ${C.amber}70, 0 1px 8px rgba(0,0,0,0.9)`,
                      letterSpacing: 0.2,
                    }}>
                      {w.text}
                    </span>
                    {/* Underline that sweeps left → right */}
                    <div style={{
                      position: "absolute",
                      bottom: -3, left: 0,
                      height: 3,
                      width: `${sweepW}%`,
                      background: `linear-gradient(90deg, ${C.amber}, ${C.teal})`,
                      borderRadius: 3,
                    }} />
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Composition  45 s = 1350 frames @30 fps ─────────────────────────────────
// S1=150 S2=150 S3=300 S4=240 S5=300 S6=210
export const KeepTripAdVideo: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={150}><Scene1 /></Sequence>
    <Sequence from={150}  durationInFrames={150}><Scene2 /></Sequence>
    <Sequence from={300}  durationInFrames={300}><Scene3 /></Sequence>
    <Sequence from={600}  durationInFrames={240}><Scene4 /></Sequence>
    <Sequence from={840}  durationInFrames={300}><Scene5 /></Sequence>
    <Sequence from={1140} durationInFrames={210}><Scene6 /></Sequence>
    <SubtitleOverlay />
  </AbsoluteFill>
);
