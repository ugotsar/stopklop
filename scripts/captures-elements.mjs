// ─────────────────────────────────────────────────────────────────────────────
// Découpe de vrais morceaux d'interface (une carte, un graphique, un compteur)
// pour pouvoir les composer un par un avec les illustrations du store, au lieu
// de coller bêtement un écran entier.
//
//   EXPO_PUBLIC_DEMO_MODE=true npx expo start --web --port 8081
//   node scripts/captures-elements.mjs      -> captures-elements/*.png
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://localhost:8081';
const OUT = 'captures-elements';
const CAPTURE_KEY = '@stopklop_capture_profile';

// Chaque morceau : l'onglet, un texte repère, le nombre de parents à remonter
// pour attraper toute la carte, et la marge laissée autour.
const MORCEAUX = [
  ['accueil', null,        'semaine',        'CETTE SEMAINE',                 3, 10],
  ['accueil', null,        'aujourdhui',     "2 cigarettes en réserve",       4, 10],
  ['accueil', null,        'baisse',         'TA BAISSE, EN CIGARETTES',      3, 10],
  ['accueil', null,        'gains-jour',     'cigarettes en moins',           4, 10],
  ['accueil', null,        'bandeau-envie',  'Une envie de fumer',            3, 10],
  ['stats',   'Période',   'an-graphe',      'Consommation par heure',        3, 10],
  ['stats',   'Période',   'an-chiffres',    'Moyenne quotidienne',           3, 10],
  ['stats',   'Période',   'an-cartes',      'Argent économisé',              3, 10],
  ['stats',   'Mois',      'palier',         'prochain palier',               4, 10],
  ['plan',    null,        'impact',         'Votre impact',                  2, 10],
  ['plan',    null,        'projection',     'resteront dans votre poche',    3, 10],
  ['plan',    null,        'declencheurs',   'Répartition par déclencheur',   3, 10],
  ['plan',    null,        'creneaux',       'Créneau le plus critique',      4, 10],
  ['plan',    null,        'paliers',        'Prochain palier',               4, 10],
  ['plan',    null,        'journal',        'Dernières envies',              3, 10],
  ['profil',  null,        'profil-gains',   'Économies réalisées',           4, 10],
];

fs.mkdirSync(OUT, { recursive: true });
const demoSource = fs.readFileSync('src/utils/demoData.js', 'utf8').replace(/^export /gm, '');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 180000 });
await page.evaluate(() => new Promise(r => setTimeout(r, 4000)));
await page.evaluate((src, key) => {
  // eslint-disable-next-line no-eval
  const profile = eval(`${src}; buildVeteranProfile()`);
  profile.visiteGuidee = { statut: 'termine', etape: 0 };
  window.localStorage.setItem(key, JSON.stringify(profile));
}, demoSource, CAPTURE_KEY);
await page.reload({ waitUntil: 'networkidle2', timeout: 180000 });
await page.evaluate(() => new Promise(r => setTimeout(r, 5000)));

const pause = (ms = 1500) => page.evaluate(m => new Promise(r => setTimeout(r, m)), ms);

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
  if (!point) return false;
  await page.mouse.click(point.x, point.y);
  await pause();
  return true;
}

// Fait défiler jusqu'à ce que le repère soit entièrement visible, puis renvoie
// la boîte de la carte qui le contient.
async function cadre(repere, remontees, marge) {
  for (let essai = 0; essai < 14; essai++) {
    const box = await page.evaluate((repere, remontees, marge) => {
      const cible = [...document.querySelectorAll('div,span')]
        .filter(e => e.children.length === 0 && (e.textContent || '').includes(repere))[0];
      if (!cible) return { absent: true };
      let carte = cible;
      for (let i = 0; i < remontees && carte.parentElement; i++) carte = carte.parentElement;
      const r = carte.getBoundingClientRect();
      return {
        x: r.x - marge, y: r.y - marge, w: r.width + marge * 2, h: r.height + marge * 2,
        visible: r.top >= 0 && r.bottom <= window.innerHeight,
        top: r.top, bottom: r.bottom,
      };
    }, repere, remontees, marge);
    if (box.absent) return null;
    if (box.visible) return box;
    await page.mouse.move(215, 500);
    await page.mouse.wheel({ deltaY: box.top < 0 ? box.top - 20 : Math.min(box.bottom - 932 + 20, 400) });
    await pause(900);
  }
  return null;
}

let onglet = null;
for (const [tab, sousOnglet, nom, repere, remontees, marge] of MORCEAUX) {
  if (tab !== onglet) {
    const libelle = { accueil: 'Accueil', stats: 'Statistiques', plan: 'Plan', profil: 'Profil' }[tab];
    await tap(libelle);
    onglet = tab;
  }
  if (sousOnglet) await tap(sousOnglet, true);
  const box = await cadre(repere, remontees, marge);
  if (!box) { console.log('  ⚠ introuvable :', nom); continue; }
  const file = path.join(OUT, `${nom}.png`);
  await page.screenshot({ path: file, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: box.w, height: box.h } });
  console.log('  ✓', file, `${Math.round(box.w)}×${Math.round(box.h)} css`);
}

await browser.close();
console.log('terminé.');
