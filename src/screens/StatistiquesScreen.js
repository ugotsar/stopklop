import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - spacing.md * 2 - spacing.md * 2;
const CHART_H = 100;

// ── Utilitaires date ──────────────────────────────────────────────────────────
function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function lastNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}

function shortLabel(date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3);
}

function dayLabel(date) {
  return String(date.getDate());
}

// ── Calculs statistiques ──────────────────────────────────────────────────────
function buildStats(profile) {
  const historique  = profile?.historique ?? {};
  const consoAvant  = profile?.consoAvantApp ?? 10;
  const prixCig     = (profile?.prixPaquet ?? 10) / (profile?.cigarettesParPaquet ?? 20);
  const objectif    = profile?.objectifCigarettes ?? Math.max(1, Math.floor(consoAvant * 0.8));

  const today       = new Date();
  const todayKey    = dateKey(today);
  const todayCount  = historique[todayKey] ?? profile?.cigarettesToday ?? 0;

  // Semaine : 7 derniers jours
  const week7 = lastNDays(7);
  const weekData  = week7.map(d => historique[dateKey(d)] ?? (dateKey(d) === todayKey ? todayCount : null));
  const weekSum   = weekData.reduce((s, v) => s + (v ?? 0), 0);
  const weekLabels = week7.map(shortLabel);

  // Mois : 30 derniers jours
  const month30 = lastNDays(30);
  const monthData  = month30.map(d => historique[dateKey(d)] ?? (dateKey(d) === todayKey ? todayCount : null));
  const monthSum   = monthData.reduce((s, v) => s + (v ?? 0), 0);
  const monthLabels = month30.map((d, i) => i % 5 === 0 ? dayLabel(d) : '');

  // Depuis le début
  const allKeys   = Object.keys(historique).sort();
  const allValues = allKeys.map(k => historique[k]);
  const totalSum  = allValues.reduce((s, v) => s + v, 0) + (historique[todayKey] === undefined ? todayCount : 0);

  // Progression : % vs consoAvant
  const progressionJour   = consoAvant > 0 ? Math.round(((consoAvant - todayCount) / consoAvant) * 100) : 0;
  const progressionSemaine = consoAvant > 0 ? Math.round(((consoAvant * 7 - weekSum) / (consoAvant * 7)) * 100) : 0;
  const progressionMois   = consoAvant > 0 ? Math.round(((consoAvant * 30 - monthSum) / (consoAvant * 30)) * 100) : 0;

  // Argent économisé
  const argentJour    = Math.max(0, (consoAvant - todayCount) * prixCig);
  const argentSemaine = Math.max(0, (consoAvant * 7 - weekSum) * prixCig);
  const argentMois    = Math.max(0, (consoAvant * 30 - monthSum) * prixCig);
  const argentTotal   = Math.max(0, (consoAvant * Math.max(allKeys.length, 1) - totalSum) * prixCig);

  // Argent dépensé
  const depJour    = todayCount * prixCig;
  const depSemaine = weekSum * prixCig;
  const depMois    = monthSum * prixCig;
  const depTotal   = totalSum * prixCig;

  // Série de jours sous l'objectif
  let serie = 0;
  const serieDays = lastNDays(30).reverse();
  for (const d of serieDays) {
    const v = historique[dateKey(d)];
    if (v === undefined) break;
    if (v <= objectif) serie++;
    else break;
  }

  // Vie gagnée (5 min par cigarette non fumée)
  const vieJourMins    = Math.max(0, (consoAvant - todayCount) * 5);
  const vieSemaineMins = Math.max(0, (consoAvant * 7 - weekSum) * 5);
  const vieMoisMins    = Math.max(0, (consoAvant * 30 - monthSum) * 5);
  const vieTotalMins   = Math.max(0, (consoAvant * Math.max(allKeys.length, 1) - totalSum) * 5);

  function fmtVie(mins) {
    const h = Math.floor(mins / 60);
    const j = Math.floor(h / 24);
    if (j > 0) return `+${j}j ${h % 24}h`;
    if (h > 0) return `+${h}h ${mins % 60}min`;
    return `+${mins}min`;
  }

  return {
    objectif,
    jour: {
      cigarettes:  todayCount,
      chartCig:    [todayCount],
      progression: progressionJour,
      argEco:      argentJour,
      argDep:      depJour,
      vieMins:     vieJourMins,
      vieStr:      fmtVie(vieJourMins),
      serie,
      resume: [
        `${todayCount} cigarette${todayCount > 1 ? 's' : ''} fumée${todayCount > 1 ? 's' : ''} aujourd'hui`,
        `Objectif : ${objectif} max`,
        argentJour > 0 ? `+${argentJour.toFixed(2)} € économisés` : `${depJour.toFixed(2)} € dépensés`,
      ],
      message: todayCount === 0 ? '🎉 Journée sans tabac !' : todayCount <= objectif ? '✅ Dans l\'objectif, bravo !' : '💪 Demain, tu feras encore mieux.',
    },
    semaine: {
      cigarettes:  weekSum,
      chartCig:    weekData.map(v => v ?? 0),
      labelsCig:   weekLabels,
      progression: progressionSemaine,
      argEco:      argentSemaine,
      argDep:      depSemaine,
      vieMins:     vieSemaineMins,
      vieStr:      fmtVie(vieSemaineMins),
      serie,
      resume: [
        `${weekSum} cigarettes fumées cette semaine`,
        `Moy. : ${(weekSum / 7).toFixed(1)} cig/jour`,
        argentSemaine > 0 ? `+${argentSemaine.toFixed(2)} € économisés` : `${depSemaine.toFixed(2)} € dépensés`,
      ],
      message: progressionSemaine > 0 ? `↓ ${progressionSemaine}% vs avant l'app 🔥` : 'Continue à noter chaque jour.',
    },
    mois: {
      cigarettes:  monthSum,
      chartCig:    monthData.map(v => v ?? 0),
      labelsCig:   monthLabels,
      progression: progressionMois,
      argEco:      argentMois,
      argDep:      depMois,
      vieMins:     vieMoisMins,
      vieStr:      fmtVie(vieMoisMins),
      serie,
      resume: [
        `${monthSum} cigarettes ce mois`,
        `Moy. : ${(monthSum / 30).toFixed(1)} cig/jour`,
        argentMois > 0 ? `+${argentMois.toFixed(2)} € économisés` : `${depMois.toFixed(2)} € dépensés`,
      ],
      message: progressionMois > 0 ? `Un mois à -${progressionMois}% 💚` : 'Chaque jour noté compte.',
    },
    debut: {
      cigarettes:  totalSum,
      chartCig:    allValues.length > 1 ? allValues : [todayCount],
      labelsCig:   allKeys.map((k, i) => i % Math.max(1, Math.ceil(allKeys.length / 6)) === 0 ? k.slice(5) : ''),
      progression: consoAvant > 0 && allKeys.length > 0 ? Math.round(((consoAvant * allKeys.length - totalSum) / (consoAvant * allKeys.length)) * 100) : 0,
      argEco:      argentTotal,
      argDep:      depTotal,
      vieMins:     vieTotalMins,
      vieStr:      fmtVie(vieTotalMins),
      serie,
      resume: [
        `${totalSum} cigarettes depuis le début`,
        `${allKeys.length} jour${allKeys.length > 1 ? 's' : ''} de suivi`,
        argentTotal > 0 ? `+${argentTotal.toFixed(2)} € économisés` : `${depTotal.toFixed(2)} € dépensés`,
      ],
      message: allKeys.length >= 7 ? '🏆 Belle régularité dans le suivi !' : 'Note chaque jour pour voir ta progression.',
    },
  };
}

