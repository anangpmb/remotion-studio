/**
 * Generates digital-nature themed SFX for KeepTripSplit composition.
 * Synthesizes raw PCM and writes standard 16-bit mono WAV files.
 *
 * Run: node scripts/generate-split-sfx.mjs
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SFX_DIR = join(__dirname, '..', 'public', 'sfx');

const SR = 44100;
const AMP = 26000; // ~79% of 16-bit max — leaves headroom

// ── WAV writer ───────────────────────────────────────────────────────────────
function writeWav(filename, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);            // PCM chunk size
  buf.writeUInt16LE(1, 20);             // PCM format
  buf.writeUInt16LE(1, 22);             // mono
  buf.writeUInt32LE(SR, 24);            // sample rate
  buf.writeUInt32LE(SR * 2, 28);        // byte rate
  buf.writeUInt16LE(2, 32);             // block align
  buf.writeUInt16LE(16, 34);            // bits per sample
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-32767, Math.min(32767, Math.round(samples[i])));
    buf.writeInt16LE(v, 44 + i * 2);
  }

  const dest = join(SFX_DIR, filename);
  writeFileSync(dest, buf);
  console.log(`  ✓  ${filename}  (${(samples.length / SR * 1000).toFixed(0)} ms)`);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Chirp: phase = ∫₀ᵗ [ fExtra·e^(-k·τ) + fBase ] dτ */
function chirpPhase(t, fBase, fExtra, k) {
  return 2 * Math.PI * ((fExtra / k) * (1 - Math.exp(-k * t)) + fBase * t);
}

/** Peak-normalise Float64Array to ±1 */
function normalize(arr) {
  let mx = 0;
  for (let i = 0; i < arr.length; i++) mx = Math.max(mx, Math.abs(arr[i]));
  if (mx === 0) return arr;
  const out = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] / mx;
  return out;
}

// ── Sound generators ─────────────────────────────────────────────────────────

/**
 * water_drop.wav  (0.45 s)
 * Crystal water-drop chirp: starts at ~1820 Hz, falls to ~320 Hz.
 * Adds a faint 2nd harmonic for brightness.
 */
function waterDrop() {
  const n = Math.floor(SR * 0.45);
  const s = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const phi = chirpPhase(t, 320, 1500, 14);
    const env = Math.exp(-t * 8.5);
    const h2  = 0.20 * Math.sin(2 * phi) * Math.exp(-t * 18);
    s[i] = (Math.sin(phi) * env + h2) * AMP * 0.82;
  }
  return s;
}

/**
 * forest_whoosh.wav  (0.65 s)
 * Organic wind-rush: bandpass-filtered white noise + a sub-bass body pulse.
 * Envelope: quick rise, sustained peak, slow fall.
 */
function forestWhoosh() {
  const n = Math.floor(SR * 0.65);

  // White noise
  const raw = new Float64Array(n);
  for (let i = 0; i < n; i++) raw[i] = Math.random() * 2 - 1;

  // Moving-average lowpass (~750 Hz cutoff)
  const lp = new Float64Array(n);
  const M  = Math.floor(SR / 750);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += raw[i];
    if (i >= M) sum -= raw[i - M];
    lp[i] = sum / Math.min(i + 1, M);
  }

  // 1st-order high-pass to kill DC / mud (~100 Hz cutoff at α=0.986)
  const hp = new Float64Array(n);
  const α  = 0.986;
  for (let i = 1; i < n; i++) hp[i] = α * (hp[i - 1] + lp[i] - lp[i - 1]);

  const hpN = normalize(hp);
  const s   = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t   = i / SR;
    const rise = Math.min(t / 0.07, 1.0);
    const fall = t > 0.18 ? Math.exp(-(t - 0.18) * 5.5) : 1.0;
    const env  = rise * fall;
    // Sub-bass thump that fades quickly
    const body = 0.28 * Math.sin(2 * Math.PI * 95 * t) * Math.exp(-t * 7);
    s[i] = (hpN[i] * 0.72 + body) * env * AMP * 0.58;
  }
  return s;
}

/**
 * compute_tick.wav  (0.22 s)
 * Sharp digital relay-click: chirp 1200→260 Hz with soft-clipped distortion.
 */
function computeTick() {
  const n = Math.floor(SR * 0.22);
  const s = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t   = i / SR;
    const phi = chirpPhase(t, 260, 940, 24);
    const env = Math.exp(-t * 30);
    const v   = Math.sin(phi);
    // Soft-clip for digital edge
    const dist = v * (1 + 0.45 * Math.abs(v));
    s[i] = dist * env * AMP * 0.58;
  }
  return s;
}

/**
 * zen_bell.wav  (0.95 s)
 * Digital bell tuned to 528 Hz (solfeggio) with two inharmonic partials.
 * Long, resonant tail — meditative nature feel.
 */
function zenBell() {
  const n  = Math.floor(SR * 0.95);
  const s  = new Float64Array(n);
  const f0 = 528;
  for (let i = 0; i < n; i++) {
    const t      = i / SR;
    const attack = 1 - Math.exp(-t * 220);   // near-instant pop
    const e0 = Math.exp(-t * 2.8);
    const e1 = Math.exp(-t * 4.8);
    const e2 = Math.exp(-t * 9.0);
    s[i] = (
      Math.sin(2 * Math.PI * f0       * t) * e0          +
      0.38 * Math.sin(2 * Math.PI * f0 * 2     * t) * e1 +
      0.15 * Math.sin(2 * Math.PI * f0 * 3.52  * t) * e2   // inharmonic upper partial
    ) * attack * AMP * 0.75;
  }
  return s;
}

/**
 * nature_rise.wav  (1.1 s)
 * Ascending C-E-G-B arpeggio (C5..B5) with bird-vibrato timbre.
 * Each note has two partials and a gentle 5.5 Hz vibrato.
 */
function natureRise() {
  const n     = Math.floor(SR * 1.1);
  const s     = new Float64Array(n);
  const notes = [
    { f: 523.25, t0: 0.00 },   // C5
    { f: 659.25, t0: 0.18 },   // E5
    { f: 783.99, t0: 0.36 },   // G5
    { f: 987.77, t0: 0.54 },   // B5
  ];

  for (let i = 0; i < n; i++) {
    const t   = i / SR;
    let   val = 0;
    for (const { f, t0 } of notes) {
      if (t < t0) continue;
      const nt  = t - t0;
      const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 5.5 * nt);   // subtle vibrato
      const e0  = Math.exp(-nt * 2.4);
      const e1  = 0.30 * Math.exp(-nt * 4.2);
      val += Math.sin(2 * Math.PI * f * vib * nt) * e0 +
             Math.sin(2 * Math.PI * f * 2 * vib * nt) * e1;
    }
    s[i] = (val / notes.length) * AMP * 0.82;
  }
  return s;
}

// ── Run ──────────────────────────────────────────────────────────────────────
console.log('\nGenerating digital-nature SFX for KeepTripSplit…\n');

const sounds = [
  ['water_drop.wav',    waterDrop],
  ['forest_whoosh.wav', forestWhoosh],
  ['compute_tick.wav',  computeTick],
  ['zen_bell.wav',      zenBell],
  ['nature_rise.wav',   natureRise],
];

for (const [name, gen] of sounds) {
  writeWav(name, gen());
}

console.log('\nDone.\n');
