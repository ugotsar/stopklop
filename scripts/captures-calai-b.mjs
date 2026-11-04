// ─────────────────────────────────────────────────────────────────────────────
// Visuels de fiche App Store — variante B, dans la famille Cal AI.
//
// Recette Cal AI d'origine : fond blanc, titre noir court centré en haut, un
// seul téléphone droit avec châssis complet, écran réel de l'app.
//
// Ce que cette variante change :
//   1. deux niveaux de texte — un titre court et un sous-titre gris, pour que
//      le visuel tienne debout même quand le titre seul est trop sec ;
//   2. le téléphone est plus grand et sort par le bas du cadre, ce qui laisse
//      voir davantage de l'écran sans réduire la taille des textes de l'app ;
//   3. une pastille verte de marque, à cheval sur le bord du téléphone, porte
//      le chiffre clé — c'est le seul élément encore lisible en vignette dans
//      les résultats de recherche, là où la recette stricte ne montre plus
//      qu'une forme grise.
//
//   node scripts/captures-calai-b.mjs   -> captures-calai-b/*.png (1290 x 2796)
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ECRANS = 'captures-store/ios';
const OUT = process.env.OUT_DIR ?? 'captures-calai-b';
const W = 1290, H = 2796;

// Palette de l'app (src/theme.js)
const VERT = '#2F7A44';
const ENCRE = '#111315';
const GRIS = '#6F746F';

const SERIE = [
  {
    fichier: '01-stopklop',
    couverture: true,
    titre: 'stopklop',
    sousTitre: 'Arrêtez de fumer, à votre rythme.',
    ecran: '14-jai-fume.png',
  },
  {
    fichier: '02-suivez-chaque-cigarette',
    titre: 'Suivez chaque cigarette',
    sousTitre: 'Votre objectif du jour, toujours sous les yeux.',
    ecran: '01-accueil.png',
    pastille: '20 → 6 par jour',
  },
  {
    fichier: '03-voyez-vos-economies',
    titre: 'Voyez vos économies',
    sousTitre: 'Ce que vous ne dépensez plus, en temps réel.',
    ecran: '09-plan-impact.png',
    pastille: '4 497 € par an',
  },
  {
    fichier: '04-mesurez-chaque-progres',
    titre: 'Mesurez chaque progrès',
    sousTitre: 'Un an de consommation, d’un seul coup d’œil.',
    ecran: '07-statistiques-periode.png',
    pastille: '− 40 % en un an',
  },
  {
    fichier: '05-comprenez-vos-envies',
    titre: 'Comprenez vos envies',
    sousTitre: 'L’app repère vos déclencheurs à votre place.',
    ecran: '10-plan-habitudes.png',
    pastille: '424 envies analysées',
  },
  {
    fichier: '06-avancez-vers-zero',
    titre: 'Avancez vers zéro',
    sousTitre: 'Un palier par semaine, jusqu’à la dernière.',
    ecran: '11-plan-paliers.png',
    pastille: '0 le 8 décembre',
  },
];

// Géométrie du téléphone : assez grand pour que l'écran reste lisible, et
// volontairement coupé en bas.
const TEL = { largeur: 1120, haut: 660, chassis: 22 };

const url = p => pathToFileURL(path.resolve(p)).href;

