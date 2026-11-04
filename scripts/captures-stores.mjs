// ─────────────────────────────────────────────────────────────────────────────
// La série finale : les illustrations dessinées pour les stores, avec par-dessus
// un vrai écran de l'app présenté comme chez Cal AI — un seul téléphone, droit,
// châssis complet, assez grand pour qu'on lise les chiffres en vignette.
//
// L'illustration garde son titre et son dessin ; elle s'efface vers le bas dans
// son propre crème, et le téléphone arrive dessous en débordant du cadre.
//
//   node scripts/captures-stores.mjs                 -> captures-stores/ios     (1290 x 2796)
//   OUT_DIR=... W=1080 H=1920 node ...               -> une autre taille
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

// illustration, écran réel, pixels d'écran à sauter en haut (pour cadrer la
// bonne carte dans le téléphone)
const SERIE = [
  // illustration, écran réel, cadrage (px sautés en haut), chiffre clé
  ['01-arretez-de-fumer',           '11-plan-paliers',             980, '0 cigarette le 8 décembre'],
  ['02-fixez-votre-date-arret',     '21-modifier-le-plan',         150, '0 en 5 semaines'],
  ['03-voyez-vos-economies',        '09-plan-impact',              980, '4 497 € par an'],
  ['04-mesurez-chaque-progres',     '07-statistiques-periode',     150, '− 40 % en un an'],
  ['05-comprenez-vos-declencheurs', '10-plan-habitudes',           700, '424 envies analysées'],
  ['06-objectif-clair-chaque-jour', '01-accueil',                  700, '20 → 6 par jour'],
  ['07-restez-motive',              '06-statistiques-mois-detail', 150, '91 % du palier atteint'],
  ['08-suivez-chaque-cigarette',    '14-jai-fume',                 150, '4 396 cigarettes suivies'],
  ['09-bienfaits-de-arret',         '09-plan-impact',              150, '+25 j de vie par an'],
  ['10-ameliorez-votre-sante',      '22-modifier-le-plan-bas',     980, '+253 j sur 10 ans'],
];


const FONDS = 'captures-appstore';
const ECRANS = 'captures-store/ios';

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const tab = await browser.newPage();
await tab.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

// Le crème exact de l'illustration, pour que le fondu soit invisible
await tab.goto(u(`${FONDS}/01-arretez-de-fumer.png`), { waitUntil: 'load' });
const creme = await tab.evaluate(() => {
  const img = document.images[0];
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  const d = c.getContext('2d').getImageData(12, 12, 1, 1).data;
  return `rgb(${d[0]},${d[1]},${d[2]})`;
});

const HAUT = Math.round(H * 0.555);        // bande illustration (titre + dessin)
const LARG_TEL = Math.round(W * 0.74);
const BORD = Math.round(LARG_TEL * 0.030);
const TEL_Y = Math.round(H * 0.495);

// Hauteur utile de l'écran dans le châssis, pour ne jamais laisser de vide en bas
const HAUT_INTERIEUR = (H - TEL_Y + 40) - BORD * 2;

function page(fond, ecran, depart, chiffre) {
  const k = (LARG_TEL - BORD * 2) / 1290;   // échelle de l'écran dans le châssis
  // on ne fait pas descendre le cadrage plus bas que ce que l'écran peut remplir
  depart = Math.min(depart, Math.max(0, 2796 - Math.ceil(HAUT_INTERIEUR / k)));
  return `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    .scene{position:relative;width:${W}px;height:${H}px;background:${creme};overflow:hidden}
    .haut{position:absolute;left:0;top:0;width:${W}px;height:${HAUT}px;overflow:hidden}
    .haut img{position:absolute;left:0;top:0;width:100%}
    .fondu{position:absolute;left:0;bottom:0;width:100%;height:${Math.round(H * 0.11)}px;
      background:linear-gradient(to bottom, rgba(247,236,221,0), ${creme})}
    .tel{position:absolute;left:50%;transform:translateX(-50%);top:${TEL_Y}px;
      width:${LARG_TEL}px;height:${H - TEL_Y + 40}px;padding:${BORD}px;
      background:linear-gradient(155deg,#2B332C,#141915 55%,#0D110E);
      border-radius:${Math.round(LARG_TEL * 0.105)}px ${Math.round(LARG_TEL * 0.105)}px 0 0;
      box-shadow:0 ${Math.round(H * 0.012)}px ${Math.round(H * 0.026)}px rgba(17,32,21,.26),
                 0 ${Math.round(H * 0.002)}px ${Math.round(H * 0.005)}px rgba(17,32,21,.16)}
    .ecran{position:relative;width:100%;height:100%;overflow:hidden;background:#FDFBF4;
      border-radius:${Math.round(LARG_TEL * 0.082)}px ${Math.round(LARG_TEL * 0.082)}px 0 0}
    .ecran img{position:absolute;left:0;top:${-Math.round(depart * k)}px;width:100%}
    /* le chiffre clé, pour qu'il reste lisible même en vignette de recherche */
    .pastille{position:absolute;left:50%;transform:translateX(-50%);
      top:${TEL_Y - Math.round(H * 0.042)}px;
      background:#1E5530;color:#FFFFFF;font-family:"Segoe UI",system-ui,sans-serif;
      font-size:${Math.round(W * 0.038)}px;font-weight:700;letter-spacing:-0.5px;
      padding:${Math.round(W * 0.016)}px ${Math.round(W * 0.038)}px;
      border-radius:${Math.round(W * 0.05)}px;white-space:nowrap;
      box-shadow:0 ${Math.round(W*0.012)}px ${Math.round(W*0.026)}px rgba(17,32,21,.22)}
  </style>
  <div class="scene">
    <div class="haut"><img src="${u(`${FONDS}/${fond}.png`)}"><div class="fondu"></div></div>
    ${chiffre ? `<div class="pastille">${chiffre}</div>` : ''}
    <div class="tel"><div class="ecran"><img src="${u(`${ECRANS}/${ecran}.png`)}"></div></div>
  </div>`;
}

for (const [fond, ecran, depart, chiffre] of SERIE) {
  const tmp = path.join(OUT, '_t.html');
  fs.writeFileSync(tmp, page(fond, ecran, depart, chiffre));
  await tab.goto(u(tmp) + '?v=' + Date.now(), { waitUntil: 'load' });
  await tab.evaluate(() => Promise.all([...document.images].map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; }))));
  await tab.screenshot({ path: path.join(OUT, `${fond}.png`) });
  fs.unlinkSync(tmp);
  console.log('  ✓', fond, '←', ecran);
}

await browser.close();
console.log('terminé.');
