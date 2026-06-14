import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - spacing.md * 2 - spacing.md * 2; // card padding
const CHART_H = 100;

// ── Graphique ligne SVG ──────────────────────────────────────────────────────
function LineChart({ data, color = colors.primary, width = CHART_W, height = CHART_H, labels }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = 0;
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * (height - 16) - 4,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L0,${height} Z`;

  return (
    <Svg width={width} height={height + 20}>
      {/* Area */}
      <Path d={areaPath} fill={color} opacity={0.1} />
      {/* Line */}
      <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
      {/* Labels */}
      {labels && labels.map((l, i) => (
        <SvgText key={i} x={points[i]?.x ?? 0} y={height + 16} fontSize={9} fill="#9E9E9E" textAnchor="middle">{l}</SvgText>
      ))}
    </Svg>
  );
}

// ── Graphique barres SVG ─────────────────────────────────────────────────────
function BarChart({ data, color = colors.primary, width = CHART_W, height = CHART_H, labels }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barW = (width / data.length) * 0.6;
  const gap  = (width / data.length) * 0.4;

  return (
    <Svg width={width} height={height + 20}>
      {data.map((v, i) => {
        const barH = (v / max) * (height - 8);
        const x = i * (barW + gap) + gap / 2;
        const y = height - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
            {labels && (
              <SvgText x={x + barW / 2} y={height + 16} fontSize={9} fill="#9E9E9E" textAnchor="middle">{labels[i]}</SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

// ── Arc circulaire mini ──────────────────────────────────────────────────────
function MiniArc({ ratio = 0, size = 80, color = colors.primary, label, sublabel }) {
  const sw = 8;
  const r  = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(ratio, 1);
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#E5E7EB" strokeWidth={sw} fill="none" />
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          rotation="-90" origin={`${cx},${cy}`}
        />
      </Svg>
      {label ? <Text style={{ fontSize: 11, fontWeight: '700', color, marginTop: -size/2 - 4, textAlign: 'center' }}>{label}</Text> : null}
      {sublabel ? <Text style={{ fontSize: 10, color: colors.gray, textAlign: 'center' }}>{sublabel}</Text> : null}
    </View>
  );
}

// ── Données mockées ───────────────────────────────────────────────────────────
const MOCK = {
  jour: {
    cigarettes: 3,
    chartCig:   [10, 10, 9, 10, 9, 11, 8, 3],
    labelsCig:  ['00h','03h','06h','09h','12h','15h','18h','21h'],
    argentEco:  2.40,
    argentDep:  -12.60,
    net:        -10.20,
    vieMins:    102,
    progression: -57,
    serie:       2,
    resume: ['-4 cigarettes vs hier', '+2,40 € économisés', '+1 h 42 de vie gagnées'],
    message: 'Belle journée, continue comme ça ! 💚',
  },
  semaine: {
    cigarettes: 42,
    chartCig:   [12, 10, 9, 11, 8, 6, 5],
    labelsCig:  ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
    argentEco:  16.80,
    argentDep:  -88.20,
    net:        -71.40,
    vieMins:    840,
    progression: -38,
    serie:       6,
    record:      '11h',
    resume: ['-58 cigarettes cette semaine', '+16,80 € économisés', '-38% de consommation'],
    message: 'Excellente semaine ! 🔥',
  },
  mois: {
    cigarettes: 96,
    chartCig:   [14,12,11,10,13,9,8,11,10,9,8,7,9,8,6,7,8,5,6,7,5,4,6,5,3,5,4,3,4,2],
    labelsCig:  ['1','5','10','15','20','25','30'],
    argentEco:  38.40,
    argentDep:  -201.60,
    net:        -163.20,
    vieMins:    1920,
    progression: -28,
    serie:       6,
    record:      '11h 32',
    resume: ['-96 cigarettes ce mois', '+38,40 € économisés', '+32h de vie gagnées'],
    message: 'Un mois de progrès constants ! 🏆',
  },
  debut: {
    cigarettes: 1248,
    chartCig:   [18,16,15,14,13,12,11,10,9,8,7,6,5,4,3],
    labelsCig:  ['1 mai','15 mai','1 juin','15 juin','1 juil.','aujourd\'hui'],
    argentEco:  612.40,
    argentDep:  -1842.60,
    net:        -1230.20,
    vieMins:    6240,
    progression: -42,
    serie:       23,
    record:      '11h 32',
    resume: ['-512 cigarettes évitées', '+612,40 € économisés', '+3 jours 14h de vie gagnés'],
    message: 'Tu as déjà parcouru un long chemin, continue ! 💚',
  },
};

const TABS = [
  { key: 'jour',    label: 'Jour' },
  { key: 'semaine', label: 'Semaine' },
  { key: 'mois',    label: 'Mois' },
  { key: 'debut',   label: 'Depuis le début' },
];

// ── Écran principal ───────────────────────────────────────────────────────────
export default function StatistiquesScreen() {
  const [activeTab, setActiveTab] = useState('jour');
  const d = MOCK[activeTab];

  const vieH = Math.floor(d.vieMins / 60);
  const vieJ = Math.floor(vieH / 24);
  const vieStr = vieJ > 0 ? `+${vieJ}j ${vieH % 24}h` : `+${vieH}h ${d.vieMins % 60}min`;

  // Pour le graphique mois, on n'affiche que certains labels
  const cigLabels = activeTab === 'mois'
    ? d.chartCig.map((_, i) => [0,4,9,14,19,24,29].includes(i) ? d.labelsCig[Math.floor(i/5)] : '')
    : activeTab === 'debut'
    ? d.chartCig.map((_, i) => i % Math.ceil(d.chartCig.length / 6) === 0 ? d.labelsCig[Math.floor(i / Math.ceil(d.chartCig.length/6))] : '')
    : d.labelsCig;

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>
      </View>

      {/* ── Onglets ── */}
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

        {/* ── Card Cigarettes fumées ── */}
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
            <View style={styles.badgeCol}>
              <Text style={styles.badgeGreen}>↓ {Math.abs(d.progression)} %</Text>
              <Text style={styles.badgeSub}>vs avant</Text>
            </View>
          </View>

          {/* Graphique */}
          <View style={styles.chartContainer}>
            {activeTab === 'semaine'
              ? <BarChart data={d.chartCig} labels={d.labelsCig} color={colors.primary} />
              : <LineChart data={d.chartCig} labels={cigLabels} color={colors.primary} />
            }
          </View>
        </View>

        {/* ── Card Argent ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={styles.cardTitle}>Argent</Text>
            <Text style={styles.cardPeriod}>{TABS.find(t => t.key === activeTab)?.label}</Text>
          </View>

          <View style={styles.argRow}>
            <View style={styles.argCol}>
              <Text style={styles.argGreen}>+{d.argentEco.toFixed(2)} €</Text>
              <Text style={styles.argLabel}>économisés</Text>
            </View>
            <View style={styles.argCol}>
              <Text style={styles.argRed}>{d.argentDep.toFixed(2)} €</Text>
              <Text style={styles.argLabel}>dépensés</Text>
            </View>
            <View style={styles.argCol}>
              <Text style={[styles.argRed, { color: colors.black }]}>{d.net.toFixed(2)} €</Text>
              <Text style={styles.argLabel}>net</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <LineChart
              data={d.chartCig.map((v, i) => i * (d.argentEco / d.chartCig.length))}
              color={colors.primary}
            />
          </View>
        </View>

        {/* ── Row : Vie gagnée + Progression ── */}
        <View style={styles.row}>
          {/* Vie gagnée */}
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⏳</Text>
              <Text style={[styles.cardTitle, { fontSize: 12 }]}>Temps de vie gagné</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <MiniArc ratio={0.7} size={80} color={colors.primary} />
              <Text style={styles.vieText}>{vieStr}</Text>
              <Text style={styles.vieSub}>de vie gagnées</Text>
            </View>
          </View>

          {/* Progression */}
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📈</Text>
              <Text style={[styles.cardTitle, { fontSize: 12 }]}>Progression</Text>
            </View>
            <Text style={styles.progNum}>↓ {Math.abs(d.progression)} %</Text>
            <Text style={styles.progSub}>consommation</Text>
            {d.record && (
              <View style={styles.badgeRow}>
                <Text style={styles.badgeSmall}>🏆 {d.record} record</Text>
              </View>
            )}
            <View style={styles.badgeRow}>
              <Text style={styles.badgeSmall}>🔥 {d.serie} jours série</Text>
            </View>
          </View>
        </View>

        {/* ── Résumé ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>✨</Text>
            <Text style={styles.cardTitle}>
              {activeTab === 'jour' ? 'Résumé du jour'
                : activeTab === 'semaine' ? 'Résumé intelligent'
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },
  headerTitle: { fontSize: font.lg, fontWeight: '800', color: colors.black },

  // Tabs
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.white,
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  tab: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: radius.full,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText:   { fontSize: 11, fontWeight: '600', color: colors.gray },
  tabTextActive: { color: colors.white },

  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: 90 },

  // Cards
  card: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
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

  // Argent
  argRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  argCol: { alignItems: 'center', flex: 1 },
  argGreen: { fontSize: font.md, fontWeight: '800', color: colors.primary },
  argRed:   { fontSize: font.md, fontWeight: '800', color: '#EF4444' },
  argLabel: { fontSize: 11, color: colors.gray, marginTop: 2 },

  // Row demi-cartes
  row: { flexDirection: 'row', gap: spacing.sm },
  halfCard: { flex: 1, marginBottom: 0 },

  // Vie gagnée
  vieText: { fontSize: font.md, fontWeight: '900', color: colors.primary, marginTop: 4, textAlign: 'center' },
  vieSub:  { fontSize: 11, color: colors.gray, textAlign: 'center' },

  // Progression
  progNum: { fontSize: 22, fontWeight: '900', color: colors.primary, marginTop: 4 },
  progSub: { fontSize: 11, color: colors.gray, marginBottom: 8 },
  badgeRow: { marginBottom: 4 },
  badgeSmall: { fontSize: 12, color: colors.black, fontWeight: '500' },

  // Résumé
  resumeLine: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  resumeBullet: { color: colors.primary, fontWeight: '800', fontSize: font.sm },
  resumeText: { fontSize: font.sm, color: colors.black, flex: 1 },
  resumeMessage: {
    marginTop: spacing.sm, fontSize: font.sm, color: colors.primary,
    fontWeight: '600', textAlign: 'center',
  },
});
