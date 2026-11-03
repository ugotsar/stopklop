const APPS = [
  ['cal-ai', 'Cal AI calorie tracker'],
  ['duolingo', 'Duolingo'],
  ['tinder', 'Tinder'],
  ['bumble', 'Bumble'],
  ['azumio-calories', 'Calorie Mama AI Azumio'],
  ['kwit', 'Kwit arreter de fumer'],
  ['option0', 'option 0 arreter de fumer'],
  ['i-am-sober', 'I Am Sober'],
];
for (const [cle, terme] of APPS) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(terme)}&country=fr&entity=software&limit=4`;
  try {
    const r = await fetch(url);
    const j = await r.json();
    console.log('\n###', cle, '—', terme);
    for (const a of j.results) {
      console.log(`  ${a.trackId}  ${a.trackName}  [${a.sellerName}]  ${a.screenshotUrls?.length ?? 0} captures`);
    }
  } catch (e) { console.log('  erreur', cle, e.message); }
}