// ── Graphiques ────────────────────────────────────────────────────────────────
function LineChart({ data, color = colors.primary, width = CHART_W, height = CHART_H, labels }) {
  if (!data || data.length < 2) return (
    <View style={{ height: height + 20, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 12, color: colors.gray }}>Pas encore assez de données</Text>
    </View>
  );
  const max  = Math.max(...data, 1);
  const step = width / (data.length - 1);
  const pts  = data.map((v, i) => ({ x: i * step, y: height - (v / max) * (height - 16) - 4 }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${height} L0,${height} Z`;
  return (
    <Svg width={width} height={height + 20}>
      <Path d={area} fill={color} opacity={0.1} />
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />)}
      {labels && labels.map((l, i) => (
        <SvgText key={i} x={pts[i]?.x ?? 0} y={height + 16} fontSize={9} fill="#9E9E9E" textAnchor="middle">{l}</SvgText>
      ))}
    </Svg>
  );
}

function BarChart({ data, color = colors.primary, width = CHART_W, height = CHART_H, labels }) {
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
          <G key={i}>
            <Rect x={x} y={Math.max(y, 0)} width={barW} height={Math.max(barH, 2)} rx={3} fill={color} opacity={0.85} />
            {labels && <SvgText x={x + barW / 2} y={height + 16} fontSize={9} fill="#9E9E9E" textAnchor="middle">{labels[i]}</SvgText>}
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

// ── Écran ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'jour',    label: 'Jour' },
  { key: 'semaine', label: 'Semaine' },
  { key: 'mois',    label: 'Mois' },
  { key: 'debut',   label: 'Depuis le début' },
];

export default function StatistiquesScreen() {
  const [activeTab, setActiveTab] = useState('jour');
  const { profile } = useUser();

  const allStats = buildStats(profile);
  const d        = allStats[activeTab];

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

        {/* Cigarettes fumées */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🚬</Text>
            <Text style={styles.cardTitle}>Cigarettes fumées</Text>
            <Text style={styles.cardPeriod}>{TABS.find(t => t.key === activeTab)?.label}</Text>
          </View>
          <View style={styles.bigStatRow}>
            <View>
              <Text style={styles.bigNumber}>{d.cigarettes.toLocaleString('fr-FR')}</Text>
              <Text style={styles.bigUnit}>cigarettes</Text>
            </View>
            {d.progression !== 0 && (
              <View style={styles.badgeCol}>
                <Text style={[styles.badgeGreen, d.progression < 0 && { color: colors.red }]}>
                  {d.progression > 0 ? '↓' : '↑'} {Math.abs(d.progression)} %
                </Text>
                <Text style={styles.badgeSub}>vs avant l'app</Text>
              </View>
            )}
          </View>
          <View style={styles.chartContainer}>
            {activeTab === 'semaine'
              ? <BarChart data={d.chartCig} labels={d.labelsCig} color={colors.primary} />
              : <LineChart data={d.chartCig} labels={d.labelsCig} color={colors.primary} />
            }
          </View>
        </View>

        {/* Argent */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={styles.cardTitle}>Argent</Text>
            <Text style={styles.cardPeriod}>{TABS.find(t => t.key === activeTab)?.label}</Text>
          </View>
          <View style={styles.argRow}>
            <View style={styles.argCol}>
              <Text style={styles.argGreen}>+{d.argEco.toFixed(2)} €</Text>
              <Text style={styles.argLabel}>économisés</Text>
            </View>
            <View style={styles.argCol}>
              <Text style={styles.argRed}>-{d.argDep.toFixed(2)} €</Text>
              <Text style={styles.argLabel}>dépensés</Text>
            </View>
            <View style={styles.argCol}>
              <Text style={[styles.argRed, { color: d.argEco >= d.argDep ? colors.primary : colors.red }]}>
                {d.argEco >= d.argDep ? '+' : '-'}{Math.abs(d.argEco - d.argDep).toFixed(2)} €
              </Text>
              <Text style={styles.argLabel}>net</Text>
            </View>
          </View>
        </View>

        {/* Vie gagnée + Progression */}
        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⏳</Text>
              <Text style={[styles.cardTitle, { fontSize: 12 }]}>Temps de vie gagné</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <MiniArc ratio={Math.min(d.vieMins / (24 * 60), 1)} size={80} color={colors.primary} />
              <Text style={styles.vieText}>{d.vieStr}</Text>
              <Text style={styles.vieSub}>de vie gagnées</Text>
            </View>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📈</Text>
              <Text style={[styles.cardTitle, { fontSize: 12 }]}>Progression</Text>
            </View>
            <Text style={[styles.progNum, d.progression < 0 && { color: colors.red }]}>
              {d.progression > 0 ? '↓' : '↑'} {Math.abs(d.progression)} %
            </Text>
            <Text style={styles.progSub}>consommation</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeSmall}>🔥 {d.serie}j en objectif</Text>
            </View>
          </View>
        </View>

        {/* Résumé */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>✨</Text>
            <Text style={styles.cardTitle}>
              {activeTab === 'jour' ? 'Résumé du jour'
                : activeTab === 'semaine' ? 'Résumé de la semaine'
                : activeTab === 'mois' ? 'Résumé du mois'
                : 'Résumé depuis le début'}
            </Text>
          </View>
          {d.resume.map((line, i) => (
            <View key={i} style={styles.resumeLine}>
              <Text style={styles.resumeBullet}>•</Text>
              <Text style={styles.resumeText}>{line}</Text>
            </View>
          ))}
          <Text style={styles.resumeMessage}>{d.message}</Text>
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
  bigStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
  bigNumber:  { fontSize: 40, fontWeight: '900', color: colors.primary, lineHeight: 44 },
  bigUnit:    { fontSize: 12, color: colors.gray },
  badgeCol:   { alignItems: 'flex-end' },
  badgeGreen: { fontSize: 16, fontWeight: '800', color: colors.primary },
  badgeSub:   { fontSize: 11, color: colors.gray },
  chartContainer: { marginTop: 4 },
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
