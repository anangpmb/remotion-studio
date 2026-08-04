/**
 * SFX Generator — pure Node.js, zero dependencies
 * Generates WAV files for the KeepTrip motion graphic.
 * Run: node scripts/generate-sfx.js
 */

const fs   = require("fs");
const path = require("path");

const SR = 44100; // sample rate

// ─── WAV writer ───────────────────────────────────────────────────────────────
function makeWav(samples) {
  const n  = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF",   0, "ascii");
  buf.writeUInt32LE(36 + n * 2,  4);
  buf.write("WAVE",   8, "ascii");
  buf.write("fmt ",  12, "ascii");
  buf.writeUInt32LE(16,         16);
  buf.writeUInt16LE(1,          20);  // PCM
  buf.writeUInt16LE(1,          22);  // mono
  buf.writeUInt32LE(SR,         24);
  buf.writeUInt32LE(SR * 2,     28);  // byte-rate
  buf.writeUInt16LE(2,          32);  // block align
  buf.writeUInt16LE(16,         34);  // bits per sample
  buf.write("data",  36, "ascii");
  buf.writeUInt32LE(n * 2,      40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

// ─── Utility ──────────────────────────────────────────────────────────────────
const pi2 = Math.PI * 2;

/** ADSR envelope value at time t (seconds) */
function adsr(t, a, d, s, r, dur) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  const rt = t - (dur - r);
  return s * Math.max(0, 1 - rt / r);
}

/** Fast exp decay */
const exp = (t, k) => Math.exp(-t * k);

// ─── SFX definitions ─────────────────────────────────────────────────────────

/** 1. logo_draw — rising tone as the K is drawn (2.2 s) */
function logoDrawSfx() {
  const dur = 2.2;
  const n   = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Pitch glide D4 → A5
    const freq = 293.66 * Math.pow(880 / 293.66, t / dur);
    const env  = adsr(t, 0.04, 0.15, 0.6, 0.4, dur);
    // Sine + soft octave harmonic
    out[i] = (Math.sin(pi2 * freq * t) * 0.6
            + Math.sin(pi2 * freq * 2 * t) * 0.2
            + Math.sin(pi2 * freq * 3 * t) * 0.06) * env * 0.55;
  }
  return out;
}

/** 2. scene_whoosh — 0.55 s filtered swoosh */
function sceneWhooshSfx() {
  const dur = 0.55;
  const n   = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t    = i / SR;
    const env  = adsr(t, 0.02, 0.08, 0.2, 0.15, dur);
    const noise = Math.random() * 2 - 1;
    const co   = 0.03 + 0.22 * (1 - t / dur);   // cutoff falls
    lp = lp + co * (noise - lp);                 // 1-pole LP
    const tone = Math.sin(pi2 * (180 + 700 * (t / dur)) * t);
    out[i] = (lp * 0.45 + tone * 0.25) * env * 0.75;
  }
  return out;
}

/** 3. expense_tap — soft percussive click (0.12 s) */
function expenseTapSfx() {
  const dur = 0.12;
  const n   = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t   = i / SR;
    const env = exp(t, 45);
    const freq = Math.max(160, 900 - t * 5000);
    out[i] = (Math.sin(pi2 * freq * t) * 0.7
            + (Math.random() * 2 - 1) * 0.08) * env * 0.55;
  }
  return out;
}

/** 4. ding_success — C-major arpeggio chime (1.1 s) */
function dingSuccessSfx() {
  const dur    = 1.1;
  const n      = Math.floor(SR * dur);
  const out    = new Float32Array(n);
  const notes  = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const starts = [0, 0.07, 0.14, 0.22];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (let ni = 0; ni < notes.length; ni++) {
      const nt = t - starts[ni];
      if (nt < 0) continue;
      const env = exp(nt, 3.5) * 0.22;
      s += Math.sin(pi2 * notes[ni] * nt) * env;
      s += Math.sin(pi2 * notes[ni] * 2 * nt) * env * 0.2;
    }
    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

/** 5. stat_pop — bouncy frequency-drop pop (0.22 s) */
function statPopSfx() {
  const dur = 0.22;
  const n   = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t   = i / SR;
    const env = exp(t, 14) * 0.75;
    const freq = 440 + 500 * exp(t, 20);
    out[i] = Math.sin(pi2 * freq * t) * env
           + (Math.random() * 2 - 1) * exp(t, 25) * 0.04;
  }
  return out;
}

/** 6. currency_spin — globe rotation shimmer (1.6 s) */
function currencySpinSfx() {
  const dur = 1.6;
  const n   = Math.floor(SR * dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t   = i / SR;
    const env = adsr(t, 0.12, 0.2, 0.35, 0.35, dur);
    // FM shimmer
    const mod  = Math.sin(pi2 * (4 + t * 2) * t) * 180;
    const freq = 280 + mod;
    out[i] = Math.sin(pi2 * freq * t) * env * 0.4
           + Math.sin(pi2 * (freq * 1.5) * t) * env * 0.15;
  }
  return out;
}

/** 7. wrapped_fanfare — triumphant D-major fill (1.8 s) */
function wrappedFanfareSfx() {
  const dur    = 1.8;
  const n      = Math.floor(SR * dur);
  const out    = new Float32Array(n);
  // D4 F#4 A4 D5 F#5
  const freqs  = [293.66, 369.99, 440, 587.33, 739.99];
  const starts = [0, 0.06, 0.12, 0.18, 0.24];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (let fi = 0; fi < freqs.length; fi++) {
      const nt = t - starts[fi];
      if (nt < 0) continue;
      const env = adsr(nt, 0.02, 0.1, 0.5, 0.4, dur - starts[fi]);
      s += Math.sin(pi2 * freqs[fi] * nt) * env * 0.18;
      s += Math.sin(pi2 * freqs[fi] * 2 * nt) * env * 0.06;
    }
    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

// ─── Write files ──────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, "..", "public", "sfx");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sfx = {
  "logo_draw.wav":      logoDrawSfx,
  "scene_whoosh.wav":   sceneWhooshSfx,
  "expense_tap.wav":    expenseTapSfx,
  "ding_success.wav":   dingSuccessSfx,
  "stat_pop.wav":       statPopSfx,
  "currency_spin.wav":  currencySpinSfx,
  "wrapped_fanfare.wav": wrappedFanfareSfx,
};

for (const [fname, gen] of Object.entries(sfx)) {
  const samples = gen();
  const wav     = makeWav(samples);
  fs.writeFileSync(path.join(outDir, fname), wav);
  console.log(`✓  ${fname.padEnd(22)}  ${(wav.length / 1024).toFixed(1).padStart(6)} KB`);
}

console.log("\n✅  All SFX generated → public/sfx/");
