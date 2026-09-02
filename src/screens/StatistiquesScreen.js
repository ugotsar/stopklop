import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Modal, TextInput,
} from 'react-native';
import Svg, { Circle, Rect, Path, Text as SvgText, G } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius, shadow, getScreenWidth } from '../theme';
import { UI } from '../assets/uiKit';
import { Image } from 'react-native';
import { addLocalDays, localDateKey } from '../utils/dateKeys';
import { currencySymbol, formatCurrency } from '../utils/currency';

const SCREEN_W = getScreenWidth();
const CHART_W = SCREEN_W - spacing.md * 2 - spacing.md * 2;
const CHART_H = 100;

// ── Helpers dates ─────────────────────────────────────────────────────────────
const isoKey  = localDateKey;
const addDays = addLocalDays;

function mondayOf(d) {
  const x = new Date(d); x.setHours(12, 0, 0, 0);
  return addDays(x, -((x.getDay() + 6) % 7));
}
// t / lang sont transmis par le composant (via useTranslation) car ces
// fonctions utilitaires vivent en dehors du rendu du composant.
function labelJourCourt(key, t, lang) {
  const todayKey = isoKey(new Date());
  const hierKey  = isoKey(addDays(new Date(), -1));
  if (key === todayKey) return t('dates.today');
  if (key === hierKey)  return t('dates.yesterday');
  const s = new Date(key + 'T12:00:00').toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function labelMois(mKey, lang) {
  const s = new Date(mKey + '-15T12:00:00').toLocaleDateString(lang, { month: 'long', year: 'numeric' });
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
function stepMonthKey(mKey, dir) {
  let [y, m] = mKey.split('-').map(Number);
  m += dir;
  while (m > 12) { m -= 12; y++; }
  while (m < 1)  { m += 12; y--; }
  return `${y}-${String(m).padStart(2, '0')}`;
}
// Grille de semaines (lundi → dimanche) pour le mois `mKey` ("YYYY-MM") — les
// cases hors du mois sont `null` pour rester vides dans le calendrier.
function buildMonthGrid(mKey) {
  const [y, m] = mKey.split('-').map(Number);
  const nbDays = new Date(y, m, 0).getDate();
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // 0 = lundi
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= nbDays; d++) cells.push(`${mKey}-${String(d).padStart(2, '0')}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
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

// ── Prochain palier rond d'économies (barre de progression) ─────────────────
const SAVINGS_MILESTONES = [50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000, 50000];
function nextMilestone(amount) {
  const found = SAVINGS_MILESTONES.find(m => m > amount);
  if (found) return found;
  return Math.ceil((amount + 1) / 50000) * 50000;
}

function fmtVie(mins) {
  const neg = mins < 0; const m = Math.abs(mins); const signe = neg ? '-' : '+';
  const h = Math.floor(m / 60); const j = Math.floor(h / 24);
  if (j > 0) return `${signe}${j}j ${h % 24}h`;
  if (h > 0) return `${signe}${h}h ${m % 60}m`;
  return `${signe}${m}min`;
}

// ── Pastille de comparaison vs période précédente (grille 2×2) ──────────────
// mode 'percent' → "↓ 38 % vs hier (26)" (cigarettes)
// mode 'amount'  → "↑ 1,30 € vs hier (1,90 €)" (argent, via fmt)
function pillDelta(current, previous, mode, prevLabel, t, fmt = n => n) {
  if (!previous) return null;
  const down  = current <= previous; // moins = mieux (cigarettes / argent dépensé)
  const arrow = down ? '↓' : '↑';
  if (mode === 'percent') {
    const pct = Math.round((Math.abs(current - previous) / previous) * 100);
    if (pct === 0) return null;
    return { text: `${arrow} ${pct}% ${t('gridTiles.vs', { ref: prevLabel, value: previous })}`, positive: down };
  }
  const diff = Math.abs(current - previous);
  if (diff < 0.005) return null;
  return { text: `${arrow} ${fmt(diff)} ${t('gridTiles.vs', { ref: prevLabel, value: fmt(previous) })}`, positive: down };
}

// ── Graphique barres avec axe Y (cliquable) ──────────────────────────────────
// Axe gauche : 3 repères (0 / milieu / max), lignes pointillées, comme les
// deux maquettes de référence. Décalage à gauche (yAxisW) pour loger les
// nombres sans empiéter sur les barres.
const Y_AXIS_W = 20;
function BarChart({ data, color = colors.primary, width = CHART_W, height = CHART_H, labels, onBarPress, highlight = -1, recorded = [] }) {
  if (!data || data.length === 0) return null;
  const chartW = width - Y_AXIS_W;
  const max  = Math.max(...data, 1);
  // Échelle Y arrondie à une dizaine/unité lisible au-dessus du vrai maximum
  const yMax = max <= 5 ? max + 1 : Math.ceil(max * 1.15);
  const barW = (chartW / data.length) * 0.6;
  const gap  = (chartW / data.length) * 0.4;
  const yTicks = [0, Math.round(yMax / 2), yMax];

  return (
    <Svg width={width} height={height + 20}>
      {/* Lignes de repère + labels de l'axe Y */}
      {yTicks.map((tick, i) => {
        const y = height - (tick / yMax) * (height - 8);
        return (
          <G key={`y${i}`}>
            <Path
              d={`M${Y_AXIS_W},${y} L${width},${y}`}
              stroke="#E5E1D3" strokeWidth={1} strokeDasharray={tick === 0 ? '' : '3 3'}
            />
            <SvgText x={Y_AXIS_W - 6} y={y + 3} fontSize={9} fill="#9E9E9E" textAnchor="end">{tick}</SvgText>
          </G>
        );
      })}

      {data.map((v, i) => {
        // Une barre grise représente une période qui n'a pas encore été
        // renseignée. Ce n'est pas une journée à 0 cigarette : elle ne doit
        // donc ni être mise en avant, ni ouvrir un faux détail au toucher.
        const isRecorded = recorded.length === 0 || recorded[i] !== false;
        const barH = (v / yMax) * (height - 8);
        const x    = Y_AXIS_W + i * (barW + gap) + gap / 2;
        const y    = height - barH;
        return (
          <G key={i} onPress={onBarPress && isRecorded ? () => onBarPress(i) : undefined}>
            {/* Zone de toucher pleine hauteur */}
            <Rect x={Y_AXIS_W + i * (barW + gap)} y={0} width={barW + gap} height={height + 20} fill="transparent" />
            <Rect
              x={x} y={Math.max(y, 0)} width={barW} height={Math.max(barH, 2)} rx={3}
              fill={!isRecorded ? '#D1D5DB' : i === highlight ? '#F59E0B' : color}
              opacity={!isRecorded ? 0.65 : 0.85}
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

// ── Tuile de la grille 2×2 (réf. statistiques_reference_B) ──────────────────
const TILE_TONES = {
  green:  { bg: colors.primaryLight, border: '#C8E2CF' },
  orange: { bg: '#FDF0DC', border: '#F0D5A8' },
  purple: { bg: '#EFE8F7', border: '#D9CBEF' },
};
function StatGridTile({ tone, illus, title, value, sub, pill }) {
  const t2 = TILE_TONES[tone] ?? TILE_TONES.green;
  const pillObj = typeof pill === 'string' ? { text: pill, positive: null } : pill;
  return (
    <View style={[styles.tile, { backgroundColor: t2.bg, borderColor: t2.border }]}>
      <View style={styles.tileTop}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Image source={illus} style={styles.tileIllus} resizeMode="contain" />
      </View>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
      {pillObj && (
        <View style={styles.tilePill}>
          <Text style={[
            styles.tilePillText,
            pillObj.positive === true  && { color: colors.primary },
            pillObj.positive === false && { color: colors.danger },
          ]}>{pillObj.text}</Text>
        </View>
      )}
    </View>
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

// ── Calendrier de sélection de période ──────────────────────────────────────
// Modale plein écran avec grille jour par jour : premier tap = début,
// second tap = fin (ou remplace le début si antérieur). Bornée entre le
// premier jour de données enregistrées et aujourd'hui.
function PeriodCalendarModal({ visible, initialStart, initialEnd, minMonth, maxMonth, lang, t, onConfirm, onClose }) {
  const [viewMonth, setViewMonth]     = useState(initialEnd.slice(0, 7));
  const [pendingStart, setPendingStart] = useState(initialStart);
  const [pendingEnd, setPendingEnd]     = useState(initialEnd);

  useEffect(() => {
    if (visible) {
      setViewMonth(initialEnd.slice(0, 7));
      setPendingStart(initialStart);
      setPendingEnd(initialEnd);
    }
  }, [visible]);

  if (!visible) return null;

  const todayKey = isoKey(new Date());
  const weeks = buildMonthGrid(viewMonth);
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(mondayOf(new Date()), i);
    return d.toLocaleDateString(lang, { weekday: 'narrow' }).toUpperCase();
  });

  function handleTapDay(key) {
    if (!key || key > todayKey) return;
    if (!pendingStart || (pendingStart && pendingEnd)) {
      setPendingStart(key); setPendingEnd(null);
    } else if (key < pendingStart) {
      setPendingStart(key); setPendingEnd(null);
    } else {
      setPendingEnd(key);
    }
  }

  const monthLabel = labelMois(viewMonth, lang);
  const canConfirm = !!(pendingStart && pendingEnd);

  return (
    <Modal visible transparent onRequestClose={onClose}>
      <View style={cal.overlay}>
        <View style={cal.card}>
          <Text style={cal.title}>{t('calendar.title')}</Text>
          <Text style={cal.subtitle}>{t('calendar.subtitle')}</Text>

          <View style={cal.navRow}>
            <TouchableOpacity
              style={[cal.navBtn, viewMonth <= minMonth && cal.navBtnDisabled]}
              onPress={() => setViewMonth(stepMonthKey(viewMonth, -1))}
              disabled={viewMonth <= minMonth}
            >
              <Text style={[cal.navBtnText, viewMonth <= minMonth && { color: colors.grayBorder }]}>‹</Text>
            </TouchableOpacity>
            <Text style={cal.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              style={[cal.navBtn, viewMonth >= maxMonth && cal.navBtnDisabled]}
              onPress={() => setViewMonth(stepMonthKey(viewMonth, 1))}
              disabled={viewMonth >= maxMonth}
            >
              <Text style={[cal.navBtnText, viewMonth >= maxMonth && { color: colors.grayBorder }]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={cal.weekdayRow}>
            {weekdayLabels.map((w, i) => (
              <Text key={i} style={cal.weekdayLabel}>{w}</Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={cal.weekRow}>
              {week.map((key, di) => {
                if (!key) return <View key={di} style={cal.dayCell} />;
                const disabled  = key > todayKey;
                const isStart   = key === pendingStart;
                const isEnd     = key === pendingEnd;
                const inRange   = pendingStart && pendingEnd && key > pendingStart && key < pendingEnd;
                const dayNum    = Number(key.slice(8, 10));
                return (
                  <TouchableOpacity
                    key={di}
                    style={cal.dayCell}
                    disabled={disabled}
                    onPress={() => handleTapDay(key)}
                  >
                    <View style={[
                      cal.dayInner,
                      inRange && cal.dayInRange,
                      (isStart || isEnd) && cal.daySelected,
                    ]}>
                      <Text style={[
                        cal.dayText,
                        disabled && cal.dayTextDisabled,
                        (isStart || isEnd) && cal.dayTextSelected,
                      ]}>{dayNum}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={cal.footer}>
            <TouchableOpacity style={cal.cancelBtn} onPress={onClose}>
              <Text style={cal.cancelText}>{t('calendar.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cal.confirmBtn, !canConfirm && cal.confirmBtnDisabled]}
              disabled={!canConfirm}
              onPress={() => onConfirm(pendingStart, pendingEnd)}
            >
              <Text style={cal.confirmText}>{t('calendar.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Modal : définir un objectif d'économies personnalisé ─────────────────────
// Remplace l'échelle de paliers ronds automatique (50 €, 100 €, 250 €…) par un
// vrai montant choisi par l'utilisateur, quand il en a défini un.
function GoalTargetModal({ visible, currentValue, currency, locale, onClose, onSave, t }) {
  const [val, setVal] = useState('');

  useEffect(() => {
    if (visible) setVal(currentValue ? String(currentValue) : '');
  }, [visible, currentValue]);

  if (!visible) return null;

  function handleSave() {
    const n = parseFloat(String(val).replace(',', '.'));
    onSave(!isNaN(n) && n > 0 ? Math.round(n) : null);
    onClose();
  }

  return (
    <Modal visible transparent onRequestClose={onClose}>
      <View style={cal.overlay}>
        <View style={cal.card}>
          <Text style={cal.title}>{t('goalProgress.modalTitle')}</Text>
          <Text style={cal.subtitle}>{t('goalProgress.modalSubtitle')}</Text>
          <View style={goalStyles.inputRow}>
            <TextInput
              style={goalStyles.input}
              value={val}
              onChangeText={setVal}
              keyboardType="decimal-pad"
              placeholder="250"
              placeholderTextColor={colors.gray}
              autoFocus
            />
            <Text style={goalStyles.inputUnit}>{currencySymbol(currency, locale)}</Text>
          </View>
          <View style={cal.footer}>
            <TouchableOpacity style={cal.cancelBtn} onPress={onClose}>
              <Text style={cal.cancelText}>{t('calendar.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cal.confirmBtn} onPress={handleSave}>
              <Text style={cal.confirmText}>{t('common:save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const goalStyles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.md,
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  input: { flex: 1, fontSize: font.lg, fontWeight: '800', color: colors.black, paddingVertical: 12 },
  inputUnit: { fontSize: font.md, color: colors.gray, fontWeight: '600' },
});

const cal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(23, 61, 38, 0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, ...shadow.modal,
  },
  title:    { fontSize: font.md, fontWeight: '900', color: colors.primaryDeep, textAlign: 'center' },
  subtitle: { fontSize: 12, color: colors.gray, textAlign: 'center', marginTop: 2, marginBottom: spacing.md },
  navRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  navBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { backgroundColor: colors.grayLight },
  navBtnText: { fontSize: 18, color: colors.primary, fontWeight: '700', lineHeight: 22 },
  monthLabel: { fontSize: 14, fontWeight: '800', color: colors.black },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: colors.gray },
  weekRow:  { flexDirection: 'row' },
  dayCell:  { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: '78%', height: '78%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayInRange: { backgroundColor: colors.primaryLight, borderRadius: 0 },
  daySelected: { backgroundColor: colors.primary },
  dayText:  { fontSize: 12.5, color: colors.black, fontWeight: '600' },
  dayTextDisabled: { color: colors.grayBorder },
  dayTextSelected: { color: colors.white, fontWeight: '800' },
  footer:   { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelBtn:  { flex: 1, paddingVertical: 13, borderRadius: radius.pill, alignItems: 'center', borderWidth: 1, borderColor: colors.grayBorder },
  cancelText: { fontSize: 14, fontWeight: '700', color: colors.gray },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.primary },
  confirmBtnDisabled: { backgroundColor: colors.grayBorder },
  confirmText: { fontSize: 14, fontWeight: '700', color: colors.white },
});

// ── Écran ─────────────────────────────────────────────────────────────────────
// Les clés (key) des onglets sont des identifiants internes utilisés dans la
// logique de l'écran — seuls les libellés affichés sont traduits (tabs.*).
const TABS = [
  { key: 'jour' },
  { key: 'semaine' },
  { key: 'mois' },
  { key: 'debut' },
];

export default function StatistiquesScreen() {
  const { t, i18n } = useTranslation('statistiques');
  const { stats, profile, updateProfile } = useUser();

  const [activeTab, setActiveTab]     = useState('jour');
  const [dayKey, setDayKey]           = useState(() => isoKey(new Date()));
  const [weekOffset, setWeekOffset]   = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [rangeStartDay, setRangeStartDay] = useState(null); // clé jour "YYYY-MM-DD"
  const [rangeEndDay, setRangeEndDay]     = useState(null);
  const [calendarOpen, setCalendarOpen]   = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  // Index de la barre tapée : affiche le nombre de cigarettes de ce jour
  // directement en overlay, sans changer de page. Remis à zéro dès qu'on
  // change d'onglet ou qu'on navigue vers une autre période.
  const [tappedIndex, setTappedIndex] = useState(null);
  useEffect(() => { setTappedIndex(null); }, [activeTab, weekOffset, monthOffset, rangeStartDay, rangeEndDay]);

  const TAB_LABELS = {
    jour: t('tabs.day'),
    semaine: t('tabs.week'),
    mois: t('tabs.month'),
    debut: t('tabs.period'),
  };
  const weekdaysShort = t('common:weekdaysShort', { returnObjects: true }).map(
    d => d.charAt(0).toUpperCase() + d.slice(1)
  );

  if (!stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}><Text style={styles.headerTitle}>{t('common:tabs.stats')}</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 40 }}>🌿</Text>
          <Text style={{ color: colors.gray, marginTop: 8 }}>{t('common:loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Données de base ──────────────────────────────────────────────────────────
  const { allKeys, allValues, consoAvant, consoEstimee, prixCig, serie, objectifJour, argentEcoCumul, vieGagneeStrCumul, nbJoursEnregistres } = stats;
  const currency = profile?.monnaie ?? 'EUR';
  const hist = Object.fromEntries(allKeys.map((k, i) => [k, allValues[i]]));
  const cigLog   = Array.isArray(profile?.cigLog) ? profile.cigLog : [];
  const now      = new Date();
  const todayKey = isoKey(now);

  const firstDataKey  = allKeys[0] ?? todayKey;
  // Bornes jour à jour de la période libre — par défaut, du premier jour de
  // données enregistrées jusqu'à aujourd'hui. Choisies via le calendrier.
  const rStartDay = rangeStartDay && rangeStartDay >= firstDataKey && rangeStartDay <= todayKey
    ? rangeStartDay : firstDataKey;
  const rEndDay   = rangeEndDay && rangeEndDay >= rStartDay && rangeEndDay <= todayKey
    ? rangeEndDay : todayKey;

  // ── Construction de la vue selon l'onglet ────────────────────────────────────
  let view; // { navLabel, dates, chartData, chartLabels, onBarPress, extra }

  if (activeTab === 'jour') {
    const times = cigLog
      .filter(ts => localDateKey(ts) === dayKey)
      .map(ts => new Date(ts))
      .filter(d => !isNaN(d))
      .sort((a, b) => a - b);
    const bins = Array.from({ length: 24 }, () => 0);
    times.forEach(d => { bins[d.getHours()]++; });
    const countJour = hist[dayKey] ?? 0;
    const sansHeure = Math.max(0, countJour - times.length);

    const hierKey = isoKey(addDays(new Date(dayKey + 'T12:00:00'), -1));
    view = {
      navLabel: labelJourCourt(dayKey, t, i18n.language),
      onPrev: () => setDayKey(isoKey(addDays(new Date(dayKey + 'T12:00:00'), -1))),
      onNext: () => setDayKey(isoKey(addDays(new Date(dayKey + 'T12:00:00'), 1))),
      nextDisabled: dayKey >= todayKey,
      dates: [dayKey],
      chartData: bins,
      chartLabels: Array.from({ length: 24 }, (_, h) => h % 4 === 0 ? `${h}${t('common:hourShort')}` : ''),
      recorded: Array.from({ length: 24 }, () => hist[dayKey] !== undefined),
      heures: times.map(d => `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`),
      sansHeure,
      prevDates: hist[hierKey] !== undefined ? [hierKey] : null,
      prevLabel: t('dates.yesterday'),
    };
  }

  else if (activeTab === 'semaine') {
    const monday = addDays(mondayOf(now), weekOffset * 7);
    const days   = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    const keys   = days.map(isoKey).filter(k => k <= todayKey);
    const allKeys7 = days.map(isoKey);
    const debut = monday.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
    const fin   = addDays(monday, 6).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

    view = {
      navLabel: t('week.rangeLabel', { start: debut, end: fin }),
      onPrev: () => setWeekOffset(o => o - 1),
      onNext: () => setWeekOffset(o => o + 1),
      nextDisabled: weekOffset >= 0,
      dates: keys,
      chartData: allKeys7.map(k => hist[k] ?? 0),
      chartLabels: weekdaysShort,
      recorded: allKeys7.map(k => hist[k] !== undefined),
      onBarPress: i => {
        if (allKeys7[i] <= todayKey && hist[allKeys7[i]] !== undefined) setTappedIndex(i);
      },
      fullLabel: i => {
        const s = days[i].toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
      },
      onDrillDown: i => { setDayKey(allKeys7[i]); setActiveTab('jour'); setTappedIndex(null); },
      tapHint: t('tapHint.day'),
      prevDates: Array.from({ length: 7 }, (_, i) => isoKey(addDays(monday, i - 7))).filter(k => hist[k] !== undefined),
      prevLabel: t('week.previous'),
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
      navLabel: labelMois(mKey, i18n.language),
      onPrev: () => setMonthOffset(o => o - 1),
      onNext: () => setMonthOffset(o => o + 1),
      nextDisabled: monthOffset >= 0,
      dates: keys,
      chartData: allKeysM.map(k => hist[k] ?? 0),
      chartLabels: allKeysM.map((k, i) => (i + 1) % 5 === 0 || i === 0 ? String(i + 1) : ''),
      recorded: allKeysM.map(k => hist[k] !== undefined),
      onBarPress: i => {
        if (allKeysM[i] <= todayKey && hist[allKeysM[i]] !== undefined) setTappedIndex(i);
      },
      fullLabel: i => {
        const s = new Date(allKeysM[i] + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
      },
      onDrillDown: i => { setDayKey(allKeysM[i]); setActiveTab('jour'); setTappedIndex(null); },
      tapHint: t('tapHint.day'),
      comparaison: sumPrev > 0
        ? t('month.comparison', {
            month: labelMois(pKey, i18n.language),
            count: sumPrev,
            arrow: sumCur <= sumPrev ? '↓' : '↑',
            percent: Math.abs(Math.round(((sumCur - sumPrev) / sumPrev) * 100)),
          })
        : null,
      prevDates: Array.from({ length: nbPrev }, (_, i) => `${pKey}-${String(i + 1).padStart(2, '0')}`).filter(k => hist[k] !== undefined),
      prevLabel: labelMois(pKey, i18n.language),
    };
  }

  else { // 'debut' — période libre, choisie jour par jour via le calendrier
    const months = monthsBetween(rStartDay.slice(0, 7), rEndDay.slice(0, 7));
    const dates  = [];
    for (let cursor = new Date(rStartDay + 'T12:00:00'), end = new Date(rEndDay + 'T12:00:00');
         cursor <= end; cursor = addDays(cursor, 1)) {
      dates.push(isoKey(cursor));
    }
    const monthSums = months.map(mKey =>
      dates.filter(k => k.startsWith(mKey)).map(k => hist[k] ?? 0).reduce((s, v) => s + v, 0)
    );
    const monthRecorded = months.map(mKey =>
      dates.some(k => k.startsWith(mKey) && hist[k] !== undefined)
    );

    view = {
      dates,
      chartData: monthSums,
      recorded: monthRecorded,
      chartLabels: months.map(mKey =>
        new Date(mKey + '-15T12:00:00').toLocaleDateString(i18n.language, { month: 'short' })
      ),
      onBarPress: i => { if (monthRecorded[i]) setTappedIndex(i); },
      fullLabel: i => {
        const s = new Date(months[i] + '-15T12:00:00').toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
        return s.charAt(0).toUpperCase() + s.slice(1);
      },
      onDrillDown: i => {
        const [y, m] = months[i].split('-').map(Number);
        setMonthOffset((y - now.getFullYear()) * 12 + (m - 1 - now.getMonth()));
        setActiveTab('mois');
        setTappedIndex(null);
      },
      tapHint: t('tapHint.month'),
      isRange: true,
      months,
    };
  }

  const p  = periodStats(view.dates, hist, consoAvant, prixCig);
  // Stats de la période précédente équivalente (hier / semaine dernière / mois
  // dernier), pour les pastilles de comparaison façon maquette.
  const p2 = (view.prevDates && view.prevDates.length > 0)
    ? periodStats(view.prevDates, hist, consoAvant, prixCig)
    : null;
  const hasPeriodData = p.nbEnregistres > 0;

  // Navigation des bornes de la période libre
  const periodeLabel = TAB_LABELS[activeTab];
  const fmtMoney = n => formatCurrency(n, currency, i18n.language);
  const referenceLabel = consoEstimee ? t('referenceEstimated') : t('vsBeforeApp');

  // Objectif d'économies (réf. "Progression vers votre objectif") : si
  // l'utilisateur a défini un montant cible réel (profile.objectifEconomie,
  // réglable depuis cette carte), on l'utilise tel quel. Sinon, on retombe
  // sur le prochain jalon rond au-dessus des économies déjà réalisées —
  // motivant et toujours honnête vis-à-vis des vraies données, en l'absence
  // de vrai objectif personnalisé.
  const objectifEconomiePerso = profile?.objectifEconomie > 0 ? profile.objectifEconomie : null;
  const goalTarget    = objectifEconomiePerso ?? nextMilestone(argentEcoCumul);
  const goalPct       = goalTarget > 0 ? Math.min(100, Math.round((argentEcoCumul / goalTarget) * 100)) : 0;
  const goalRemaining = Math.max(0, goalTarget - argentEcoCumul);
  const goalReached   = argentEcoCumul >= goalTarget;

  // Rythme d'économie moyen depuis le début (basé sur les jours réellement
  // renseignés, comme le reste des stats cumulées) → projection concrète du
  // nombre de jours restants pour atteindre le palier, plutôt qu'une barre
  // de progression sans indication de "quoi faire pour y arriver".
  const goalDailyRate = nbJoursEnregistres > 0 ? argentEcoCumul / nbJoursEnregistres : 0;
  const goalEtaDays    = goalDailyRate > 0 ? Math.ceil(goalRemaining / goalDailyRate) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('common:tabs.stats')}</Text>
        <Image source={UI.mascotte_entete} style={styles.headerMascotte} resizeMode="contain" />
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {TAB_LABELS[tab.key]}
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
          <TouchableOpacity style={styles.rangeBtn} onPress={() => setCalendarOpen(true)} activeOpacity={0.7}>
            <Text style={styles.rangeBtnIcon}>📅</Text>
            <Text style={styles.rangeBtnText}>
              {new Date(rStartDay + 'T12:00:00').toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}
              {'  →  '}
              {new Date(rEndDay + 'T12:00:00').toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Text style={styles.rangeBtnChevron}>›</Text>
          </TouchableOpacity>
        )}

        <PeriodCalendarModal
          visible={calendarOpen}
          initialStart={rStartDay}
          initialEnd={rEndDay}
          minMonth={firstDataKey.slice(0, 7)}
          maxMonth={todayKey.slice(0, 7)}
          lang={i18n.language}
          t={t}
          onClose={() => setCalendarOpen(false)}
          onConfirm={(start, end) => {
            setRangeStartDay(start);
            setRangeEndDay(end);
            setCalendarOpen(false);
          }}
        />

        {consoEstimee && (
          <View style={styles.referenceNotice}>
            <Text style={styles.referenceNoticeText}>{t('referenceEstimatedNotice')}</Text>
          </View>
        )}

        {/* ── Consommation (graphique) — réf. "Consommation par heure" ── */}
        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <View style={styles.chartHeaderLeft}>
              <View style={styles.chartIconCircle}>
                <Image source={UI.resume_graphique} style={styles.chartIconIllus} resizeMode="contain" />
              </View>
              <Text style={styles.cardTitle}>{t('smokedCard.chartTitle')}</Text>
            </View>
            <View style={styles.chartTag}>
              <Text style={styles.chartTagText}>{t('smokedCard.title')}</Text>
            </View>
          </View>
          <View style={styles.chartContainer}>
            <BarChart
              data={view.chartData}
              labels={view.chartLabels}
              color={colors.primary}
              onBarPress={view.onBarPress}
              highlight={tappedIndex ?? -1}
              recorded={view.recorded}
            />
          </View>
          {view.recorded?.some(isRecorded => !isRecorded) && (
            <Text style={styles.unreportedLegend}>● {t('smokedCard.unreportedLegend')}</Text>
          )}

          {/* Bannière conseil sous le graphique (réf. maquette) */}
          <View style={styles.chartTip}>
            <Text style={styles.chartTipIcon}>🍃</Text>
            <Text style={styles.chartTipText}>
              {p.progression >= 0 ? t('smokedCard.tipPositive') : t('smokedCard.tipNegative')}
            </Text>
          </View>

          {/* Overlay : nombre de cigarettes du jour/mois tapé, sans changer de page */}
          {tappedIndex != null && view.fullLabel && (
            <View style={styles.tapOverlay}>
              <Image source={UI.cigarette} style={styles.tapOverlayIllus} resizeMode="contain" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.tapOverlayLabel}>{view.fullLabel(tappedIndex)}</Text>
                <Text style={styles.tapOverlayValue}>
                  {view.chartData[tappedIndex]} {t('common:cigarette', { count: view.chartData[tappedIndex] })}
                </Text>
              </View>
              {view.onDrillDown && (
                <TouchableOpacity onPress={() => view.onDrillDown(tappedIndex)}>
                  <Text style={styles.tapOverlayLink}>{t('tapOverlay.seeDetail')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {view.tapHint && tappedIndex == null && <Text style={styles.tapHint}>👆 {view.tapHint}</Text>}

          {/* Détail horaire (onglet Jour) */}
          {activeTab === 'jour' && (
            <View style={styles.heuresBox}>
              {view.heures.length > 0 ? (
                <>
                  <Text style={styles.heuresTitre}>{t('smokedCard.hoursTitle')}</Text>
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
                    ? t('smokedCard.hoursNotRecorded')
                    : t('smokedCard.noCigarettesToday')}
                </Text>
              )}
              {view.sansHeure > 0 && view.heures.length > 0 && (
                <Text style={styles.heuresVide}>{t('smokedCard.withoutHourCount', { count: view.sansHeure })}</Text>
              )}
            </View>
          )}

          {/* Comparaison mois précédent */}
          {activeTab === 'mois' && view.comparaison && (
            <Text style={styles.comparaison}>{view.comparaison}</Text>
          )}
        </View>

        {/* ── Total / Moyenne quotidienne / Diminution (réf. maquette) ── */}
        <View style={styles.threeColCard}>
          <View style={styles.threeCol}>
            <Text style={styles.threeColLabel}>{t('smokedCard.totalLabel')}</Text>
            <Text style={styles.threeColValue}>{hasPeriodData ? p.sum.toLocaleString(i18n.language) : '—'}</Text>
            <Text style={styles.threeColUnit}>{t('smokedCard.unit')}</Text>
          </View>
          <View style={styles.threeColDiv} />
          <View style={styles.threeCol}>
            <Text style={styles.threeColLabel}>{t('smokedCard.avgLabel')}</Text>
            <Text style={styles.threeColValue}>{hasPeriodData ? (p.sum / p.n).toFixed(1) : '—'}</Text>
            <Text style={styles.threeColUnit}>{t('smokedCard.unit')}</Text>
          </View>
          <View style={styles.threeColDiv} />
          <View style={styles.threeCol}>
            <Text style={styles.threeColLabel}>{t('smokedCard.decreaseLabel')}</Text>
            {hasPeriodData ? (() => {
              const cur  = p2 ? p.sum : p.sum;
              const ref  = p2 ? p2.sum : (p.n * consoAvant);
              const down = cur <= ref;
              const pct  = ref > 0 ? Math.round((Math.abs(cur - ref) / ref) * 100) : 0;
              return (
                <Text style={[styles.threeColValue, { color: down ? colors.primary : colors.danger, fontSize: 22 }]}>
                  {down ? '↓' : '↑'} {pct}%
                </Text>
              );
            })() : <Text style={[styles.threeColValue, { color: colors.gray, fontSize: 22 }]}>—</Text>}
            <Text style={styles.threeColUnit}>{view.prevLabel ?? referenceLabel}</Text>
          </View>
        </View>

        {/* ── Grille 2×2 : Cigarettes / Argent dépensé / Argent économisé / Vie récupérée
              (réf. maquette statistiques_reference_B) ── */}
        <View style={styles.grid2}>
          <StatGridTile
            tone="green" illus={UI.paquet_cigarettes_feuilles}
            title={t('smokedCard.title')} value={hasPeriodData ? p.sum.toLocaleString(i18n.language) : '—'}
            sub={periodeLabel}
            pill={p2 ? pillDelta(p.sum, p2.sum, 'percent', view.prevLabel, t) : null}
          />
          <StatGridTile
            tone="orange" illus={UI.portefeuille}
            title={t('moneyCard.spentTitle')} value={hasPeriodData ? fmtMoney(p.argDep) : '—'}
            sub={periodeLabel}
            pill={p2 ? pillDelta(p.argDep, p2.argDep, 'amount', view.prevLabel, t, fmtMoney) : null}
          />
          <StatGridTile
            tone="green" illus={UI.bocal_economies}
            title={t('moneyCard.savedTitle')} value={hasPeriodData ? fmtMoney(p.argEco) : '—'}
            sub={periodeLabel}
            pill={t('gridTiles.cumulMoney', { amount: fmtMoney(argentEcoCumul) })}
          />
          <StatGridTile
            tone="purple" illus={UI.sablier_vie}
            title={t('lifeCard.title')} value={hasPeriodData ? fmtVie(p.vieMins) : '—'}
            sub={periodeLabel}
            pill={t('gridTiles.cumulLife', { value: vieGagneeStrCumul })}
          />
        </View>

        {/* ── Progression vers votre objectif (palier d'économies, réf. maquette) ── */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Image source={UI.bocal_economies} style={styles.progressTitleIcon} resizeMode="contain" />
              <Text style={styles.cardTitle}>{t(objectifEconomiePerso ? 'goalProgress.titleCustom' : 'goalProgress.title')}</Text>
            </View>
            <Text style={styles.progressAmounts}>{fmtMoney(argentEcoCumul)} / {fmtMoney(goalTarget)}</Text>
          </View>
          <View style={styles.progressBarRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${goalPct}%` }]} />
            </View>
            <Image source={UI.drapeau_jalon} style={styles.progressFlag} resizeMode="contain" />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressPct}>{goalPct}% {t('goalProgress.reached')}</Text>
            <Text style={styles.progressRemaining}>
              {goalReached ? t('goalProgress.goalReached') : t('goalProgress.remaining', { amount: fmtMoney(goalRemaining) })}
            </Text>
          </View>
          {/* Quoi faire pour y arriver, pas juste où on en est : rythme moyen
              réel + projection du nombre de jours restants au même rythme. */}
          {!goalReached && (
            <Text style={styles.progressHint}>
              {goalEtaDays != null
                ? t('goalProgress.etaHint', {
                    rate: fmtMoney(goalDailyRate),
                    days: goalEtaDays,
                    unit: t('common:day', { count: goalEtaDays }),
                  })
                : t('goalProgress.noProgressHint')}
            </Text>
          )}
          <TouchableOpacity onPress={() => setGoalModalOpen(true)} style={styles.progressEditBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.progressEditText}>
              {objectifEconomiePerso ? t('goalProgress.editGoal') : t('goalProgress.setGoal')}
            </Text>
          </TouchableOpacity>
        </View>

        <GoalTargetModal
          visible={goalModalOpen}
          currentValue={objectifEconomiePerso}
          currency={currency}
          locale={i18n.language}
          onClose={() => setGoalModalOpen(false)}
          onSave={v => updateProfile({ objectifEconomie: v })}
          t={t}
        />

        {/* ── Objectif (réf. "Objectif du jour" de la maquette) ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Image source={UI.cible_objectif} style={styles.cardIllus} resizeMode="contain" />
            <Text style={styles.cardTitle}>
              {activeTab === 'jour' ? t('goalCard.titleDay') : t('goalCard.titleAverage')}
            </Text>
          </View>
          <Text style={styles.goalSub}>{t('goalCard.stayUnder', { count: objectifJour })}</Text>
          <View style={styles.goalRow}>
            <Text style={styles.goalFraction}>
              {hasPeriodData ? (activeTab === 'jour' ? p.sum : (p.sum / p.n).toFixed(1)) : '—'}
              <Text style={styles.goalFractionTotal}> / {objectifJour}</Text>
            </Text>
            <Text style={[styles.goalMsg, { color: !hasPeriodData ? colors.gray : (activeTab === 'jour' ? p.sum : p.sum / p.n) <= objectifJour ? colors.primary : colors.danger }]}>
              {!hasPeriodData ? t('goalCard.noData') : (activeTab === 'jour' ? p.sum : p.sum / p.n) <= objectifJour ? t('goalCard.onTrack') : t('goalCard.overGoal')}
            </Text>
          </View>
        </View>

        {/* ── Résumé narratif (pas de liste à puces — réf. maquette) ── */}
        <View style={styles.summaryCard}>
          <Image source={UI.pousse_resume} style={styles.summaryIllus} resizeMode="contain" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.summaryTitle}>{t('summaryCard.title')}</Text>
            <Text style={styles.summaryText}>
              {hasPeriodData ? t('summaryCard.narrative', {
                count: p.sum,
                unit: t('common:cigarette', { count: p.sum }),
                comparison: (p2 && p.sum !== p2.sum)
                  ? t('summaryCard.narrativeComparison', {
                      diff: Math.abs(p.sum - p2.sum),
                      unit: t('common:cigarette', { count: Math.abs(p.sum - p2.sum) }),
                      dir: p.sum <= p2.sum ? t('summaryCard.less') : t('summaryCard.more'),
                      ref: view.prevLabel ? view.prevLabel.charAt(0).toLowerCase() + view.prevLabel.slice(1) : '',
                    })
                  : '',
                moneyPhrase: p.argEco >= 0
                  ? t('summaryCard.moneySavedPhrase', { amount: fmtMoney(p.argEco) })
                  : t('summaryCard.moneyOverspentPhrase', { amount: fmtMoney(Math.abs(p.argEco)) }),
                lifePhrase: p.vieMins >= 0
                  ? t('summaryCard.lifeGainedPhrase', { value: fmtVie(p.vieMins).replace(/^\+/, '') })
                  : t('summaryCard.lifeLostPhrase', { value: fmtVie(p.vieMins).replace(/^-/, '') }),
              }) : t('summaryCard.noData')}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cream },
  headerTitle: { fontSize: font.xl, fontWeight: '900', color: colors.primaryDeep },
  headerMascotte: { width: 48, height: 48 },
  tabBar: { flexDirection: 'row', backgroundColor: colors.primaryLight, marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: 4, gap: 4, borderRadius: radius.pill },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  tabActive:    { backgroundColor: colors.primary },
  tabText:      { fontSize: 12, fontWeight: '600', color: colors.primaryDeep },
  tabTextActive:{ color: colors.white, fontWeight: '700' },
  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: 90 },
  referenceNotice: { backgroundColor: '#FEF3C7', borderRadius: radius.md, borderWidth: 1, borderColor: '#FDE68A', padding: spacing.sm },
  referenceNoticeText: { color: '#854D0E', fontSize: 11, lineHeight: 15, textAlign: 'center' },
  card:   { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.grayBorder, ...shadow.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  cardIcon:   { fontSize: 18 },
  cardIllus:  { width: 28, height: 28 },
  cardTitle:  { fontSize: font.sm, fontWeight: '700', color: colors.black, flex: 1 },
  cardPeriod: { fontSize: 11, color: colors.gray },

  // Navigation de période
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: 6, paddingVertical: 6, flex: 1,
    borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  navBtnDisabled: { backgroundColor: colors.grayLight },
  navBtnText: { fontSize: 20, color: colors.primary, fontWeight: '600', lineHeight: 24 },
  navLabel:   { fontSize: 13, fontWeight: '700', color: colors.black },

  rangeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },
  rangeBtnIcon: { fontSize: 16 },
  rangeBtnText: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.black },
  rangeBtnChevron: { fontSize: 18, color: colors.gray },

  bigStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
  bigNumber:  { fontSize: 40, fontWeight: '900', color: colors.primary, lineHeight: 44 },
  bigUnit:    { fontSize: 12, color: colors.gray },
  badgeCol:   { alignItems: 'flex-end' },
  badgeGreen: { fontSize: 16, fontWeight: '800', color: colors.primary },
  badgeSub:   { fontSize: 11, color: colors.gray },
  chartContainer: { marginTop: 4 },
  unreportedLegend: { fontSize: 10, color: '#9CA3AF', marginTop: 2, textAlign: 'right' },
  tapHint: { fontSize: 10, color: colors.gray, textAlign: 'center', marginTop: 6 },

  // Overlay affiché au tap d'une barre (nombre de cigarettes, sans navigation)
  tapOverlay: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, marginTop: 10,
  },
  tapOverlayIllus: { width: 28, height: 28, flexShrink: 0 },
  tapOverlayLabel: { fontSize: 11, color: colors.gray },
  tapOverlayValue: { fontSize: 15, fontWeight: '800', color: colors.primaryDeep, marginTop: 1 },
  tapOverlayLink:  { fontSize: 11, color: colors.primary, fontWeight: '700', textAlign: 'right' },

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

  // Argent — comparaison Avant / Avec l'app (delta explicite)
  moneyCompare: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  moneyBox: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.lg,
    paddingVertical: spacing.sm, alignItems: 'center', gap: 2,
  },
  moneyBoxIllus: { width: 34, height: 34, marginBottom: 2 },
  moneyBoxLabel: { fontSize: 11, color: colors.gray },
  moneyBoxCigs:  { fontSize: 13, fontWeight: '700', color: colors.black, marginTop: 4 },
  moneyBoxValue: { fontSize: 15, fontWeight: '800', color: colors.primaryDeep, marginTop: 1 },
  moneyArrow:    { fontSize: 20, color: colors.primary, fontWeight: '800' },
  moneyResult: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.md,
  },
  moneyResultNegative: { backgroundColor: '#FBE9E7' },
  moneyResultIllus: { width: 40, height: 40, flexShrink: 0 },
  moneyResultValue: { fontSize: 22, fontWeight: '900', color: colors.primaryDeep },
  moneyResultLabel: { fontSize: 12, color: colors.gray, marginTop: 2 },
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

  // Grille 2×2 (réf. statistiques_reference_B)
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: (SCREEN_W - spacing.md * 2 - spacing.sm) / 2,
    borderRadius: radius.lg, borderWidth: 1.5,
    padding: 12,
  },
  tileTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
  tileTitle: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.black, lineHeight: 15 },
  tileIllus: { width: 58, height: 58, marginLeft: 4 },
  tileValue: { fontSize: 22, fontWeight: '900', color: colors.primaryDeep },
  tileSub:   { fontSize: 11, color: colors.gray, marginTop: 1, marginBottom: spacing.sm },
  tilePill:  { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radius.full, paddingVertical: 4, paddingHorizontal: 8, alignSelf: 'flex-start' },
  tilePillText: { fontSize: 10, fontWeight: '700', color: colors.black },

  // Objectif du jour / moyen
  goalSub: { fontSize: 12, color: colors.gray, marginBottom: spacing.sm },
  goalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  goalFraction: { fontSize: 30, fontWeight: '900', color: colors.primaryDeep },
  goalFractionTotal: { fontSize: 16, fontWeight: '600', color: colors.gray },
  goalMsg: { fontSize: 13, fontWeight: '700' },

  // Résumé narratif
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },
  summaryIllus: { width: 40, height: 40, flexShrink: 0 },
  summaryTitle: { fontSize: font.sm, fontWeight: '800', color: colors.primaryDeep, marginBottom: 4 },
  summaryText:  { fontSize: 12, color: colors.black, lineHeight: 18 },

  // En-tête de la carte graphique (icône ronde + titre + tag "Cigarettes fumées")
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  chartHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
  chartIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  chartIconIllus:  { width: 20, height: 20 },
  chartTag:     { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  chartTagText: { fontSize: 11, fontWeight: '700', color: colors.primaryDeep },

  // Bannière conseil sous le graphique
  chartTip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  chartTipIcon: { fontSize: 14 },
  chartTipText: { flex: 1, fontSize: 11, color: colors.primaryDeep, fontWeight: '600' },

  // Carte 3 colonnes : Total / Moyenne quotidienne / Diminution
  threeColCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.xl,
    paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },
  threeCol:    { flex: 1, alignItems: 'center' },
  threeColDiv: { width: 1, height: 44, backgroundColor: colors.grayBorder },
  threeColLabel: { fontSize: 10, color: colors.gray, textAlign: 'center', marginBottom: 4 },
  threeColValue: { fontSize: 24, fontWeight: '900', color: colors.primaryDeep },
  threeColUnit:  { fontSize: 11, color: colors.gray, marginTop: 2 },

  // Barre de progression vers le prochain palier d'économies
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: spacing.sm },
  progressTitleIcon: { width: 22, height: 22 },
  progressAmounts: { fontSize: 12, color: colors.gray, fontWeight: '600' },
  progressBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 10, backgroundColor: colors.primaryLight, borderRadius: 5, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  progressFlag:  { width: 22, height: 22 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  progressPct:   { fontSize: 12, fontWeight: '700', color: colors.primaryDeep },
  progressRemaining: { fontSize: 12, color: colors.gray },
  progressHint:  { fontSize: 12, color: colors.gray, marginTop: spacing.xs, fontStyle: 'italic' },
  progressEditBtn:  { alignSelf: 'flex-start', marginTop: spacing.sm },
  progressEditText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
