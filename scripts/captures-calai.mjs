// ─────────────────────────────────────────────────────────────────────────────
// Visuels de fiche dans l'esprit de Cal AI : fond blanc, titre noir court et
// centré en haut, un seul téléphone droit avec son châssis, et dedans un vrai
// écran de l'app. Un visuel = une idée.
//
//   node scripts/captures-calai.mjs   -> captures-calai/*.png (1290 x 2796)
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 1290, H = 2796;
const OUT = 'captures-calai';
const u = f => pathToFileURL(path.resolve(f)).href;

// titre, sous-titre (facultatif), écran
const SERIE = [
  ['01-ouverture',        null,                        null,                                    null],
  ['02-suivez',           'Suivez chaque cigarette',    "Une pression, c'est noté.",            'captures-store/ios/01-accueil.png'],
  ['03-economies',        'Voyez ce que vous gagnez',   'Au jour le jour, en euros.',           'captures-store/ios/09-plan-impact.png'],
  ['04-progres',          'Un an de progrès',           "D'un paquet par jour à cinq.",         'captures-store/ios/07-statistiques-periode.png'],
  ['05-declencheurs',     'Comprenez vos envies',       'Stress, café, apéro : tout est là.',   'captures-store/ios/10-plan-habitudes.png'],
  ['06-plan',             'Un plan jusqu\u0027à zéro',  'Un palier par semaine, à votre rythme.', 'captures-store/ios/11-plan-paliers.png'],
];

fs.mkdirSync(OUT, { recursive: true });

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  .scene{position:relative;width:${W}px;height:${H}px;background:#FFFFFF;overflow:hidden;
    font-family:Inter,"Segoe UI",system-ui,sans-serif;display:flex;flex-direction:column;align-items:center}
  h1{font-size:104px;font-weight:800;letter-spacing:-3px;color:#0B0B0B;text-align:center;
    line-height:1.04;margin-top:170px;padding:0 70px}
  p.sous{font-size:44px;font-weight:400;color:#6E726E;text-align:center;margin-top:28px;padding:0 90px}
  /* le téléphone : châssis sombre, écran réel à l'intérieur */
  .tel{position:relative;width:${Math.round(W * 0.76)}px;margin-top:92px;
    background:linear-gradient(155deg,#2B332C,#141915 55%,#0D110E);
    border-radius:${Math.round(W * 0.076 * 0.76 / 0.76 * 0.9)}px;padding:14px;
    box-shadow:0 46px 90px rgba(17,32,21,.22), 0 10px 22px rgba(17,32,21,.14)}
  .ecran{position:relative;width:100%;overflow:hidden;border-radius:${Math.round(W * 0.062)}px;background:#FDFBF4}
  .ecran img{display:block;width:100%}
  /* visuel d'ouverture */
  .ouverture{justify-content:center;gap:56px}
  .ouverture img.icone{width:300px;height:300px;border-radius:68px;
    box-shadow:0 30px 60px rgba(17,32,21,.18)}
  .ouverture .nom{font-size:132px;font-weight:800;letter-spacing:-4px;color:#1E5530}
  .ouverture .base{font-size:48px;color:#6E726E;text-align:center;padding:0 110px;line-height:1.3}
`;

const page = (titre, sous, ecran) => `<!doctype html><meta charset="utf-8"><style>${styles}</style>
  <div class="scene">
    <h1>${titre}</h1>
    ${sous ? `<p class="sous">${sous}</p>` : ''}
    <div class="tel"><div class="ecran"><img src="${u(ecran)}"></div></div>
  </div>`;

const ouverture = `<!doctype html><meta charset="utf-8"><style>${styles}</style>
  <div class="scene ouverture">
    <img class="icone" src="${u('assets/icon.png')}">
    <div class="nom">stopklop</div>
    <div class="base">Réduisez, puis arrêtez.<br>À votre rythme, chiffres à l'appui.</div>
  </div>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const tab = await browser.newPage();
await tab.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

for (const [nom, titre, sous, ecran] of SERIE) {
  const html = titre ? page(titre, sous, ecran) : ouverture;
  const tmp = path.join(OUT, '_t.html');
  fs.writeFileSync(tmp, html);
  await tab.goto(u(tmp) + '?v=' + Date.now(), { waitUntil: 'networkidle0' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.evaluate(() => Promise.all([...document.images].map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; }))));
  await tab.screenshot({ path: path.join(OUT, `${nom}.png`) });
  fs.unlinkSync(tmp);
  console.log('  ✓', nom);
}

await browser.close();
console.log('terminé.');
