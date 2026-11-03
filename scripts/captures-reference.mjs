// ─────────────────────────────────────────────────────────────────────────────
// Récupère les visuels de fiche (App Store) d'applications de référence, pour
// comparer les partis pris : ce que les autres montrent, comment, dans quel
// ordre. Usage interne, aucune image n'est republiée.
//
//   node scripts/captures-reference.mjs   -> captures-reference/<app>/ios/*.jpg
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';

const APPS = [
  ['cal-ai', 6480417616],
  ['duolingo', 570060128],
  ['tinder', 547702041],
  ['bumble', 930441707],
  ['azumio-compteur-calories', 1121789860],
  ['kwit', 525441365],
  ['option-zero', 6742791977],
  ['i-am-sober', 672904239],
];

const TAILLE = '900x1948bb.jpg';   // assez grand pour lire, assez petit pour tenir

for (const [cle, id] of APPS) {
  const dossier = path.join('captures-reference', cle, 'ios');
  fs.mkdirSync(dossier, { recursive: true });
  const r = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=fr`);
  const a = (await r.json()).results[0];
  if (!a) { console.log('  ⚠', cle, 'introuvable'); continue; }
  const urls = a.screenshotUrls ?? [];
  fs.writeFileSync(path.join('captures-reference', cle, 'fiche-ios.json'), JSON.stringify({
    nom: a.trackName, editeur: a.sellerName, id, note: a.averageUserRating,
    nbNotes: a.userRatingCount, sousTitre: a.description?.split('\n')[0]?.slice(0, 200),
    nbCaptures: urls.length,
  }, null, 2));
  let i = 0;
  for (const url of urls) {
    i++;
    const grand = url.replace(/\/\d+x\d+bb\.(png|jpg|jpeg)$/i, `/${TAILLE}`);
    const img = await fetch(grand);
    if (!img.ok) { console.log('  ⚠', cle, i, img.status); continue; }
    fs.writeFileSync(path.join(dossier, `${String(i).padStart(2, '0')}.jpg`),
      Buffer.from(await img.arrayBuffer()));
  }
  console.log(`  ✓ ${cle} — ${a.trackName} — ${urls.length} visuels`);
}

// ── Google Play ──────────────────────────────────────────────────────────────
const PAQUETS = [
  ['cal-ai', 'com.viraldevelopment.calai'],
  ['duolingo', 'com.duolingo'],
  ['tinder', 'com.tinder'],
  ['bumble', 'com.bumble.app'],
  ['azumio-compteur-calories', 'com.azumio.android.caloriesbuddy'],
  ['kwit', 'fr.kwit.android'],
  ['option-zero', 'com.capasscite.optionzero'],
  ['i-am-sober', 'com.thehungrywasp.iamsober'],
];

const dimensionsPng = b => b.length > 24 && b.readUInt32BE(0) === 0x89504e47
  ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null;

function dimensionsJpeg(b) {
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

for (const [cle, paquet] of PAQUETS) {
  const dossier = path.join('captures-reference', cle, 'android');
  fs.mkdirSync(dossier, { recursive: true });
  const r = await fetch(`https://play.google.com/store/apps/details?id=${paquet}&hl=fr&gl=FR`);
  const htmlComplet = await r.text();
  // On s'arrête avant les suggestions : sinon on récupère les captures des
  // autres applications affichées en bas de la fiche.
  const fin = ['Applications similaires', 'Vous aimerez aussi', 'Nouveautés', 'Note et avis']
    .map(t => htmlComplet.indexOf(t)).filter(i => i > 0).sort((a, b) => a - b)[0] ?? htmlComplet.length;
  const html = htmlComplet.slice(0, fin);
  const bruts = [...new Set([...html.matchAll(/https:\/\/play-lh\.googleusercontent\.com\/[A-Za-z0-9_-]+/g)].map(m => m[0]))];
  let i = 0, gardes = 0;
  for (const base of bruts) {
    const img = await fetch(`${base}=w1080`);
    if (!img.ok) continue;
    const buf = Buffer.from(await img.arrayBuffer());
    const d = dimensionsPng(buf) ?? dimensionsJpeg(buf);
    if (!d) continue;
    const [w, h] = d;
    if (h / w < 1.4) continue;          // écarte l'icône et le bandeau
    if (i >= 12) break;                  // une fiche Play n'en montre pas plus
    i++; gardes++;
    fs.writeFileSync(path.join(dossier, `${String(i).padStart(2, '0')}.jpg`), buf);
  }
  console.log(`  ✓ ${cle} (Play) — ${gardes} visuels sur ${bruts.length} images trouvées`);
}

console.log('terminé.');
