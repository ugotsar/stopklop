import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Modal,
} from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius, shadow, getScreenWidth } from '../theme';
import { UI } from '../assets/uiKit';

const SCREEN_W = getScreenWidth();
const CHART_W = SCREEN_W - spacing.md * 4;
const CHART_H = 80;

// ── Graphique projection "zone de gain" ─────────────────────────────────────
// Deux courbes qui mesurent la MÊME chose (argent brûlé cumulé) : la rouge
// plonge si on continue, la verte s'aplatit quand le plan atteint 0 cigarette.
// L'espace entre les deux = l'argent qui reste dans la poche.
function ProjectionChart({ badSerie, planSerie, gain, width = CHART_W, height = 120 }) {
  const { t, i18n } = useTranslation('plan');
  const bad  = badSerie  ?? [0, -100];
  const plan = planSerie ?? [0, -40];

  const min = Math.min(...bad, ...plan);
  const range = -min || 1;
  const step = width / (bad.length - 1);

  function toY(v) {
    return 8 + ((-v) / range) * (height - 16);
  }
  const toPath = serie => serie
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(' ');

  const badPath  = toPath(bad);
  const planPath = toPath(plan);
  const lastX    = (bad.length - 1) * step;
  const zeroY    = toY(0);

  // Zone de gain : entre la courbe du plan (haut) et celle du laisser-aller (bas)
  const planPts = plan.map((v, i) => `${(i * step).toFixed(1)},${toY(v).toFixed(1)}`);
  const badPts  = [...bad].reverse().map((v, i) => `${((bad.length - 1 - i) * step).toFixed(1)},${toY(v).toFixed(1)}`);
  const zonePath = `M${planPts.join(' L')} L${badPts.join(' L')} Z`;

  // Position du libellé au centre de la zone
  const midIdx = Math.floor(bad.length * 0.62);
  const midY   = (toY(bad[midIdx]) + toY(plan[midIdx])) / 2;

  return (
    <Svg width={width} height={height + 18}>
      {/* Ligne du départ (0 € brûlé) */}
      <Path d={`M0,${zeroY} L${width},${zeroY}`} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 4" />

      {/* Zone de gain peinte en vert */}
      <Path d={zonePath} fill={colors.primary} opacity={0.14} />

      {/* Courbes */}
      <Path d={badPath}  stroke="#EF4444" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <Path d={planPath} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Libellé du gain, au cœur de la zone */}
      <SvgText x={width * 0.60} y={midY} fontSize={12} fontWeight="700" fill={colors.primaryDeep} textAnchor="middle">
        {`💚 ${new Intl.NumberFormat(i18n.language).format(gain)} € ${t('projection.chartRemaining')}`}
      </SvgText>
      <SvgText x={width * 0.60} y={midY + 13} fontSize={11} fontWeight="700" fill={colors.primaryDeep} textAnchor="middle">
        {t('projection.chartInPocket')}
      </SvgText>

      {/* Points de départ et d'arrivée */}
      <Circle cx={0}     cy={zeroY}                      r={4}   fill={colors.gray} />
      <Circle cx={lastX} cy={toY(bad[bad.length - 1])}   r={4.5} fill="#EF4444" />
      <Circle cx={lastX} cy={toY(plan[plan.length - 1])} r={4.5} fill={colors.primary} />

      {/* Repères temporels */}
      <SvgText x={0}         y={height + 14} fontSize={9} fill="#9E9E9E" textAnchor="start">{t('recommendedPlan.today')}</SvgText>
      <SvgText x={width / 2} y={height + 14} fontSize={9} fill="#9E9E9E" textAnchor="middle">{t('projection.chartSixMonths')}</SvgText>
      <SvgText x={width}     y={height + 14} fontSize={9} fill="#9E9E9E" textAnchor="end">{t('projection.chartOneYear')}</SvgText>
    </Svg>
  );
}

// ── Équivalence concrète du gain ────────────────────────────────────────────
function equivalenceGain(gain, t) {
  if (gain >= 3000) return t('equivalence.trip');
  if (gain >= 2000) return t('equivalence.flight');
  if (gain >= 1200) return t('equivalence.vacation');
  if (gain >= 600)  return t('equivalence.smartphone');
  if (gain >= 250)  return t('equivalence.restaurants');
  if (gain > 0)     return t('equivalence.small');
  return null;
}

// ── Ligne du bilan de projection ────────────────────────────────────────────
function LigneProjection({ icone, iconeBg, iconeCouleur, titre, sous, valeur, valeurCouleur }) {
  return (
    <View style={styles.ligneProj}>
      <View style={[styles.ligneProjIcone, { backgroundColor: iconeBg }]}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: iconeCouleur }}>{icone}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.ligneProjTitre}>{titre}</Text>
        <Text style={styles.ligneProjSous}>{sous}</Text>
      </View>
      <Text style={[styles.ligneProjValeur, { color: valeurCouleur }]}>{valeur}</Text>
    </View>
  );
}

// ── Illustrations 3D des déclencheurs d'envie (kit UI, page 09) — le texte
// vient de i18n. Mêmes assets + couleurs que la grille de sélection, pour
// rester cohérent partout dans l'app.
const TRIGGER_META = {
  stress:   UI.trig_stress,
  ennui:    UI.trig_ennui,
  cafe:     UI.trig_cafe,
  repas:    UI.trig_repas,
  social:   UI.trig_entourage,
  alcool:   UI.trig_alcool,
  habitude: UI.trig_habitude,
  autre:    UI.trig_autre,
};

