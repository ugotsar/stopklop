/**
 * Génère tous les fichiers WAV (sons UI synthétiques) pour Stopklop
 * Usage : node generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'assets', 'sounds');
const SAMPLE_RATE = 44100;

// ── Génération WAV ──────────────────────────────────────────────────────────

function generateWav(outPath, tones) {
  // tones : [{freq (Hz), duration (s), amplitude (0-1), fadeOut (bool)}]
  const samples = [];

  for (const tone of tones) {
    const { freq = 0, duration = 0.1, amplitude = 0.45, fadeOut = true, fadeIn = false } = tone;
    const n = Math.floor(SAMPLE_RATE * duration);

    for (let i = 0; i < n; i++) {
      let env = amplitude;

      // Fade out exponentiel
      if (fadeOut) env *= Math.exp(-4 * (i / n));
      // Fade in court (8ms)
      if (fadeIn) {
        const fadeInSamples = Math.floor(SAMPLE_RATE * 0.008);
        if (i < fadeInSamples) env *= i / fadeInSamples;
      }

      const s = freq > 0
        ? Math.sin(2 * Math.PI * freq * (i / SAMPLE_RATE)) * env
        : 0;

      samples.push(Math.max(-32768, Math.min(32767, Math.round(s * 32767))));
    }
  }

  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);           // PCM
  buf.writeUInt16LE(1, 22);           // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(samples[i], 44 + i * 2);
  }

  fs.writeFileSync(outPath, buf);
  console.log('  ✓', path.basename(outPath));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const silence = (d) => ({ freq: 0, duration: d });
const note    = (freq, duration, opts = {}) => ({ freq, duration, ...opts });

// ── Définition de tous les sons ─────────────────────────────────────────────

const sounds = {

  // Clic léger (+ dans compteur)
  'click_increment': [
    note(1200, 0.035, { amplitude: 0.35, fadeOut: true, fadeIn: true }),
  ],

  // Clic légèrement plus grave (-)
  'click_decrement': [
    note(900, 0.035, { amplitude: 0.3, fadeOut: true, fadeIn: true }),
  ],

  // 0 cigarette → fanfare victoire (C5 E5 G5 C6)
  'enregistrer_zero': [
    note(523, 0.11, { amplitude: 0.5, fadeIn: true }),
    silence(0.02),
    note(659, 0.11, { amplitude: 0.5, fadeIn: true }),
    silence(0.02),
    note(784, 0.11, { amplitude: 0.5, fadeIn: true }),
    silence(0.02),
    note(1047, 0.22, { amplitude: 0.55, fadeOut: true, fadeIn: true }),
  ],

  // Dans l'objectif → double ding positif (E5 G5)
  'enregistrer_objectif': [
    note(659, 0.13, { amplitude: 0.45, fadeIn: true }),
    silence(0.03),
    note(784, 0.18, { amplitude: 0.45, fadeOut: true, fadeIn: true }),
  ],

  // Dépassé → ton neutre descendant (E4 D4)
  'enregistrer_depasse': [
    note(330, 0.15, { amplitude: 0.38, fadeIn: true }),
    silence(0.03),
    note(294, 0.20, { amplitude: 0.35, fadeOut: true }),
  ],

  // Valider journée → ding satisfaisant (C5 G5)
  'valider_journee': [
    note(523, 0.10, { amplitude: 0.48, fadeIn: true }),
    silence(0.025),
    note(784, 0.20, { amplitude: 0.48, fadeOut: true, fadeIn: true }),
  ],

  // Milestone 24h → célébration 4 notes (C5 E5 G5 E6)
  'milestone_24h': [
    note(523, 0.10, { amplitude: 0.5, fadeIn: true }),
    silence(0.02),
    note(659, 0.10, { amplitude: 0.5, fadeIn: true }),
    silence(0.02),
    note(784, 0.10, { amplitude: 0.5, fadeIn: true }),
    silence(0.02),
    note(1319, 0.25, { amplitude: 0.55, fadeOut: true, fadeIn: true }),
  ],

  // Milestone 7j → 5 notes festives (C5 E5 G5 C6 E6)
  'milestone_7j': [
    note(523,  0.09, { amplitude: 0.5, fadeIn: true }),
    silence(0.018),
    note(659,  0.09, { amplitude: 0.5, fadeIn: true }),
    silence(0.018),
    note(784,  0.09, { amplitude: 0.5, fadeIn: true }),
    silence(0.018),
    note(1047, 0.09, { amplitude: 0.52, fadeIn: true }),
    silence(0.018),
    note(1319, 0.30, { amplitude: 0.55, fadeOut: true, fadeIn: true }),
  ],

  // Milestone 30j → fanfare épique 6 notes + reprise finale
  'milestone_30j': [
    note(523,  0.08, { amplitude: 0.5, fadeIn: true }),
    silence(0.015),
    note(659,  0.08, { amplitude: 0.5, fadeIn: true }),
    silence(0.015),
    note(784,  0.08, { amplitude: 0.5, fadeIn: true }),
    silence(0.015),
    note(1047, 0.08, { amplitude: 0.52, fadeIn: true }),
    silence(0.015),
    note(1319, 0.08, { amplitude: 0.55, fadeIn: true }),
    silence(0.03),
    note(1047, 0.06, { amplitude: 0.52, fadeIn: true }),
    silence(0.015),
    note(1319, 0.35, { amplitude: 0.6, fadeOut: true, fadeIn: true }),
  ],

  // Badge débloqué → shimmer (série rapide haute fréquence)
  'badge_debloque': [
    note(880,  0.06, { amplitude: 0.4, fadeIn: true }),
    silence(0.01),
    note(1109, 0.06, { amplitude: 0.42, fadeIn: true }),
    silence(0.01),
    note(1319, 0.06, { amplitude: 0.44, fadeIn: true }),
    silence(0.01),
    note(1760, 0.18, { amplitude: 0.48, fadeOut: true, fadeIn: true }),
  ],

  // Étape onboarding → ting léger (G4)
  'onboarding_step': [
    note(784, 0.14, { amplitude: 0.38, fadeOut: true, fadeIn: true }),
  ],

  // Like motivation → double pulsation douce (A4 A4)
  'motivation_like': [
    note(440, 0.08, { amplitude: 0.35, fadeOut: true, fadeIn: true }),
    silence(0.04),
    note(523, 0.14, { amplitude: 0.38, fadeOut: true, fadeIn: true }),
  ],
};

// ── Génération ───────────────────────────────────────────────────────────────

console.log('\nGénération des sons Stopklop...\n');

for (const [name, tones] of Object.entries(sounds)) {
  const outPath = path.join(OUT_DIR, `${name}.wav`);
  generateWav(outPath, tones);
}

console.log(`\n✅ ${Object.keys(sounds).length} fichiers générés dans assets/sounds/\n`);