function page({ titre, sousTitre, ecran, pastille, couverture }) {
  const gauche = Math.round((W - TEL.largeur) / 2);
  const hauteurCadre = H - TEL.haut;             // le châssis sort par le bas

  const badge = pastille ? `<div class="pastille">${pastille}</div>` : '';

  const entete = couverture
    ? `<div class="entete">
         <img class="icone" src="${url('assets/icon.png')}">
         <div class="marque">${titre}</div>
         <div class="sous-titre">${sousTitre}</div>
       </div>`
    : `<div class="entete">
         <div class="titre">${titre}</div>
         <div class="sous-titre">${sousTitre}</div>
         ${badge}
       </div>`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:${W}px;height:${H}px;background:#fff;overflow:hidden;
      font-family:Inter,"Segoe UI",-apple-system,Helvetica,Arial,sans-serif}
    .scene{position:relative;width:${W}px;height:${H}px}

    /* En-tête : titre, sous-titre et chiffre clé s'empilent, le bloc est
       centré dans la bande laissée libre au-dessus du téléphone. */
    .entete{position:absolute;top:0;left:70px;width:${W - 140}px;height:${TEL.haut}px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      text-align:center;padding-bottom:30px}
    .titre{font-size:104px;line-height:1.05;font-weight:800;letter-spacing:-3px;color:${ENCRE}}
    .sous-titre{margin-top:24px;font-size:44px;line-height:1.32;font-weight:400;color:${GRIS}}

    /* Visuel d'ouverture : l'icône remplace le titre */
    .icone{width:220px;height:220px;border-radius:50px;display:block;margin:0 auto 38px;
      box-shadow:0 18px 40px rgba(23,61,38,.18)}
    .marque{font-size:106px;font-weight:800;letter-spacing:-4px;color:${ENCRE}}

    /* Le téléphone */
    .tel{position:absolute;left:${gauche}px;top:${TEL.haut}px;
      width:${TEL.largeur}px;height:${hauteurCadre}px;
      background:linear-gradient(155deg,#2a3430,#141916 55%,#0d100e);
      border-radius:124px 124px 0 0;padding:${TEL.chassis}px ${TEL.chassis}px 0;
      box-shadow:0 -6px 70px rgba(23,61,38,.10), 0 34px 80px rgba(23,61,38,.22)}
    .ecran{position:relative;width:100%;height:100%;overflow:hidden;background:#FDFBF4;
      border-radius:104px 104px 0 0}
    .ecran img{display:block;width:100%}

    /* Le chiffre clé : une pastille de marque, posée entre le sous-titre et le
       téléphone. Elle ne recouvre rien de l'interface et reste le seul élément
       encore lisible quand le visuel est réduit en vignette. */
    .pastille{margin-top:34px;background:${VERT};color:#fff;
      font-size:48px;font-weight:800;letter-spacing:-.5px;
      padding:24px 46px;border-radius:999px;white-space:nowrap;
      box-shadow:0 14px 32px rgba(47,122,68,.26)}
  </style></head><body>
    <div class="scene">
      ${entete}
      <div class="tel"><div class="ecran"><img src="${url(path.join(ECRANS, ecran))}"></div></div>
    </div>
  </body></html>`;
}

fs.mkdirSync(OUT, { recursive: true });
const navigateur = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'],
});
const onglet = await navigateur.newPage();
await onglet.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

const tmp = path.join(OUT, '_composition.html');
for (const visuel of SERIE) {
  fs.writeFileSync(tmp, page(visuel));
  await onglet.goto(url(tmp) + '?v=' + Date.now(), { waitUntil: 'load' });
  // Les images locales et la police doivent être prêtes avant la capture.
  await onglet.evaluate(() => Promise.all([
    document.fonts.ready,
    ...[...document.images].map(i => (i.complete ? i.decode().catch(() => {})
      : new Promise(r => { i.onload = r; i.onerror = r; }))),
  ]));
  await onglet.evaluate(() => new Promise(r => setTimeout(r, 250)));
  await onglet.screenshot({ path: path.join(OUT, `${visuel.fichier}.png`) });
  console.log('  ok', visuel.fichier, '<-', visuel.ecran);
}

// Planche de contact
const fichiers = SERIE.map(v => `${v.fichier}.png`);
fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#1b1b1b;color:#fff;font:13px system-ui;
    display:grid;grid-template-columns:repeat(6,1fr);gap:10px;padding:10px}
  figure{margin:0}img{width:100%;display:block;border:1px solid #444}
  figcaption{font-size:12px;text-align:center;padding-top:4px;color:#aaa}
</style>${fichiers.map(f => `<figure><img src="${url(path.join(OUT, f))}">
  <figcaption>${f.replace(/\.png$/, '')}</figcaption></figure>`).join('')}`);
await onglet.setViewport({ width: 1700, height: 1200 });
await onglet.goto(url(tmp) + '?v=' + Date.now(), { waitUntil: 'load' });
await onglet.evaluate(() => Promise.all([...document.images].map(i => (i.complete
  ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; })))));
await onglet.screenshot({ path: path.join(OUT, '_planche.png'), fullPage: true });

fs.rmSync(tmp, { force: true });
await navigateur.close();
console.log('termine.');