// ── Modal explicative d'une carte impact (refonte kit UI 05/06/07/08) ────────
// 4 layouts distincts selon info.type :
//   'savings'   → écran 05 : argent économisé (calcul + 3 projections)
//   'lifeMonth' → écran 06 : vie récupérée par mois
//   'lifeYear'  → écran 07 : vie récupérée par an
//   'health'    → écran 08 : bénéfices santé (frise verticale des jalons)
function ImpactModal({ info, onClose }) {
  const { t } = useTranslation('plan');
  // Démonter entièrement plutôt que garder un <Modal visible={false}> monté :
  // sur web, react-native-web peut laisser une couche invisible qui
  // intercepte les clics de l'écran en dessous tant que le composant reste monté.
  if (!info) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <ScrollView
        style={im.overlay}
        contentContainerStyle={im.overlayContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={im.card}>
          {info.type === 'savings'   && <SavingsBody info={info} t={t} />}
          {info.type === 'lifeMonth' && <LifeMonthBody info={info} t={t} />}
          {info.type === 'lifeYear'  && <LifeYearBody info={info} t={t} />}
          {info.type === 'health'    && <HealthBody info={info} t={t} />}
          {!info.type && <GenericBody info={info} />}

          <TouchableOpacity style={im.btn} onPress={onClose}>
            <Text style={im.btnText}>{t('impact.gotIt')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

// ── Body : Argent économisé (écran 05) ───────────────────────────────────────
function SavingsBody({ info, t }) {
  return (
    <>
      <View style={im.headerRow}>
        <Image source={UI.sac_euros} style={im.headerIllus} resizeMode="contain" />
        <Text style={im.titre}>{info.titre}</Text>
      </View>

      {/* Avant / Après */}
      {info.savings && (
        <View style={im.beforeAfter}>
          <View style={im.baBox}>
            <Image source={UI.paquet_avant} style={im.baIllus} resizeMode="contain" />
            <Text style={im.baLabel}>{t('impact.savings.beforeLabel')}</Text>
            <Text style={im.baValue}>{info.savings.consoAvant}</Text>
            <Text style={im.baUnit}>{t('impact.savings.unitPerDay')}</Text>
          </View>
          <Text style={im.baArrow}>→</Text>
          <View style={im.baBox}>
            <Image source={UI.cible_objectif} style={im.baIllus} resizeMode="contain" />
            <Text style={im.baLabel}>{t('impact.savings.goalLabel')}</Text>
            <Text style={im.baValue}>{info.savings.objectif}</Text>
            <Text style={im.baUnit}>{t('impact.savings.unitPerDay')}</Text>
          </View>
        </View>
      )}

      {info.savings && (
        <View style={im.evitees}>
          <Image source={UI.feuille_cigarettes_evitees} style={{ width: 40, height: 40 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={im.eviteesValue}>{t('impact.savings.avoidedPerDay', { count: info.savings.cigEviteesJour })}</Text>
            <Text style={im.eviteesLabel}>{t('impact.savings.avoidedSub')}</Text>
          </View>
        </View>
      )}

      {/* Formule */}
      {info.formula && (
        <View style={im.formulaBox}>
          <Image source={UI.calculatrice} style={{ width: 30, height: 30 }} resizeMode="contain" />
          <Text style={im.formulaText}>{info.formula}</Text>
        </View>
      )}

      {/* 3 projections */}
      {info.projections && (
        <View style={im.projRow}>
          {[UI.calendrier_mois, UI.arbre_annee, UI.montagnes_10_ans].map((img, i) => info.projections[i] && (
            <View key={i} style={im.projCard}>
              <Image source={img} style={im.projIllus} resizeMode="contain" />
              <Text style={im.projValue}>{info.projections[i].valeur}</Text>
              <Text style={im.projLabel}>{info.projections[i].label}</Text>
            </View>
          ))}
        </View>
      )}

      {info.note && <Text style={im.note}>{info.note}</Text>}
    </>
  );
}

// ── Body : Vie récupérée par mois (écran 06) ─────────────────────────────────
function LifeMonthBody({ info, t }) {
  return (
    <>
      <View style={im.headerRow}>
        <Image source={UI.chronometre} style={im.headerIllus} resizeMode="contain" />
        <Text style={im.titre}>{info.titre}</Text>
      </View>

      <Text style={im.explication}>{info.explication}</Text>

      {info.projections && (
        <View style={im.projRow}>
          {[UI.horloge_mois, UI.feuille_annee, UI.coeur_10_ans].map((img, i) => info.projections[i] && (
            <View key={i} style={im.projCard}>
              <Image source={img} style={im.projIllus} resizeMode="contain" />
              <Text style={im.projValue}>{info.projections[i].valeur}</Text>
              <Text style={im.projLabel}>{info.projections[i].label}</Text>
            </View>
          ))}
        </View>
      )}

      {info.note && <Text style={im.note}>{info.note}</Text>}
    </>
  );
}

// ── Body : Vie récupérée par an (écran 07) ───────────────────────────────────
function LifeYearBody({ info, t }) {
  return (
    <>
      <View style={im.headerRow}>
        <Image source={UI.coeur_titre} style={im.headerIllus} resizeMode="contain" />
        <Text style={im.titre}>{info.titre}</Text>
      </View>

      <Text style={im.explication}>{info.explication}</Text>

      {info.projections && (
        <View style={im.projRow}>
          {[UI.feuille_annee, UI.calendrier_10_ans, UI.etoile_vie].map((img, i) => info.projections[i] && (
            <View key={i} style={im.projCard}>
              <Image source={img} style={im.projIllus} resizeMode="contain" />
              <Text style={im.projValue}>{info.projections[i].valeur}</Text>
              <Text style={im.projLabel}>{info.projections[i].label}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

// ── Body : Bénéfices santé (écran 08) ────────────────────────────────────────
// Frise verticale des jalons santé.
function HealthBody({ info, t }) {
  const milestones = [
    { img: UI.jalon_20min_coeur,  time: t('impact.health.timeline.t20min'),  label: t('impact.health.timeline.l20min') },
    { img: UI.jalon_8h_sang,      time: t('impact.health.timeline.t8h'),     label: t('impact.health.timeline.l8h') },
    { img: UI.jalon_24h_coeur,    time: t('impact.health.timeline.t24h'),    label: t('impact.health.timeline.l24h') },
    { img: UI.jalon_48h_odorat,   time: t('impact.health.timeline.t48h'),    label: t('impact.health.timeline.l48h') },
    { img: UI.jalon_72h_poumons,  time: t('impact.health.timeline.t72h'),    label: t('impact.health.timeline.l72h') },
    { img: UI.jalon_1an_cerveau,  time: t('impact.health.timeline.t1an'),    label: t('impact.health.timeline.l1an') },
  ];
  return (
    <>
      <View style={im.headerRow}>
        <Image source={UI.poumons_titre} style={im.headerIllus} resizeMode="contain" />
        <Text style={im.titre}>{info.titre}</Text>
      </View>

      <Text style={im.explication}>{info.explication}</Text>

      <View style={im.timeline}>
        {milestones.map((m, i) => (
          <View key={i} style={im.tlRow}>
            <Image source={m.img} style={im.tlIllus} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={im.tlTime}>{m.time}</Text>
              <Text style={im.tlLabel}>{m.label}</Text>
            </View>
            {i < milestones.length - 1 && <View style={im.tlConnector} />}
          </View>
        ))}
      </View>

      {info.note && <Text style={im.note}>{info.note}</Text>}
    </>
  );
}

// ── Body générique (fallback si type absent) ────────────────────────────────
function GenericBody({ info }) {
  return (
    <>
      <View style={im.headerRow}>
        <Text style={{ fontSize: 26 }}>{info.icon}</Text>
        <Text style={im.titre}>{info.titre}</Text>
      </View>
      <Text style={im.explication}>{info.explication}</Text>
      {info.projections && (
        <View style={im.projRow}>
          {info.projections.map((pr, i) => (
            <View key={i} style={im.projCard}>
              <Text style={im.projValue}>{pr.valeur}</Text>
              <Text style={im.projLabel}>{pr.label}</Text>
            </View>
          ))}
        </View>
      )}
      {info.note && <Text style={im.note}>{info.note}</Text>}
    </>
  );
}

const im = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(23, 61, 38, 0.55)' },
  overlayContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card:           { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.grayBorder },

  headerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerIllus:{ width: 44, height: 44 },
  titre:      { fontSize: 18, fontWeight: '900', color: colors.primaryDeep, flex: 1 },
  explication:{ fontSize: 13, color: colors.black, lineHeight: 20, marginBottom: 14 },

  // avant/après (savings)
  beforeAfter:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  baBox:      { flex: 1, backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: 10, alignItems: 'center' },
  baIllus:    { width: 42, height: 42, marginBottom: 4 },
  baLabel:    { fontSize: 10, color: colors.gray },
  baValue:    { fontSize: 22, fontWeight: '900', color: colors.primaryDeep, marginTop: 2 },
  baUnit:     { fontSize: 10, color: colors.gray },
  baArrow:    { fontSize: 22, color: colors.primary, fontWeight: '800' },

  evitees:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primaryLight, borderRadius: radius.lg, padding: 12, marginBottom: 12 },
  eviteesValue:{ fontSize: 15, fontWeight: '800', color: colors.primaryDeep },
  eviteesLabel:{ fontSize: 11, color: colors.gray, marginTop: 2 },

  formulaBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.cream, borderRadius: radius.md, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.grayBorder },
  formulaText:{ flex: 1, fontSize: 12, color: colors.black, lineHeight: 17 },

  // 3 projections
  projRow:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  projCard:   { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.lg, padding: 10, alignItems: 'center' },
  projIllus:  { width: 34, height: 34, marginBottom: 4 },
  projValue:  { fontSize: 14, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  projLabel:  { fontSize: 10, color: colors.gray, marginTop: 2, textAlign: 'center' },

  // Timeline santé
  timeline:   { marginBottom: 14, gap: 10 },
  tlRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, position: 'relative' },
  tlIllus:    { width: 40, height: 40 },
  tlTime:     { fontSize: 13, fontWeight: '800', color: colors.primaryDeep },
  tlLabel:    { fontSize: 12, color: colors.black, marginTop: 1, lineHeight: 16 },
  tlConnector:{ position: 'absolute', left: 19, top: 40, width: 2, height: 12, backgroundColor: colors.grayBorder },

  note:       { fontSize: 11, color: colors.gray, fontStyle: 'italic', marginBottom: 14, lineHeight: 16 },
  btn:        { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center' },
  btnText:    { color: colors.white, fontSize: 14, fontWeight: '700' },
});

// ── Emojis des motivations (identifiants stables de l'onboarding) ───────────
const MOTIV_EMOJIS = {
  health:     '❤️',
  family:     '👨‍👩‍👧',
  appearance: '✨',
  money:      '💰',
  breathing:  '🫁',
  fitness:    '🏃',
};

// ── Écran principal ──────────────────────────────────────────────────────────
export default function PlanScreen({ navigation }) {
  const { t, i18n } = useTranslation('plan');
  const { stats, profile } = useUser();
  const [impactModal, setImpactModal] = useState(null);

  // Motivations issues de l'onboarding, rappelées comme encouragement
  const mesMotivations = (Array.isArray(profile?.motivations) ? profile.motivations : [])
    .map(k => MOTIV_EMOJIS[k] ? { key: k, emoji: MOTIV_EMOJIS[k], label: t(`motivations.${k}`) } : null)
    .filter(Boolean);
  const motivationPerso = profile?.motivationPerso ?? null;

  const objectifJour   = stats?.objectifJour   ?? 8;
  const argentEcoMois  = stats?.argentEcoPlanMois ?? 0;
  const vieGagneeHMois = stats?.vieGagneeHPlanMois ?? 0;
  const vieGagneeJAn   = stats?.vieGagneeJPlanAn  ?? 0;
  const planData       = stats?.planData ?? [objectifJour, 0, 0, 0, 0, 0];
  const prochainPalier = stats?.prochainPalier ?? 0;

  // Plan de réduction réel
  const reductionSem     = stats?.reductionSem ?? 0;
  const joursAvantPalier = stats?.joursAvantPalier;
  const semainesRest     = stats?.semainesRestantes;
  const dateZeroStr      = stats?.dateZeroStr;

  // Projection annuelle basée sur le plan réellement choisi
  const proj = stats?.projAnnuelle ?? {
    cout: 0, coutPlan: 0, gain: 0, coutReel: 0,
    badSerie: [0, 0], planSerie: [0, 0], consoRecente: 0, planActif: false,
  };
  const fmtEur = n => `${new Intl.NumberFormat(i18n.language).format(n)} €`;
  const equivalence = equivalenceGain(proj.gain, t);
  // Économies réelles depuis le début (jours enregistrés, vs conso d'avant)
  const argentDejaEco = stats?.argentEcoCumul ?? 0;

  // Détails pour les fiches explicatives "Votre impact"
  const consoAvantAff  = stats?.consoAvant ?? 10;
  const prixCigAff     = (stats?.prixCig ?? 0.5).toFixed(2);
  const cigEviteesJour = Math.max(0, consoAvantAff - objectifJour); // rythme d'aujourd'hui, pour le texte explicatif
  // "par an" / "10 ans" : dérivés de stats.ecoAnSiReduit / stats.argentEco10Ans / stats.vieGagneeJ10Ans
  // (mêmes valeurs que la Projection annuelle — réduction progressive prise en compte si plan actif).
  const ecoAnAff  = (stats?.ecoAnSiReduit ?? 0).toLocaleString(i18n.language);
  const eco10Aff  = (stats?.argentEco10Ans ?? 0).toLocaleString(i18n.language);
  const vie10Aff  = stats?.vieGagneeJ10Ans ?? 0;

  // Habitudes réelles (issues des envies enregistrées)
  const habitudes      = stats?.habitudes;
  // Habitudes personnalisées créées par l'utilisateur ("Maman m'a énervé"…)
  const persoMap = Object.fromEntries(
    (Array.isArray(profile?.declencheursPerso) ? profile.declencheursPerso : [])
      .map(d => [d.key, { emoji: '📝', label: d.label }])
  );
  const resoudreTrig = k => {
    if (TRIGGER_META[k]) return { img: TRIGGER_META[k], label: t(`triggers.${k}`) };
    if (persoMap[k]) return persoMap[k];
    return { img: TRIGGER_META.autre, label: t('triggers.autre') };
  };
  const trigInfo       = habitudes ? resoudreTrig(habitudes.declencheur) : null;
  const enviesRecentes = stats?.enviesRecentes ?? [];
  // Tous les déclencheurs (standards + personnalisés utilisés), zéros inclus
  const parDeclencheur = habitudes
    ? [...new Set([...Object.keys(TRIGGER_META), ...Object.keys(habitudes.parDeclencheur)])]
        .map(k => [k, habitudes.parDeclencheur[k] ?? 0])
        .sort((a, b) => b[1] - a[1])
    : [];

  function fmtEnvie(e) {
    const d = new Date(e.ts);
    const jour  = d.toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' });
    const heure = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
    return { jour: jour.charAt(0).toUpperCase() + jour.slice(1), heure };
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('header.title')}</Text>
      </View>

      <ImpactModal info={impactModal} onClose={() => setImpactModal(null)} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Section 1 : Votre impact ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumBadge}>
            <Text style={styles.sectionNum}>1</Text>
          </View>
          <Text style={styles.sectionTitle}>{t('impact.sectionTitle')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.impactGrid}>
            <ImpactCard
              img={UI.sac_euros} valeur={`+${argentEcoMois.toFixed(0)} €`} label={t('impact.savings.label')} sublabel={t('labels.perMonth')}
              onPress={() => setImpactModal({
                type: 'savings',
                titre: t('impact.savings.modalTitle'),
                savings: { consoAvant: consoAvantAff, objectif: objectifJour, cigEviteesJour },
                formula: t('impact.savings.explanationDetail', { count: cigEviteesJour, prixCig: prixCigAff, ecoMois: argentEcoMois.toFixed(0) }),
                projections: [
                  { valeur: `+${argentEcoMois.toFixed(0)} €`, label: t('labels.perMonth') },
                  { valeur: `+${ecoAnAff} €`, label: t('labels.perYear') },
                  { valeur: `+${eco10Aff} €`, label: t('labels.per10Years') },
                ],
                note: t('impact.savings.note'),
              })}
            />
            <ImpactCard
              img={UI.chronometre} valeur={`+${vieGagneeHMois}h`} label={t('impact.life.label')} sublabel={t('labels.perMonth')} valeurColor={colors.primary}
              onPress={() => setImpactModal({
                type: 'lifeMonth',
                titre: t('impact.lifeMonth.modalTitle'),
                explication: t('impact.lifeMonth.explanation', { count: cigEviteesJour, minutes: cigEviteesJour * 5, hours: vieGagneeHMois }),
                projections: [
                  { valeur: `+${vieGagneeHMois}h`, label: t('labels.perMonth') },
                  { valeur: `+${vieGagneeJAn}j`, label: t('labels.perYear') },
                  { valeur: `+${vie10Aff}j`, label: t('labels.per10Years') },
                ],
              })}
            />
            <ImpactCard
              img={UI.coeur_titre} valeur={`+${vieGagneeJAn}j`} label={t('impact.life.label')} sublabel={t('labels.perYear')} valeurColor={colors.primary}
              onPress={() => setImpactModal({
                type: 'lifeYear',
                titre: t('impact.lifeYear.modalTitle'),
                explication: t('impact.lifeYear.explanation', { count: cigEviteesJour, days: vieGagneeJAn }),
                projections: [
                  { valeur: `+${vieGagneeJAn}j`, label: t('labels.perYear') },
                  { valeur: `+${vie10Aff}j`, label: t('labels.per10Years') },
                  { valeur: t('impact.lifeYear.monthsValue', { count: Math.round(vie10Aff / 30) }), label: t('impact.lifeYear.moreLifeLabel') },
                ],
              })}
            />
            <ImpactCard
              img={UI.poumons_titre} valeur={t('impact.health.value')} label={t('impact.health.label')} sublabel={t('impact.health.sublabel')} valeurColor={colors.primary}
              onPress={() => setImpactModal({
                type: 'health',
                titre: t('impact.health.modalTitle'),
                explication: t('impact.health.explanation'),
                note: t('impact.health.note'),
              })}
            />
          </View>
        </View>

        {/* ── Projection annuelle ── */}
        <Text style={styles.subSectionTitle}>{t('projection.sectionTitle')}</Text>
        <View style={styles.card}>
          {/* ── Le chiffre héros ── */}
          <View style={{ alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md }}>
            <Text style={styles.projHeros}>{fmtEur(proj.gain)}</Text>
            <Text style={styles.projHerosSous}>{t('projection.herosSub')}</Text>
            <Text style={styles.projHerosHint}>{t('projection.herosHint')}</Text>
          </View>

          {/* ── 3 lignes de bilan ── */}
          <LigneProjection
            icone="↓" iconeBg="#FEE2E2" iconeCouleur="#DC2626"
            titre={t('projection.beforeApp.title')}
            sous={t('projection.beforeApp.sub')}
            valeur={t('projection.beforeApp.value', { amount: fmtEur(proj.cout) })}
            valeurCouleur="#DC2626"
          />
          <LigneProjection
            icone="↑" iconeBg={colors.primaryLight} iconeCouleur={colors.primaryDeep}
            titre={t('projection.alreadySaved.title')}
            sous={t('projection.alreadySaved.sub')}
            valeur={t('projection.alreadySaved.value', { amount: fmtEur(Math.round(argentDejaEco)) })}
            valeurCouleur={colors.primaryDeep}
          />
          <LigneProjection
            icone="✓" iconeBg={colors.primaryLight} iconeCouleur={colors.primaryDeep}
            titre={t('projection.planRespected.title')}
            sous={t('projection.planRespected.sub')}
            valeur={t('projection.planRespected.value', { amount: fmtEur(proj.gain) })}
            valeurCouleur={colors.primaryDeep}
          />

          {/* ── Équivalence concrète ── */}
          {equivalence && (
            <View style={styles.projEquivPill}>
              <Text style={styles.projEquivLabel}>
                {t('projection.equivalenceLabel', { amount: fmtEur(proj.gain) })}
              </Text>
              <Text style={styles.projEquivText}>💚  {equivalence}</Text>
            </View>
          )}
        </View>

        {/* ── Section 2 : Analyse des habitudes ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumBadge}>
            <Text style={styles.sectionNum}>2</Text>
          </View>
          <Text style={styles.sectionTitle}>{t('habits.sectionTitle')}</Text>
          {habitudes && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{t('habits.analyzedCount', { count: habitudes.total })}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          {habitudes ? (
            <>
              <View style={styles.habitudesRow}>
                <HabitudeChip
                  img={UI.reveil}
                  titre={habitudes.heurePic}
                  desc={t('habits.peakHour.desc')}
                  sub={t('habits.pctOfCravings', { pct: habitudes.pctHeure })}
                />
                <HabitudeChip
                  img={UI.calendrier_mois}
                  titre={habitudes.jourPic}
                  desc={t('habits.peakDay.desc')}
                  sub={t('habits.pctOfCravings', { pct: habitudes.pctJour })}
                />
                <HabitudeChip
                  img={trigInfo.img}
                  icon={trigInfo.emoji}
                  titre={trigInfo.label}
                  desc={t('habits.topTrigger.desc')}
                  sub={t('habits.pctOfCravings', { pct: habitudes.pctTrig })}
                />
              </View>

              {/* Répartition par déclencheur */}
              <Text style={styles.habSousTitre}>{t('habits.breakdownTitle')}</Text>
              {parDeclencheur.map(([key, count]) => {
                const info  = resoudreTrig(key);
                const pct   = habitudes.total > 0 ? Math.round((count / habitudes.total) * 100) : 0;
                const vide  = count === 0;
                return (
                  <View key={key} style={[styles.trigRow, vide && { opacity: 0.35 }]}>
                    <View style={styles.trigBadge}>
                      {info.img
                        ? <Image source={info.img} style={styles.trigIllus} resizeMode="contain" />
                        : <Text style={{ fontSize: 13 }}>{info.emoji}</Text>}
                    </View>
                    <Text style={styles.trigLabel}>{info.label}</Text>
                    <View style={styles.trigBarTrack}>
                      <View style={[styles.trigBarFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.trigCount}>×{count}</Text>
                  </View>
                );
              })}

              <TouchableOpacity
                style={[styles.journalBtn, { marginTop: spacing.sm }]}
                onPress={() => navigation.navigate('JournalEnvies', { mode: 'declencheur' })}
              >
                <Text style={styles.journalBtnText}>{t('habits.viewBreakdownDetail')}</Text>
              </TouchableOpacity>

              {/* Bilan résisté / fumé */}
              <View style={styles.bilanRow}>
                <View style={[styles.bilanChip, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.bilanVal, { color: colors.primary }]}>{t('habits.resistedCount', { count: habitudes.nbResistees })}</Text>
                  <Text style={styles.bilanLabel}>{t('habits.resistedLabel')}</Text>
                </View>
                <View style={[styles.bilanChip, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.bilanVal, { color: '#DC2626' }]}>{t('habits.smokedCount', { count: habitudes.nbFumees })}</Text>
                  <Text style={styles.bilanLabel}>{t('habits.smokedLabel')}</Text>
                </View>
              </View>

              {/* Dernières envies */}
              <Text style={styles.habSousTitre}>{t('habits.recentCravingsTitle')}</Text>
              {enviesRecentes.map((e, i) => {
                const info = resoudreTrig(e.trigger);
                const { jour, heure } = fmtEnvie(e);
                return (
                  <View key={i} style={styles.envieLogRow}>
                    <View style={styles.envieLogBadge}>
                      {info.img
                        ? <Image source={info.img} style={styles.envieLogIllus} resizeMode="contain" />
                        : <Text style={{ fontSize: 12 }}>{info.emoji}</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.envieLogMain}>
                        {jour} · {heure} · {info.label}
                      </Text>
                      {e.note ? <Text style={styles.envieLogNote} numberOfLines={2}>« {e.note} »</Text> : null}
                    </View>
                    <Text style={[styles.envieLogIssue, { color: e.fume ? '#DC2626' : colors.primary }]}>
                      {e.fume ? t('habits.smokedIssue') : t('habits.resistedIssue')}
                    </Text>
                  </View>
                );
              })}

              {/* Journal complet */}
              <TouchableOpacity
                style={styles.journalBtn}
                onPress={() => navigation.navigate('JournalEnvies')}
              >
                <Text style={styles.journalBtnText}>{t('habits.viewFullJournal')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.habitudesVide}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>🔥</Text>
              <Text style={styles.habitudesVideTitre}>{t('habits.emptyTitle')}</Text>
              <Text style={styles.habitudesVideTexte}>
                {t('habits.emptyTextBefore')}{' '}
                <Text style={{ fontWeight: '700' }}>{t('habits.emptyTextButton')}</Text>
                {t('habits.emptyTextAfter')}
              </Text>
            </View>
          )}
        </View>

        {/* ── Section 3 : Plan recommandé ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumBadge}>
            <Text style={styles.sectionNum}>3</Text>
          </View>
          <Text style={styles.sectionTitle}>{t('recommendedPlan.sectionTitle')}</Text>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>
              {reductionSem > 0 ? t('recommendedPlan.rateTag', { count: reductionSem }) : t('recommendedPlan.progressiveTag')}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.planRow}>
            {/* Objectif quotidien */}
            <View style={styles.planLeft}>
              <Text style={styles.planLabel}>{t('recommendedPlan.dailyGoal')}</Text>
              <Text style={styles.planNumber}>{objectifJour}</Text>
              <Text style={styles.planUnit}>{t('recommendedPlan.cigarettesMax')}</Text>
            </View>

            {/* Mini graphique */}
            <View style={styles.planChartArea}>
              {planData.map((v, i) => (
                <View key={i} style={styles.planBarCol}>
                  <Text style={styles.planBarVal}>{v}</Text>
                  <View style={[
                    styles.planBar,
                    { height: Math.max(v * 6, 4), backgroundColor: v === 0 ? colors.grayBorder : colors.primary }
                  ]} />
                  <Text style={styles.planBarLabel}>{i === 0 ? t('recommendedPlan.today') : t('recommendedPlan.weekLabel', { n: i })}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.prochainPalier}>
            {objectifJour === 0 ? (
              <Text style={styles.prochainText}>
                <Text style={{ fontWeight: '700' }}>{t('recommendedPlan.goalReached')}</Text>{t('recommendedPlan.goalReachedSuffix')}
              </Text>
            ) : reductionSem > 0 && joursAvantPalier != null ? (
              <Text style={styles.prochainText}>
                {t('recommendedPlan.nextMilestonePrefix')}
                <Text style={{ fontWeight: '700' }}>{t('recommendedPlan.nextMilestoneCig', { count: prochainPalier })}</Text>
                {t('recommendedPlan.nextMilestoneInLabel')}
                <Text style={{ fontWeight: '700' }}>{t('recommendedPlan.nextMilestoneDays', { count: joursAvantPalier })}</Text>
                {dateZeroStr ? `${t('recommendedPlan.zeroDatePrefix')}${dateZeroStr}` : ''}
              </Text>
            ) : (
              <Text style={styles.prochainText}>
                {t('recommendedPlan.chooseProgressivePrefix')}
                <Text style={{ fontWeight: '700' }}>{t('recommendedPlan.chooseProgressiveLabel')}</Text>
                {t('recommendedPlan.chooseProgressiveSuffix')}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.modifierBtn}
            onPress={() => navigation.navigate('ModifierObjectif')}
          >
            <Text style={styles.modifierBtnText}>{t('recommendedPlan.modifyButton')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Vos motivations (rappel d'encouragement) ── */}
        {(mesMotivations.length > 0 || motivationPerso) && (
          <View style={[styles.card, { marginTop: spacing.sm }]}>
            <Text style={{ fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm }}>
              {t('motivations.title')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {mesMotivations.map(m => (
                <View key={m.key} style={styles.motivChip}>
                  <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                  <Text style={styles.motivChipText}>{m.label}</Text>
                </View>
              ))}
            </View>
            {motivationPerso && (
              <Text style={styles.motivPerso}>« {motivationPerso} »</Text>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────
function ImpactCard({ img, valeur, label, sublabel, valeurColor = colors.black, onPress }) {
  return (
    <TouchableOpacity style={styles.impactCard} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
        <Image source={img} style={styles.impactIllus} resizeMode="contain" />
        <Text style={{ fontSize: 13, color: colors.gray }}>ⓘ</Text>
      </View>
      <Text style={[styles.impactValeur, { color: valeurColor }]}>{valeur}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
      <Text style={styles.impactSub}>{sublabel}</Text>
    </TouchableOpacity>
  );
}

function HabitudeChip({ icon, img, iconBg, titre, desc, sub }) {
  return (
    <View style={styles.habitudeChip}>
      <View style={[styles.habitudeIconWrap, iconBg && { backgroundColor: iconBg }]}>
        {img
          ? <Image source={img} style={styles.habitudeIconIllus} resizeMode="contain" />
          : <Text style={styles.habitudeIcon}>{icon}</Text>}
      </View>
      <Text style={styles.habitudeTitre}>{titre}</Text>
      <Text style={styles.habitudeDesc}>{desc}</Text>
      <Text style={styles.habitudeSub}>{sub}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: spacing.md, paddingBottom: 90 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  headerTitle:  { fontSize: font.lg, fontWeight: '800', color: colors.black, flex: 1, textAlign: 'center' },
  settingsBtn:  { position: 'absolute', right: spacing.lg },
  settingsIcon: { fontSize: 22 },

  // Sections
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  sectionNumBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sectionNum:   { color: colors.white, fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: font.md, fontWeight: '700', color: colors.black, flex: 1 },
  voirPlus:     { fontSize: 12, color: colors.primary, fontWeight: '600' },
  subSectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginTop: spacing.sm, marginBottom: spacing.sm },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  // Impact
  impactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  impactCard: {
    width: (SCREEN_W - spacing.md * 4 - spacing.sm) / 2,
    backgroundColor: '#F7F8FA', borderRadius: radius.lg, padding: spacing.sm,
    alignItems: 'flex-start',
  },
  impactIllus:  { width: 30, height: 30, marginBottom: 4 },
  impactValeur: { fontSize: font.md, fontWeight: '800', color: colors.black },
  impactLabel:  { fontSize: 11, color: colors.gray },
  impactSub:    { fontSize: 10, color: colors.gray },

  // Projection
  projRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  projCol: { flex: 1 },
  projLabel: { fontSize: 11, color: colors.gray, marginBottom: 2 },
  projBad:  { fontSize: font.md, fontWeight: '800', color: '#EF4444' },
  projGood: { fontSize: font.md, fontWeight: '800', color: colors.primary, textAlign: 'right' },
  vsCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
  },
  vsText: { fontSize: 11, fontWeight: '700', color: colors.gray },
  chartBox: { marginTop: spacing.sm },
  projLegende: { marginTop: spacing.sm, gap: 4 },
  projLegItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  projLegDot:  { width: 8, height: 8, borderRadius: 4 },
  projLegText: { fontSize: 11, color: colors.gray },

  // Projection annuelle (bilan simple)
  projHeros:     { fontSize: 40, fontWeight: '900', color: colors.primaryDeep, lineHeight: 46 },
  projHerosSous: { fontSize: 14, fontWeight: '700', color: colors.primaryDeep, marginTop: 2 },
  projHerosHint: { fontSize: 12, color: colors.gray, marginTop: 2 },
  ligneProj: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FAFAFA', borderRadius: radius.lg,
    padding: spacing.sm, marginBottom: spacing.xs,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  ligneProjIcone: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  ligneProjTitre:  { fontSize: 13, fontWeight: '700', color: colors.black },
  ligneProjSous:   { fontSize: 11, color: colors.gray, marginTop: 1 },
  ligneProjValeur: { fontSize: 15, fontWeight: '800' },
  projEquivPill: {
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    paddingVertical: 10, alignItems: 'center', marginTop: spacing.sm,
  },
  projEquivLabel: { fontSize: 11, color: colors.primary, marginBottom: 3 },
  projEquivText:  { fontSize: 13, fontWeight: '700', color: colors.primaryDeep },
  projNote: {
    fontSize: 11, color: colors.black, lineHeight: 16,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, marginTop: spacing.sm,
  },

  // Habitudes
  habitudesRow: { flexDirection: 'row', gap: spacing.sm },
  habitudeChip: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.lg,
    padding: spacing.sm, alignItems: 'flex-start',
  },
  habitudeIconWrap: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  habitudeIconIllus: { width: 22, height: 22 },
  habitudeIcon:  { fontSize: 18 },
  habitudeTitre: { fontSize: 12, fontWeight: '800', color: colors.black },
  habitudeDesc:  { fontSize: 10, color: colors.gray, marginTop: 2 },
  habitudeSub:   { fontSize: 10, color: colors.gray },
  habitudesVide: { alignItems: 'center', paddingVertical: spacing.sm },
  habitudesVideTitre: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: 4 },
  habitudesVideTexte: { fontSize: 12, color: colors.gray, textAlign: 'center', lineHeight: 18 },

  // Détail habitudes
  habSousTitre: {
    fontSize: 12, fontWeight: '700', color: colors.black,
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  trigRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  trigBadge:    { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  trigIllus:    { width: 17, height: 17 },
  trigLabel:    { fontSize: 12, color: colors.black, width: 92 },
  trigBarTrack: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  trigBarFill:  { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  trigCount:    { fontSize: 12, fontWeight: '700', color: colors.black, width: 30, textAlign: 'right' },

  bilanRow:  { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  bilanChip: { flex: 1, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  bilanVal:  { fontSize: 15, fontWeight: '800' },
  bilanLabel: { fontSize: 10, color: colors.gray, marginTop: 2 },

  envieLogRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  envieLogBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  envieLogIllus: { width: 15, height: 15 },
  envieLogMain:  { fontSize: 12, color: colors.black },
  envieLogNote:  { fontSize: 11, color: colors.gray, fontStyle: 'italic', marginTop: 2 },
  envieLogIssue: { fontSize: 11, fontWeight: '700' },

  journalBtn: {
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 10, alignItems: 'center', marginTop: spacing.md,
  },
  journalBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700' },

  // Tag
  tagBadge: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: 10, color: colors.primary, fontWeight: '600' },

  // Plan recommandé
  planRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginBottom: spacing.sm },
  planLeft: { alignItems: 'flex-start' },
  planLabel:  { fontSize: 11, color: colors.gray },
  planNumber: { fontSize: 48, fontWeight: '900', color: colors.primary, lineHeight: 52 },
  planUnit:   { fontSize: 12, color: colors.gray },
  planChartArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  planBarCol: { flex: 1, alignItems: 'center' },
  planBarVal: { fontSize: 10, fontWeight: '700', color: colors.black, marginBottom: 2 },
  planBar: { width: '100%', borderRadius: 3, maxWidth: 28 },
  planBarLabel: { fontSize: 9, color: colors.gray, marginTop: 2 },

  prochainPalier: {
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  prochainText: { fontSize: 12, color: colors.black, textAlign: 'center' },

  modifierBtn: {
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: radius.full, paddingVertical: 14,
    alignItems: 'center',
  },
  modifierBtnText: { color: colors.primary, fontSize: font.md, fontWeight: '700' },

  // Motivations
  motivChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  motivChipText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  motivPerso: {
    fontSize: 12, color: colors.gray, fontStyle: 'italic',
    marginTop: spacing.sm, textAlign: 'center',
  },
});
