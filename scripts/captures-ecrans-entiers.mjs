// ─────────────────────────────────────────────────────────────────────────────
// Chaque onglet en une seule image, du haut jusqu'en bas (fenêtre très haute,
// donc aucun défilement) : sert à choisir précisément quel morceau d'interface
// illustre quel message, avant de composer les visuels du store.
//
//   EXPO_PUBLIC_DEMO_MODE=true npx expo start --web --port 8081
//   node scripts/captures-ecrans-entiers.mjs   -> captures-ecrans/*.png
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://localhost:8081';
const OUT = 'captures-ecrans';
const CAPTURE_KEY = '@stopklop_capture_profile';
const CSS_W = 430, CSS_H = Number(process.env.CSS_H ?? 2600), DSF = 2;

fs.mkdirSync(OUT, { recursive: true });
const demoSource = fs.readFileSync('src/utils/demoData.js', 'utf8').replace(/^export /gm, '');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: CSS_W, height: CSS_H, deviceScaleFactor: DSF, isMobile: true, hasTouch: true });
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 180000 });
const pause = (ms) => page.evaluate(m => new Promise(r => setTimeout(r, m)), ms);
await pause(4000);
await page.evaluate((src, key) => {
  // eslint-disable-next-line no-eval
  const profile = eval(`${src}; buildVeteranProfile()`);
  profile.visiteGuidee = { statut: 'termine', etape: 0 };
  window.localStorage.setItem(key, JSON.stringify(profile));
}, demoSource, CAPTURE_KEY);
await page.reload({ waitUntil: 'networkidle2', timeout: 180000 });
await pause(5000);

async function tap(label, exact = false) {
  const point = await page.evaluate((label, exact) => {
    const nodes = [...document.querySelectorAll('div,span,a,button')]
      .filter(e => e.children.length === 0)
      .filter(e => { const t = (e.textContent || '').trim(); return exact ? t === label : t.includes(label); })
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.top < innerHeight; });
    if (!nodes.length) return null;
    const r = nodes[nodes.length - 1].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, label, exact);
  if (!point) { console.log('  ⚠ introuvable :', label); return false; }
  await page.mouse.click(point.x, point.y);
  await pause(2000);
  return true;
}

const ECRANS = [
  ['accueil', null],
  ['Statistiques', null],
  ['Statistiques', 'Mois'],
  ['Statistiques', 'Période'],
  ['Plan', null],
  ['Profil', null],
];

for (const [onglet, sous] of ECRANS) {
  if (onglet !== 'accueil') await tap(onglet); else await tap('Accueil');
  if (sous) await tap(sous, true);
  const nom = sous ? `${onglet.toLowerCase()}-${sous.toLowerCase()}` : onglet.toLowerCase();
  const file = path.join(OUT, `${nom}.png`);
  await page.screenshot({ path: file });
  console.log('  ✓', file);
}

await browser.close();
console.log('terminé.');
