// ─────────────────────────────────────────────────────────────────────────────
// Les écrans qui ne sont pas dans la barre d'onglets : Modifier le plan et le
// Journal des envies. Ils sont indispensables pour illustrer « Fixez votre date
// d'arrêt » et « Notez le contexte de chaque cigarette ».
//
//   EXPO_PUBLIC_DEMO_MODE=true npx expo start --web --port 8081
//   node scripts/captures-ecrans-pousses.mjs   -> captures-store/ios/2x-*.png
// ─────────────────────────────────────────────────────────────────────────────
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://localhost:8081';
const OUT = 'captures-store/ios';
const CAPTURE_KEY = '@stopklop_capture_profile';

fs.mkdirSync(OUT, { recursive: true });
const demoSource = fs.readFileSync('src/utils/demoData.js', 'utf8').replace(/^export /gm, '');

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const pause = ms => page.evaluate(m => new Promise(r => setTimeout(r, m)), ms);

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 180000 });
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
  await pause(2200);
  return true;
}

async function defile(y) {
  await page.mouse.move(215, 500);
  await page.mouse.wheel({ deltaY: y });
  await pause(1200);
}

// Les modales d'impact : argent, temps de vie, bénéfices santé. Elles s'ouvrent
// par le (i) de chaque carte de « Votre impact ».
async function modaleImpact(repere, nom) {
  await tap('Plan');
  await pause(1500);
  const ouvert = await page.evaluate((repere) => {
    const texte = [...document.querySelectorAll('div,span')]
      .filter(e => e.children.length === 0 && (e.textContent || '').trim() === repere)[0];
    if (!texte) return false;
    // le (i) est le dernier élément cliquable de la ligne
    let ligne = texte;
    for (let i = 0; i < 5 && ligne.parentElement; i++) ligne = ligne.parentElement;
    const boutons = [...ligne.querySelectorAll('div[role="button"],div[tabindex]')];
    const cible = boutons[boutons.length - 1] ?? ligne;
    const r = cible.getBoundingClientRect();
    const ev = o => new MouseEvent(o, { bubbles: true, cancelable: true, clientX: r.x + r.width - 14, clientY: r.y + r.height / 2 });
    cible.dispatchEvent(ev('pointerdown')); cible.dispatchEvent(ev('mousedown'));
    cible.dispatchEvent(ev('pointerup')); cible.dispatchEvent(ev('mouseup'));
    cible.dispatchEvent(ev('click'));
    return true;
  }, repere);
  if (!ouvert) { console.log('  ⚠ repère absent :', repere); return; }
  await pause(2500);
  await page.screenshot({ path: path.join(OUT, nom + '.png') });
  console.log('  ✓', nom);
  await page.keyboard.press('Escape');
  await pause(1200);
}

await modaleImpact('Meilleure santé', '24-bienfaits-sante');
await modaleImpact('Vie récupérée · par an', '25-vie-recuperee');

await tap('Plan');
await defile(1800);
if (await tap('Modifier le plan')) {
  await page.screenshot({ path: path.join(OUT, '21-modifier-le-plan.png') });
  console.log('  ✓ 21-modifier-le-plan');
  await defile(700);
  await page.screenshot({ path: path.join(OUT, '22-modifier-le-plan-bas.png') });
  console.log('  ✓ 22-modifier-le-plan-bas');
}

await tap('Plan');
await defile(1200);
if (await tap('Voir le journal complet')) {
  await page.screenshot({ path: path.join(OUT, '23-journal-envies.png') });
  console.log('  ✓ 23-journal-envies');
}

await browser.close();
console.log('terminé.');
