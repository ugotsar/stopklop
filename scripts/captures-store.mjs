// ─────────────────────────────────────────────────────────────────────────────
// Captures d'écran pour les stores, prises dans l'app réelle (build web).
//
//   1. npx expo start --web --port 8081        (avec EXPO_PUBLIC_DEMO_MODE=true)
//   2. node scripts/captures-store.mjs
//
// Le profil « un an de grosse consommation » est injecté directement dans la
// clé locale du mode captures, donc aucune donnée réelle n'est touchée.
// Sortie : captures-store/*.png en 1290 × 2796 (iPhone 6.9" / Google Play).
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://localhost:8081';
const OUT = process.env.OUT_DIR ?? 'captures-store/ios';
const CAPTURE_KEY = '@stopklop_capture_profile';

// 430 × 932 en CSS × 3 = 1290 × 2796 : la taille exacte demandée par l'App Store.
// Google Play veut du 9:16, d'où 360 × 640 × 3 = 1080 × 1920 (OUT_DIR + CSS_W/CSS_H).
const VIEWPORT = {
  width: Number(process.env.CSS_W ?? 430),
  height: Number(process.env.CSS_H ?? 932),
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};

fs.mkdirSync(OUT, { recursive: true });

// Le générateur est du JS simple : on le réutilise tel quel dans la page.
const demoSource = fs.readFileSync('src/utils/demoData.js', 'utf8').replace(/^export /gm, '');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport(VIEWPORT);
page.on('console', m => { if (m.type() === 'error') console.log('  [page]', m.text().slice(0, 160)); });

console.log('→ ouverture de', URL);
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 180000 });
await page.evaluate(() => new Promise(r => setTimeout(r, 4000)));

console.log('→ injection du profil de démonstration');
await page.evaluate((src, key) => {
  // eslint-disable-next-line no-eval
  const profile = eval(`${src}; buildVeteranProfile()`);
  // La visite guidée ne doit pas s'ouvrir par-dessus les captures.
  profile.visiteGuidee = { statut: 'termine', etape: 0 };
  window.localStorage.setItem(key, JSON.stringify(profile));
}, demoSource, CAPTURE_KEY);

await page.reload({ waitUntil: 'networkidle2', timeout: 180000 });
await page.evaluate(() => new Promise(r => setTimeout(r, 5000)));

async function tap(label, { exact = false } = {}) {
  const point = await page.evaluate((label, exact) => {
    const nodes = [...document.querySelectorAll('div,span,a,button')]
      .filter(e => e.children.length === 0)
      .filter(e => {
        const t = (e.textContent || '').trim();
        return exact ? t === label : t.includes(label);
      })
      .filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.top < window.innerHeight;
      });
    if (!nodes.length) return null;
    const r = nodes[nodes.length - 1].getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, label, exact);
  if (!point) { console.log(`  ⚠ introuvable : « ${label} »`); return false; }
  await page.mouse.click(point.x, point.y);
  positionY = 0;
  await page.evaluate(() => new Promise(r => setTimeout(r, 1800)));
  return true;
}

async function shoot(name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log('  ✓', file);
}

// RN-web ScrollView ne réagit qu'aux vrais événements de la molette.
let positionY = 0;
async function scrollTo(y) {
  await page.mouse.move(215, 500);
  const delta = y - positionY;
  if (delta !== 0) await page.mouse.wheel({ deltaY: delta });
  positionY = y;
  await page.evaluate(() => new Promise(r => setTimeout(r, 1400)));
}

// ── Les écrans ───────────────────────────────────────────────────────────────
console.log('→ captures');
await shoot('01-accueil');
await scrollTo(650);  await shoot('02-accueil-economies');
await scrollTo(1400); await shoot('03-accueil-bas');
await scrollTo(0);

if (await tap('Statistiques')) {
  await shoot('04-statistiques-jour');
  if (await tap('Mois', { exact: true })) {
    await shoot('05-statistiques-mois');
    await scrollTo(700); await shoot('06-statistiques-mois-detail');
    await scrollTo(0);
  }
  if (await tap('Période', { exact: true })) {
    await shoot('07-statistiques-periode');
    await scrollTo(700); await shoot('08-statistiques-periode-detail');
    await scrollTo(0);
  }
}

if (await tap('Plan')) {
  await shoot('09-plan-impact');
  await scrollTo(800);  await shoot('10-plan-habitudes');
  await scrollTo(1600); await shoot('11-plan-paliers');
  await scrollTo(2400); await shoot('12-plan-suite');
  await scrollTo(0);
}

if (await tap('Profil')) {
  await shoot('13-profil');
  await scrollTo(0);
}

if (await tap('Accueil')) {
  if (await tap("J'ai fumé")) {
    await shoot('14-jai-fume');
    await scrollTo(500); await shoot('15-jai-fume-declencheurs');
  }
}

await browser.close();
console.log('terminé.');
