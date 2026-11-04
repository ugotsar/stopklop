// ─────────────────────────────────────────────────────────────────────────────
// La série de visuels de fiche.
//
// Chaque visuel est bâti en trois temps, sur le crème de l'illustration :
//   1. le titre et le sous-titre, repris tels quels en haut de l'illustration
//   2. une fenêtre découpée dans le dessin, choisie image par image pour que le
//      sujet (la tirelire, le calendrier, l'escalier…) reste entier et visible
//   3. le téléphone, droit, châssis complet, qui déborde par le bas, avec dedans
//      l'écran réel qui prouve le titre — plus une pastille pour le chiffre clé
//
//   node scripts/captures-stores.mjs   -> captures-stores/ios (1290 x 2796)
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = Number(process.env.W ?? 1290);
const H = Number(process.env.H ?? 2796);
const OUT = process.env.OUT_DIR ?? 'captures-stores/ios';
const u = f => pathToFileURL(path.resolve(f)).href;

const FONDS = 'captures-appstore';
const ECRANS = 'captures-store/ios';

// illustration | écran | cadrage de l'écran | chiffre clé | fenêtre du dessin [début, hauteur]
const SERIE = [
  ['01-arretez-de-fumer',           '11-plan-paliers',             980, '0 cigarette le 8 décembre', [880, 820]],
  ['02-fixez-votre-date-arret',     '21-modifier-le-plan',         150, '0 en 5 semaines',           [930, 900]],
  ['03-voyez-vos-economies',        '09-plan-impact',              980, '4 497 € par an',            [880, 820]],
  ['04-mesurez-chaque-progres',     '07-statistiques-periode',     150, '\u2212 40 % en un an',      [820, 860]],
  ['05-comprenez-vos-declencheurs', '10-plan-habitudes',           700, '424 envies analysées',      [950, 860]],
  ['06-objectif-clair-chaque-jour', '01-accueil',                  700, '20 \u2192 6 par jour',      [1040, 860]],
  ['07-restez-motive',              '06-statistiques-mois-detail', 150, '91 % du palier atteint',    [1100, 880]],
  ['08-suivez-chaque-cigarette',    '14-jai-fume',                 150, '4 396 cigarettes suivies',  [1160, 880]],
  ['09-bienfaits-de-arret',         '09-plan-impact',              150, '+25 j de vie par an',       [900, 900]],
  ['10-ameliorez-votre-sante',      '22-modifier-le-plan-bas',     980, '+253 j sur 10 ans',         [960, 900]],
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const tab = await browser.newPage();
await tab.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

// Le crème exact de l'illustration, pour que les raccords soient invisibles
await tab.goto(u(`${FONDS}/01-arretez-de-fumer.png`), { waitUntil: 'load' });
const creme = await tab.evaluate(() => {
  const img = document.images[0];
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  const d = c.getContext('2d').getImageData(12, 12, 1, 1).data;
  return `rgb(${d[0]},${d[1]},${d[2]})`;
});

// Les sous-titres font une ou deux lignes selon l'illustration : la bande
// doit descendre assez bas pour ne jamais en couper une.
const TITRE = Math.round(H * 0.302);
const LARG_TEL = Math.round(W * 0.74);
const BORD = Math.round(LARG_TEL * 0.030);

function page(fond, ecran, depart, chiffre, fenetre) {
  const [debutDessin, hautDessin] = fenetre;
  const telY = TITRE + hautDessin - Math.round(H * 0.012);
  const hautInterieur = (H - telY + 40) - BORD * 2;
  const k = (LARG_TEL - BORD * 2) / 1290;
  const cadrage = Math.min(depart, Math.max(0, 2796 - Math.ceil(hautInterieur / k)));
  return `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    .scene{position:relative;width:${W}px;height:${H}px;background:${creme};overflow:hidden}
    .bande{position:absolute;left:0;width:${W}px;overflow:hidden}
    .bande img{position:absolute;left:0;width:100%}
    .fondu{position:absolute;left:0;bottom:0;width:100%;height:${Math.round(H * 0.095)}px;
      background:linear-gradient(to bottom, rgba(247,236,221,0), ${creme})}
    .pastille{position:absolute;left:50%;transform:translateX(-50%);
      top:${telY - Math.round(H * 0.040)}px;
      background:#1E5530;color:#FFFFFF;font-family:"Segoe UI",system-ui,sans-serif;
      font-size:${Math.round(W * 0.037)}px;font-weight:700;letter-spacing:-0.5px;
      padding:${Math.round(W * 0.015)}px ${Math.round(W * 0.036)}px;
      border-radius:${Math.round(W * 0.05)}px;white-space:nowrap;
      box-shadow:0 ${Math.round(W * 0.010)}px ${Math.round(W * 0.024)}px rgba(17,32,21,.20)}
    .tel{position:absolute;left:50%;transform:translateX(-50%);top:${telY}px;
      width:${LARG_TEL}px;height:${H - telY + 40}px;padding:${BORD}px;
      background:linear-gradient(155deg,#2B332C,#141915 55%,#0D110E);
      border-radius:${Math.round(LARG_TEL * 0.105)}px ${Math.round(LARG_TEL * 0.105)}px 0 0;
      box-shadow:0 ${Math.round(H * 0.011)}px ${Math.round(H * 0.024)}px rgba(17,32,21,.24),
                 0 ${Math.round(H * 0.002)}px ${Math.round(H * 0.005)}px rgba(17,32,21,.14)}
    .ecran{position:relative;width:100%;height:100%;overflow:hidden;background:#FDFBF4;
      border-radius:${Math.round(LARG_TEL * 0.082)}px ${Math.round(LARG_TEL * 0.082)}px 0 0}
    .ecran img{position:absolute;left:0;top:${-Math.round(cadrage * k)}px;width:100%}
  </style>
  <div class="scene">
    <div class="bande" style="top:0;height:${TITRE}px">
      <img src="${u(`${FONDS}/${fond}.png`)}" style="top:0">
    </div>
    <div class="bande" style="top:${TITRE}px;height:${hautDessin}px">
      <img src="${u(`${FONDS}/${fond}.png`)}" style="top:${-debutDessin}px">
      <div class="fondu"></div>
    </div>
    ${chiffre ? `<div class="pastille">${chiffre}</div>` : ''}
    <div class="tel"><div class="ecran"><img src="${u(`${ECRANS}/${ecran}.png`)}"></div></div>
  </div>`;
}

for (const [fond, ecran, depart, chiffre, fenetre] of SERIE) {
  const tmp = path.join(OUT, '_t.html');
  fs.writeFileSync(tmp, page(fond, ecran, depart, chiffre, fenetre));
  await tab.goto(u(tmp) + '?v=' + Date.now(), { waitUntil: 'load' });
  await tab.evaluate(() => Promise.all([...document.images].map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; }))));
  await tab.screenshot({ path: path.join(OUT, `${fond}.png`) });
  fs.unlinkSync(tmp);
  console.log('  ✓', fond, '←', ecran);
}

await browser.close();
console.log('terminé.');
