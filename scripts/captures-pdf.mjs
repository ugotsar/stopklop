// ─────────────────────────────────────────────────────────────────────────────
// Deux PDF pour travailler la série : un avec les illustrations, un avec les
// vrais écrans. Une image par page, au format du visuel, pour pouvoir les
// déposer tels quels dans Miro et les assembler.
//
//   node scripts/captures-pdf.mjs   -> captures-store-final/*.pdf
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const u = f => pathToFileURL(path.resolve(f)).href;
const OUT = 'captures-store-final';
fs.mkdirSync(OUT, { recursive: true });

const JEUX = [
  ['stopklop-illustrations.pdf', 'captures-appstore', "Illustrations"],
  ['stopklop-ecrans-app.pdf', 'captures-store/ios', "Écrans réels de l'app"],
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
  args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();

for (const [nomPdf, dossier, titre] of JEUX) {
  const fichiers = fs.readdirSync(dossier)
    .filter(f => /\.png$/i.test(f) && !f.startsWith('_'))
    .sort();

  // Première page : la planche entière, pour tout voir d'un coup.
  const planche = `
    <section class="planche">
      <h1>${titre} — ${fichiers.length} visuels</h1>
      <div class="grille">${fichiers.map(f => `
        <figure><img src="${u(path.join(dossier, f))}">
        <figcaption>${f.replace(/\.png$/i, '')}</figcaption></figure>`).join('')}</div>
    </section>`;

  const pages = planche + fichiers.map(f => `
    <section>
      <img class="pleine" src="${u(path.join(dossier, f))}">
      <footer>${f.replace(/\.png$/i, '')}</footer>
    </section>`).join('');

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
    @page{size:129mm 285mm;margin:0}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:"Segoe UI",Arial,sans-serif;background:#fff}
    section{width:129mm;height:285mm;page-break-after:always;position:relative;
      display:flex;flex-direction:column;align-items:center}
    section:last-child{page-break-after:auto}
    img.pleine{width:129mm;height:279.6mm;display:block;object-fit:contain}
    footer{height:5.4mm;line-height:5.4mm;font-size:8pt;color:#6B7280;width:100%;text-align:center}
    .planche{padding:8mm 6mm;justify-content:flex-start}
    .planche h1{font-size:12pt;color:#17301F;margin-bottom:5mm;font-weight:700}
    .grille{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;width:100%}
    .grille img{width:100%;display:block;border:0.3mm solid #D9DEE4}
    .grille figcaption{font-size:5pt;color:#6B7280;text-align:center;padding-top:1mm;
      overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
  </style></head><body>${pages}</body></html>`;

  const tmp = path.join(OUT, '_pdf.html');
  fs.writeFileSync(tmp, html);
  await page.goto(u(tmp) + '?v=' + Date.now(), { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; }))));
  // Les illustrations pèsent 4 Mo pièce en PNG : on les réencode en JPEG pour
  // que le PDF reste transportable (Miro, e-mail).
  await page.evaluate(() => {
    for (const img of document.images) {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      img.src = c.toDataURL('image/jpeg', 0.86);
    }
  });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.onload = r; i.onerror = r; }))));
  await page.pdf({ path: path.join(OUT, nomPdf), preferCSSPageSize: true, printBackground: true });
  fs.unlinkSync(tmp);
  console.log('  ✓', nomPdf, `— ${fichiers.length} pages (${titre})`);
}

await browser.close();
console.log('terminé.');
