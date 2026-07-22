import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - spacing.md * 2 - spacing.md * 2;
const CHART_H = 100;

// ── Helpers dates ─────────────────────────────────────────────────────────────
const DAY_MS = 86400000;
const isoKey  = d => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);

function mondayOf(d) {
  const x = new Date(d); x.setHours(12, 0, 0, 0);
  return addDays(x, -((x.getDay() + 6) % 7));
}
function labelJourCourt(key) {
  const todayKey = isoKey(new Date());
  const hierKey  = isoKey(addDays(new Date(), -1));
  if (key === todayKey) return "Aujourd'hui";
  if (key === hierKey)  return 'Hier';
  const s = new Date(key + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function labelMois(mKey) {
  const s = new Date(mKey + '-15T12:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function monthsBetween(startKey, endKey) {
  const out = [];
  let [y, m] = startKey.split('-').map(Number);
  const [ey, em] = endKey.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

// ── Stats d'une période quelconque ────────────────────────────────────────────
// Seuls les jours réellement ENREGISTRÉS comptent pour les économies : un jour
// non renseigné ne génère ni économie fictive ni dépense fictive.
// Les valeurs peuvent être négatives (on fume plus qu'avant → perte réelle).
function periodStats(dates, hist, consoAvant, prixCig) {
  const enregistres = dates.filter(k => hist[k] !== undefined);
  const counts  = dates.map(k => hist[k] ?? 0);
  const sum     = enregistres.reduce((s, k) => s + hist[k], 0);
  const nTotal  = Math.max(dates.length, 1);
  const n       = Math.max(enregistres.length, 1);
  const nbNonRenseignes = dates.length - enregistres.length;
  const argDep  = sum * prixCig;
  const evitees = enregistres.length > 0 ? consoAvant * enregistres.length - sum : 0;
  const argEco  = evitees * prixCig;
  const vieMins = evitees * 5;
  const progression = consoAvant > 0 && enregistres.length > 0
    ? Math.max(-100, Math.min(100, Math.round((evitees / (consoAvant * enregistres.length)) * 100)))
    : 0;
  return { counts, sum, n, nTotal, nbNonRenseignes, nbEnregistres: enregistres.length, argDep, argEco, vieMins, progression };
}

function fmtVie(mins) {
  const neg = mins < 0; const m = Math.abs(mins); const signe = neg ? '-' : '+';
  const h = Math.floor(m / 60); const j = Math.floor(h / 24);
  if (j > 0) return `${signe}${j}j ${h % 24}h`;
  if (h > 0) return `${signe}${h}h ${m % 60}m`;
  return `${signe}${m}min`;
}

// ── Graphique barres (cliquable) ─────────────────────────────────────────────
function BarChart({ data, color = colors.primary, width = CHART_W, height = CHART_H, labels, onBarPress, highlight = -1 }) {
  if (!data || data.length === 0) return null;
  const max  = Math.max(...data, 1);
  const barW = (width / data.length) * 0.6;
  const gap  = (width / data.length) * 0.4;
  return (
    <Svg width={width} height={height + 20}>
      {data.map((v, i) => {
        const barH = (v / max) * (height - 8);
        const x    = i * (barW + gap) + gap / 2;
        const y    = height - barH;
        return (
          <G key={i} onPress={onBarPress ? () => onBarPress(i) : undefined}>
            {/* Zone de toucher pleine hauteur */}
            <Rect x={i * (barW + gap)} y={0} width={barW + gap} height={height + 20} fill="transparent" />
            <Rect
              x={x} y={Math.max(y, 0)} width={barW} height={Math.max(barH, 2)} rx={3}
              fill={i === highlight ? '#F59E0B' : color} opacity={0.85}
            />
            {labels && labels[i] !== '' && (
              <SvgText x={x + barW / 2} y={height + 16} fontSize={9} fill="#9E9E9E" textAnchor="middle">{labels[i]}</SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

function MiniArc({ ratio = 0, size = 80, color = colors.primary }) {
  const sw   = 8;
  const r    = (size - sw) / 2;
  const cx   = size / 2;
  const cy   = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(ratio, 0), 1);
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke="#E5E7EB" strokeWidth={sw} fill="none" />
      <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        rotation="-90" origin={`${cx},${cy}`} />
    </Svg>
  );
}

// ── Sélecteur de période ‹ … › ───────────────────────────────────────────────
function PeriodNav({ label, onPrev, onNext, nextDisabled, prevDisabled }) {
  return (
    <View style={styles.navRow}>
      <TouchableOpacity
        style={[styles.navBtn, prevDisabled && styles.navBtnDisabled]}
        onPress={onPrev} disabled={prevDisabled}
      >
        <Text style={[styles.navBtnText, prevDisabled && { color: colors.grayBorder }]}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.navLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.navBtn, nextDisabled && styles.navBtnDisabled]}
        onPress={onNext} disabled={nextDisabled}
      >
        <Text style={[styles.navBtnText, nextDisabled && { color: colors.grayBorder }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Écran ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'jour',    label: 'Jour' },
  { key: 'semaine', label: 'Semaine' },
  { key: 'mois',    label: 'Mois' },
  { key: 'debut',   label: 'Période' },
];

export default function StatistiquesScreen() {
  const { stats, profile } = useUser();

  const [activeTab, setActiveTab]     = useState('jour');
  const [dayKey, setDayKey]           = useState(() => isoKey(new Date()));
  const [weekOffset, setWeekOffset]   = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [rangeStart, setRangeStart]   = useState(null); // clé mois "YYYY-MM"
  const [rangeEnd, setRangeEnd]       = useState(null);

  if (!stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}><Text style={styles.headerTitle}>Statistiques</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 40 }}>🌿</Text>
          <Text style={{ color: colors.gray, marginTop: 8 }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Données de base ──────────────────────────────────────────────────────────
  const { allKeys, allValues, consoAvant, prixCig, serie, objectifJour } = stats;
  const hist = Object.fromEntries(allKeys.map((k, i) => [k, allValues[i]]));
  const cigLog   = Array.isArray(profile?.cigLog) ? profile.cigLog : [];
  const now      = new Date();
  const todayKey = isoKey(now);

  const firstDataKey  = allKeys[0] ?? todayKey;
  const allMonths     = monthsBetween(firstDataKey.slice(0, 7), todayKey.slice(0, 7));
  const rStart        = allMonths.includes(rangeStart) ? rangeStart : allMonths[0];
  const rEnd          = allMonths.includes(rangeEnd)   ? rangeEnd   : allMonths[allMonths.length - 1];

  // ── Construction de la vue selon l'onglet ────────────────────────────────────
  let view; // { navLabel, dates, chartData, chartLabels, onBarPress, extra }

  if (activeTab === 'jour') {
    const times = cigLog
      .filter(ts => ts.slice(0, 10) === dayKey)
      .map(ts => new Date(ts))
      .filter(d => !isNaN(d))
      .sort((a, b) => a - b);
    const bins = Array.from({ length: 24 }, () => 0);
    times.forEach(d => { bins[d.getHours()]++; });
    const countJour = hist[dayKey] ?? 0;
    const sansHeure = Math.max(0, countJour - times.length);

    view = {
      navLabel: labelJourCourt(dayKey),
      onPrev: () => setDayKey(isoKey(addDays(new Date(dayKey + 'T12:00:00'), -1))),
      onNext: () => setDayKey(isoKey(addDays(new Date(dayKey + 'T12:00:00'), 1))),
      nextDisabled: dayKey >= todayKey,
      dates: [dayKey],
      chartData: bins,
      chartLabels: Array.from({ length: 24 }, (_, h) => h % 4 === 0 ? `${h}h` : ''),
      heures: times.map(d => `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`),
      sansHeure,
    };
  }

  else if (activeTab === 'semaine') {
    const monday = addDays(mondayOf(now), weekOffset * 7);
    const days   = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    const keys   = days.map(isoKey).filter(k => k <= todayKey);
    const allKeys7 = days.map(isoKey);
    const debut = monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const fin   = addDays(monday, 6).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    view = {
      navLabel: `Du ${debut} au ${fin}`,
      onPrev: () => setWeekOffset(o => o - 1),
      onNext: () => setWeekOffset(o => o + 1),
      nextDisabled: weekOffset >= 0,
      dates: keys,
      chartData: allKeys7.map(k => hist[k] ?? 0),
      chartLabels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      onBarPress: i => {
        const k = allKeys7[i];
        if (k <= todayKey) { setDayKey(k); setActiveTab('jour'); }
      },
      tapHint: 'Touchez un jour pour voir le détail heure par heure',
    };
  }

  else if (activeTab === 'mois') {
    const base    = new Date(now.getFullYear(), now.getMonth() + monthOffset, 15);
    const mKey    = isoKey(base).slice(0, 7);
    const nbJours = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const allKeysM = Array.from({ length: nbJours }, (_, i) => `${mKey}-${String(i + 1).padStart(2, '0')}`);
    const keys     = allKeysM.filter(k => k <= todayKey);

    // Comparaison avec le mois précédent
    const prev    = new Date(base.getFullYear(), base.getMonth() - 1, 15);
    const pKey    = isoKey(prev).slice(0, 7);
    const nbPrev  = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
    const sumPrev = Array.from({ length: nbPrev }, (_, i) => hist[`${pKey}-${String(i + 1).padStart(2, '0')}`] ?? 0)
      .reduce((s, v) => s + v, 0);
    const sumCur  = keys.map(k => hist[k] ?? 0).reduce((s, v) => s + v, 0);

    view = {
      navLabel: labelMois(mKey),
      onPrev: () => setMonthOffset(o => o - 1),
      onNext: () => setMonthOffset(o => o + 1),
      nextDisabled: monthOffset >= 0,
      dates: keys,
      chartData: allKeysM.map(k => hist[k] ?? 0),
      chartLabels: allKeysM.map((k, i) => (i + 1) % 5 === 0 || i === 0 ? String(i + 1) : ''),
      onBarPress: i => {
        const k = allKeysM[i];
        if (k <= todayKey) { setDayKey(k); setActiveTab('jour'); }
      },
      tapHint: 'Touchez un jour pour voir le détail heure par heure',
      comparaison: sumPrev > 0
        ? `${labelMois(pKey)} : ${sumPrev} cig · ${sumCur <= sumPrev ? '↓' : '↑'} ${Math.abs(Math.round(((sumCur - sumPrev) / sumPrev) * 100))}% ce mois`
        : null,
    };
  }

  else { // 'debut' — période libre de mois à mois
    const months = monthsBetween(rStart, rEnd);
    const dates  = [];
    months.forEach(mKey => {
      const [y, m] = mKey.split('-').map(Number);
      const nb = new Date(y, m, 0).getDate();
      for (let i = 1; i <= nb; i++) {
        const k = `${mKey}-${String(i).padStart(2, '0')}`;
        if (k <= todayKey) dates.push(k);
      }
    });
    const monthSums = months.map(mKey =>
      dates.filter(k => k.startsWith(mKey)).map(k => hist[k] ?? 0).reduce((s, v) => s + v, 0)
    );

    view = {
      dates,
      chartData: monthSums,
      chartLabels: months.map(mKey =>
        new Date(mKey + '-15T12:00:00').toLocaleDateString('fr-FR', { month: 'short' })
      ),
      onBarPress: i => {
        const [y, m] = months[i].split('-').map(Number);
        setMonthOffset((y - now.getFullYear()) * 12 + (m - 1 - now.getMonth()));
        setActiveTab('mois');
      },
      tapHint: 'Touchez un mois pour voir le détail jour par jour',
      isRange: true,
      months,
    };
  }

  const p = periodStats(view.dates, hist, consoAvant, prixCig);

  // Navigation des bornes de la période libre
  function stepMonth(key, dir) {
    const idx = allMonths.indexOf(key);
    const next = allMonths[idx + dir];
    return next ?? key;
  }

  const periodeLabel = TABS.find(t => t.key === activeTab)?.label;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Sélecteur de période ── */}
        {!view.isRange ? (
          <PeriodNav
            label={view.navLabel}
            onPrev={view.onPrev}
            onNext={view.onNext}
            nextDisabled={view.nextDisabled}
          />
        ) : (
          <View style={styles.rangeCard}>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeLabel}>De</Text>
              <PeriodNav
                label={labelMois(rStart)}
                onPrev={() => setRangeStart(stepMonth(rStart, -1))}
                onNext={() => {
                  const n = stepMonth(rStart, 1);
                  if (n <= rEnd) setRangeStart(n);
                }}
                prevDisabled={rStart === allMonths[0]}
                nextDisabled={rStart === rEnd}
              />
            </View>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeLabel}>À</Text>
              <PeriodNav
                label={labelMois(rEnd)}
                onPrev={() => {
                  const n = stepMonth(rEnd, -1);
                  if (n >= rStart) setRangeEnd(n);
                }}
                onNext={() => setRangeEnd(stepMonth(rEnd, 1))}
                prevDisabled={rEnd === rStart}
                nextDisabled={rEnd === allMonths[allMonths.length - 1]}
              />
            </View>
          </View>
        )}

        {/* ── Cigarettes fumées ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🚬</Text>
            <Text style={styles.cardTitle}>Cigarettes fumées</Text>
            <Text style={styles.cardPeriod}>{periodeLabel}</Text>
          </View>
          <View style={styles.bigStatRow}>
            <View>
              <Text style={styles.bigNumber}>{p.sum.toLocaleString('fr-FR')}</Text>
              <Text style={styles.bigUnit}>cigarettes</Text>
            </View>
            {p.progression !== 0 && (
              <View style={styles.badgeCol}>
                <Text style={[styles.badgeGreen, p.progression < 0 && { color: colors.red }]}>
                  {p.progression > 0 ? '↓' : '↑'} {Math.abs(p.progression)} %
                </Text>
                <Text style={styles.badgeSub}>vs avant l'app</Text>
              </View>
            )}
          </View>
          <View style={styles.chartContainer}>
            <BarChart
              data={view.chartData}
              labels={view.chartLabels}
              color={colors.primary}
              onBarPress={view.onBarPress}
            />
          </View>
          {view.tapHint && <Text style={styles.tapHint}>👆 {view.tapHint}</Text>}

          {/* Détail horaire (onglet Jour) */}
          {activeTab === 'jour' && (
            <View style={styles.heuresBox}>
              {view.heures.length > 0 ? (
                <>
                  <Text style={styles.heuresTitre}>Heures des cigarettes</Text>
                  <View style={styles.heuresWrap}>
                    {view.heures.map((h, i) => (
                      <View key={i} style={styles.heureChip}>
                        <Text style={styles.heureChipText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.heuresVide}>
                  {p.sum > 0
                    ? 'Heures non enregistrées pour ce jour.'
                    : 'Aucune cigarette ce jour 🎉'}
                </Text>
              )}
              {view.sansHeure > 0 && view.heures.length > 0 && (
                <Text style={styles.heuresVide}>+ {view.sansHeure} sans heure enregistrée</Text>
              )}
            </View>
          )}

          {/* Comparaison mois précédent */}
          {activeTab === 'mois' && view.comparaison && (
            <Text style={styles.comparaison}>{view.comparaison}</Text>
          )}
        </View>

        {/* ── Argent ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={styles.cardTitle}>Argent</Text>
            <Text style={styles.cardPeriod}>{periodeLabel}</Text>
          </View>
          <View style={styles.argRow}>
            <View style={styles.argCol}>
              <Text style={[styles.argGreen, p.argEco < 0 && { color: colors.red }]}>
                {p.argEco >= 0 ? '+' : '-'}{Math.abs(p.argEco).toFixed(2)} €
              </Text>
              <Text style={styles.argLabel}>vs avant l'app</Text>
            </View>
            <View style={styles.argCol}>
              <Text style={styles.argRed}>-{p.argDep.toFixed(2)} €</Text>
              <Text style={styles.argLabel}>dépensés (réel)</Text>
            </View>
            <View style={styles.argCol}>
              <Text style={[styles.argRed, { color: p.argEco >= p.argDep ? colors.primary : colors.red }]}>
                {p.argEco >= p.argDep ? '+' : '-'}{Math.abs(p.argEco - p.argDep).toFixed(2)} €
              </Text>
              <Text style={styles.argLabel}>net</Text>
            </View>
          </View>
          {p.nbNonRenseignes > 0 && (
            <Text style={{ fontSize: 10, color: colors.gray, textAlign: 'center' }}>
              Calculé sur les {p.nbEnregistres} jour{p.nbEnregistres > 1 ? 's' : ''} enregistré{p.nbEnregistres > 1 ? 's' : ''} — {p.nbNonRenseignes} non renseigné{p.nbNonRenseignes > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {/* ── Vie récupérée + Progression ── */}
        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>❤️</Text>
              <Text style={[styles.cardTitle, { fontSize: 12 }]}>Vie récupérée</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <MiniArc ratio={Math.min(p.vieMins / (24 * 60), 1)} size={80} color={p.vieMins >= 0 ? colors.primary : colors.red} />
              <Text style={[styles.vieText, p.vieMins < 0 && { color: colors.red }]}>{fmtVie(p.vieMins)}</Text>
              <Text style={styles.vieSub}>vs avant l'app</Text>
              <Text style={[styles.vieSub, { fontSize: 9, marginTop: 2, color: '#aaa' }]}>5 min / cig. non fumée</Text>
            </View>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📈</Text>
              <Text style={[styles.cardTitle, { fontSize: 12 }]}>Progression</Text>
            </View>
            <Text style={[styles.progNum, p.progression < 0 && { color: colors.red }]}>
              {p.progression > 0 ? '↓' : '↑'} {Math.abs(p.progression)} %
            </Text>
            <Text style={styles.progSub}>consommation</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeSmall}>🔥 {serie}j en objectif</Text>
            </View>
          </View>
        </View>

        {/* ── Résumé ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>✨</Text>
            <Text style={styles.cardTitle}>Résumé</Text>
          </View>
          <View style={styles.resumeLine}>
            <Text style={styles.resumeBullet}>•</Text>
            <Text style={styles.resumeText}>
              {p.sum} cigarette{p.sum > 1 ? 's' : ''} fumée{p.sum > 1 ? 's' : ''} sur {p.nbEnregistres} jour{p.nbEnregistres > 1 ? 's' : ''} enregistré{p.nbEnregistres > 1 ? 's' : ''}
              {p.nbNonRenseignes > 0 ? ` (${p.nbNonRenseignes} non renseigné${p.nbNonRenseignes > 1 ? 's' : ''})` : ''}
            </Text>
          </View>
          <View style={styles.resumeLine}>
            <Text style={styles.resumeBullet}>•</Text>
            <Text style={styles.resumeText}>Moyenne : {(p.sum / p.n).toFixed(1)} cig / jour — objectif : {objectifJour} / jour</Text>
          </View>
          <View style={styles.resumeLine}>
            <Text style={styles.resumeBullet}>•</Text>
            <Text style={styles.resumeText}>
              {(() => {
                const ecartObj = p.sum - objectifJour * p.nbEnregistres;
                return ecartObj > 0
                  ? `⚠️ ${ecartObj} cigarette${ecartObj > 1 ? 's' : ''} au-dessus de votre plan sur la période`
                  : `✅ Plan respecté : ${Math.abs(ecartObj)} cigarette${Math.abs(ecartObj) > 1 ? 's' : ''} sous l'objectif`;
              })()}
            </Text>
          </View>
          <View style={styles.resumeLine}>
            <Text style={styles.resumeBullet}>•</Text>
            <Text style={styles.resumeText}>
              {p.argEco >= 0 ? `+${p.argEco.toFixed(2)} € vs avant l'app` : `${p.argEco.toFixed(2)} € vs avant l'app (vous fumez plus qu'avant)`}
            </Text>
          </View>
          <Text style={styles.resumeMessage}>
            {p.progression > 0 ? `↓ ${p.progression}% vs avant l'app 💚`
              : p.progression < 0 ? `↑ ${Math.abs(p.progression)}% vs avant l'app — accrochez-vous 💪`
              : 'Chaque jour noté compte.'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  headerTitle: { fontSize: font.lg, fontWeight: '800', color: colors.black },
  tabBar: { flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
  tab:          { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.full },
  tabActive:    { backgroundColor: colors.primary },
  tabText:      { fontSize: 11, fontWeight: '600', color: colors.gray },
  tabTextActive:{ color: colors.white },
  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: 90 },
  card:   { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  cardIcon:   { fontSize: 18 },
  cardTitle:  { fontSize: font.sm, fontWeight: '700', color: colors.black, flex: 1 },
  cardPeriod: { fontSize: 11, color: colors.gray },

  // Navigation de période
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radius.full,
    paddingHorizontal: 6, paddingVertical: 6, flex: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  navBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  navBtnDisabled: { backgroundColor: '#FAFAFA' },
  navBtnText: { fontSize: 20, color: colors.primary, fontWeight: '600', lineHeight: 24 },
  navLabel:   { fontSize: 13, fontWeight: '700', color: colors.black },

  rangeCard: { gap: 6 },
  rangeRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeLabel: { width: 24, fontSize: 12, fontWeight: '700', color: colors.gray },

  bigStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
  bigNumber:  { fontSize: 40, fontWeight: '900', color: colors.primary, lineHeight: 44 },
  bigUnit:    { fontSize: 12, color: colors.gray },
  badgeCol:   { alignItems: 'flex-end' },
  badgeGreen: { fontSize: 16, fontWeight: '800', color: colors.primary },
  badgeSub:   { fontSize: 11, color: colors.gray },
  chartContainer: { marginTop: 4 },
  tapHint: { fontSize: 10, color: colors.gray, textAlign: 'center', marginTop: 6 },

  // Détail horaire
  heuresBox:   { marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: spacing.sm },
  heuresTitre: { fontSize: 12, fontWeight: '700', color: colors.black, marginBottom: 6 },
  heuresWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heureChip:   { backgroundColor: '#F0F0F0', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  heureChipText: { fontSize: 11, fontWeight: '600', color: colors.black },
  heuresVide:  { fontSize: 11, color: colors.gray, marginTop: 4 },
  comparaison: { fontSize: 11, color: colors.gray, textAlign: 'center', marginTop: 8 },

  argRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  argCol:  { alignItems: 'center', flex: 1 },
  argGreen:{ fontSize: font.md, fontWeight: '800', color: colors.primary },
  argRed:  { fontSize: font.md, fontWeight: '800', color: '#EF4444' },
  argLabel:{ fontSize: 11, color: colors.gray, marginTop: 2 },
  row:      { flexDirection: 'row', gap: spacing.sm },
  halfCard: { flex: 1 },
  vieText:  { fontSize: font.md, fontWeight: '900', color: colors.primary, marginTop: 4, textAlign: 'center' },
  vieSub:   { fontSize: 11, color: colors.gray, textAlign: 'center' },
  progNum:  { fontSize: 22, fontWeight: '900', color: colors.primary, marginTop: 4 },
  progSub:  { fontSize: 11, color: colors.gray, marginBottom: 8 },
  badgeRow: { marginBottom: 4 },
  badgeSmall:{ fontSize: 12, color: colors.black, fontWeight: '500' },
  resumeLine:{ flexDirection: 'row', gap: 6, marginBottom: 4 },
  resumeBullet:{ color: colors.primary, fontWeight: '800', fontSize: font.sm },
  resumeText:  { fontSize: font.sm, color: colors.black, flex: 1 },
  resumeMessage: { marginTop: spacing.sm, fontSize: font.sm, color: colors.primary, fontWeight: '600', textAlign: 'center' },
});
