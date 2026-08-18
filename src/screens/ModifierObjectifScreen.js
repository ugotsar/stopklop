import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius, shadow } from '../theme';
import { UI } from '../assets/uiKit';

const OBJECTIFS_META = [
  { key: 'stop',   img: UI.cigarette_barree,        iconBg: colors.primaryLight },
  { key: 'reduce', img: UI.escalier_reduction,       iconBg: colors.primaryLight },
  { key: 'libre',  img: UI.curseurs_objectif_libre,  iconBg: colors.primaryLight },
];

export default function ModifierObjectifScreen({ navigation }) {
  const { t, i18n } = useTranslation('modifierObjectif');
  const { profile, stats, updateProfile } = useUser();

  const objectifActuel = stats?.objectifJour ?? 8;

  const [selected, setSelected] = useState(profile?.typeObjectif ?? 'reduce');
  const [quantite, setQuantite] = useState(objectifActuel);
  const [rythme,   setRythme]   = useState(profile?.reductionParSemaine ?? 2);

  const prixCig    = stats?.prixCig ?? 0.5;
  const consoAvant = stats?.consoAvant ?? 10;

  // Cigarettes évitées cumulées sur `jours`, selon le mode choisi.
  // En mode "réduire", l'objectif baisse de `rythme` chaque semaine jusqu'à 0 :
  // les économies s'accélèrent donc avec le temps.
  function evitees(jours) {
    let total = 0;
    for (let d = 0; d < jours; d++) {
      const obj = selected === 'stop' ? 0
        : selected === 'reduce' ? Math.max(0, quantite - rythme * Math.floor(d / 7))
        : quantite;
      total += Math.max(0, consoAvant - obj);
    }
    return total;
  }

  const eviteesMois = evitees(30);
  const eviteesAn   = evitees(365);
  const evitees10   = evitees(3650);

  const ecoMois = (eviteesMois * prixCig).toFixed(0);
  const ecoAn   = (eviteesAn   * prixCig).toFixed(0);
  const eco10   = Math.round(evitees10 * prixCig).toLocaleString(i18n.language);

  // Temps de vie récupéré (5 min / cigarette évitée)
  const vieMoisH = Math.round(eviteesMois * 5 / 60);
  const vieAnJ   = Math.round(eviteesAn   * 5 / 60 / 24);
  const vie10J   = Math.round(evitees10   * 5 / 60 / 24);

  const reduction = consoAvant > 0
    ? Math.max(0, Math.min(100, Math.round((eviteesMois / (consoAvant * 30)) * 100)))
    : 0;

  // Aperçu du plan de réduction : paliers semaine par semaine
  const semainesTotal = rythme > 0 ? Math.ceil(quantite / rythme) : 0;
  const dateZero = new Date(Date.now() + semainesTotal * 7 * 86400000)
    .toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' });
  const paliers = Array.from({ length: Math.min(semainesTotal + 1, 6) },
    (_, i) => Math.max(0, quantite - rythme * i));

  async function handleEnregistrer() {
    const changes = {
      typeObjectif: selected,
      objectifCigarettes: selected === 'stop' ? 0 : quantite,
    };
    if (selected === 'reduce') {
      changes.reductionParSemaine = rythme;
      // Si un plan de réduction était déjà actif, on préserve la position
      // dans la semaine en cours au lieu de relancer un compte à rebours de
      // 7 jours à chaque simple modification — sinon rééditer le plan (même
      // sans rien changer) repousse le prochain palier de plusieurs jours.
      const planDejaActif = profile?.typeObjectif === 'reduce'
        && profile?.reductionParSemaine > 0 && profile?.planStartDate;
      if (planDejaActif) {
        const joursDansSemaine = Math.floor(
          (Date.now() - new Date(profile.planStartDate).getTime()) / 86400000
        ) % 7;
        changes.planStartDate = new Date(Date.now() - joursDansSemaine * 86400000).toISOString();
      } else {
        changes.planStartDate = new Date().toISOString(); // le plan démarre aujourd'hui
      }
    } else {
      changes.reductionParSemaine = null;
      changes.planStartDate = null;
    }
    await updateProfile(changes);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('header.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Choisir l'objectif ── */}
        <Text style={styles.sectionTitle}>{t('objectives.sectionTitle')}</Text>
        <View style={{ gap: spacing.sm }}>
          {OBJECTIFS_META.map(obj => (
            <TouchableOpacity
              key={obj.key}
              style={[styles.optionCard, selected === obj.key && styles.optionCardActive]}
              onPress={() => setSelected(obj.key)}
            >
              {/* Radio */}
              <View style={[styles.radio, selected === obj.key && styles.radioActive]}>
                {selected === obj.key && <View style={styles.radioDot} />}
              </View>

              {/* Texte */}
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitre}>{t(`objectives.${obj.key}.title`)}</Text>
                <Text style={styles.optionDesc}>{t(`objectives.${obj.key}.desc`)}</Text>
              </View>

              {/* Icône */}
              <View style={[styles.iconCircle, { backgroundColor: obj.iconBg }]}>
                <Image source={obj.img} style={styles.iconIllus} resizeMode="contain" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Mode "réduire" : Point de départ + Rythme côte à côte (réf. 11) ── */}
        {selected === 'reduce' && (
          <>
            <View style={styles.twoColRow}>
              <View style={styles.colCard}>
                <Text style={styles.colTitle}>{t('dailyGoal.titleReduceMode')}</Text>
                <View style={styles.stepperRowCompact}>
                  <TouchableOpacity
                    style={[styles.stepperBtnSm, quantite <= 0 && styles.stepperBtnDisabled]}
                    onPress={() => setQuantite(q => Math.max(0, q - 1))}
                    disabled={quantite <= 0}
                  >
                    <Text style={[styles.stepperBtnText, quantite <= 0 && { color: colors.grayBorder }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperNumberSm}>{quantite}</Text>
                  <TouchableOpacity style={styles.stepperBtnSm} onPress={() => setQuantite(q => q + 1)}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.colUnit}>{t('dailyGoal.unit')}</Text>
              </View>

              <View style={styles.colCard}>
                <Text style={styles.colTitle}>{t('pace.sectionTitle')}</Text>
                <View style={styles.stepperRowCompact}>
                  <TouchableOpacity
                    style={[styles.stepperBtnSm, rythme <= 1 && styles.stepperBtnDisabled]}
                    onPress={() => setRythme(r => Math.max(1, r - 1))}
                    disabled={rythme <= 1}
                  >
                    <Text style={[styles.stepperBtnText, rythme <= 1 && { color: colors.grayBorder }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperNumberSm}>−{rythme}</Text>
                  <TouchableOpacity
                    style={[styles.stepperBtnSm, rythme >= 10 && styles.stepperBtnDisabled]}
                    onPress={() => setRythme(r => Math.min(10, r + 1))}
                    disabled={rythme >= 10}
                  >
                    <Text style={[styles.stepperBtnText, rythme >= 10 && { color: colors.grayBorder }]}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.colUnit}>{t('pace.perWeek', { count: rythme })}</Text>
              </View>
            </View>

            {/* Prévision hebdomadaire */}
            <Text style={styles.sectionTitle}>{t('planPreview.sectionTitle')}</Text>
            <View style={styles.card}>
              <View style={styles.paliersRow}>
                <View style={styles.paliersConnector} />
                {paliers.map((v, i) => (
                  <View key={i} style={styles.palierChip}>
                    <Text style={styles.palierSemaine}>{i === 0 ? t('planPreview.today') : t('planPreview.weekLabel', { n: i })}</Text>
                    <Text style={styles.palierValeur}>{v}</Text>
                    {v === 0 && <Image source={UI.drapeau_jalon} style={styles.palierFlag} resizeMode="contain" />}
                  </View>
                ))}
                {semainesTotal + 1 > 6 && (
                  <View style={styles.palierChip}>
                    <Text style={styles.palierSemaine}>…</Text>
                    <Text style={styles.palierValeur}>0</Text>
                  </View>
                )}
              </View>

              <View style={styles.planResume}>
                <Image source={UI.drapeau_jalon} style={styles.planResumeFlag} resizeMode="contain" />
                <Text style={styles.planResumeText}>
                  {t('planPreview.summaryPrefix')} <Text style={{ fontWeight: '800' }}>{t('planPreview.zeroCigarette')}</Text>{' '}
                  <Text style={{ fontWeight: '800' }}>{t('planPreview.inWeeks', { count: semainesTotal })}</Text>
                  <Text style={{ fontWeight: '800' }}>{t('planPreview.towardDate', { date: dateZero })}</Text>
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── Objectif quotidien (mode "objectif libre") ── */}
        {selected === 'libre' && (
          <>
            <Text style={styles.sectionTitle}>{t('dailyGoal.titleOtherMode')}</Text>
            <View style={styles.card}>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, quantite <= 0 && styles.stepperBtnDisabled]}
                  onPress={() => setQuantite(q => Math.max(0, q - 1))}
                  disabled={quantite <= 0}
                >
                  <Text style={[styles.stepperBtnText, quantite <= 0 && { color: colors.grayBorder }]}>−</Text>
                </TouchableOpacity>

                <View style={styles.stepperCenter}>
                  <Text style={styles.stepperNumber}>{quantite}</Text>
                  <Text style={styles.stepperUnit}>{t('dailyGoal.unit')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQuantite(q => q + 1)}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ── Aperçu de l'objectif ── */}
        <View style={styles.apercuCard}>
          <Text style={styles.apercuTitle}>{t('overview.title')}</Text>
          <Text style={styles.apercuRef}>
            {t('overview.reference', { count: consoAvant })}
            {stats?.consoEstimee ? t('overview.referenceEstimatedNote') : ''}
          </Text>

          {/* Économie estimée : mois / an / 10 ans */}
          <View style={styles.apercuBloc}>
            <View style={styles.apercuBlocHeader}>
              <View style={styles.apercuIconCircle}>
                <Text style={{ fontSize: 18 }}>💰</Text>
              </View>
              <Text style={styles.apercuBlocTitre}>{t('overview.estimatedSavings')}</Text>
            </View>
            <View style={styles.apercuCols}>
              <View style={styles.apercuColBox}>
                <Text style={styles.apercuColVal}>+{ecoMois} €</Text>
                <Text style={styles.apercuColLbl}>{t('overview.perMonth')}</Text>
              </View>
              <View style={styles.apercuColBox}>
                <Text style={styles.apercuColVal}>+{ecoAn} €</Text>
                <Text style={styles.apercuColLbl}>{t('overview.perYear')}</Text>
              </View>
              <View style={styles.apercuColBox}>
                <Text style={styles.apercuColVal}>+{eco10} €</Text>
                <Text style={styles.apercuColLbl}>{t('overview.per10Years')}</Text>
              </View>
            </View>
          </View>

          {/* Temps de vie récupéré : mois / an / 10 ans */}
          <View style={styles.apercuBloc}>
            <View style={styles.apercuBlocHeader}>
              <View style={[styles.apercuIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Text style={{ fontSize: 18 }}>🕐</Text>
              </View>
              <Text style={styles.apercuBlocTitre}>{t('overview.lifeRecovered')}</Text>
            </View>
            <View style={styles.apercuCols}>
              <View style={[styles.apercuColBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.apercuColVal, { color: '#B45309' }]}>+{vieMoisH} h</Text>
                <Text style={styles.apercuColLbl}>{t('overview.perMonth')}</Text>
              </View>
              <View style={[styles.apercuColBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.apercuColVal, { color: '#B45309' }]}>+{vieAnJ} j</Text>
                <Text style={styles.apercuColLbl}>{t('overview.perYear')}</Text>
              </View>
              <View style={[styles.apercuColBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.apercuColVal, { color: '#B45309' }]}>+{vie10J} j</Text>
                <Text style={styles.apercuColLbl}>{t('overview.per10Years')}</Text>
              </View>
            </View>
          </View>

          {/* Réduction de consommation */}
          <View style={styles.apercuRow}>
            <View style={styles.apercuIconCircle}>
              <Text style={{ fontSize: 20 }}>📊</Text>
            </View>
            <Text style={styles.apercuLabel}>{t('overview.consumptionReduction')}</Text>
            <Text style={styles.apercuValGreen}>-{reduction} %</Text>
          </View>
        </View>

        {/* ── Bouton enregistrer ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleEnregistrer}>
          <Text style={styles.saveBtnText}>{t('saveButton')}</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          {t('footerNote')}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.cream,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.primaryDeep, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '800', color: colors.primaryDeep },

  sectionTitle: { fontSize: font.sm, fontWeight: '800', color: colors.primaryDeep, marginBottom: spacing.sm, marginTop: spacing.md },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },

  // Options radio — chaque option est sa propre carte (réf. 11)
  optionCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },
  optionCardActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 1.5 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optionTitre: { fontSize: font.sm, fontWeight: '800', color: colors.primaryDeep },
  optionDesc:  { fontSize: 12, color: colors.gray },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  iconIllus: { width: 34, height: 34 },

  // Stepper (pleine largeur — mode "objectif libre")
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg,
  },
  stepperBtn: {
    width: 52, height: 52, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnDisabled: { borderColor: '#F0F0F0' },
  stepperBtnText: { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  stepperCenter:  { alignItems: 'center' },
  stepperNumber:  { fontSize: 48, fontWeight: '900', color: colors.black, lineHeight: 52 },
  stepperUnit:    { fontSize: 12, color: colors.gray },

  // Deux cartes côte à côte : Point de départ / Rythme de réduction (réf. 11)
  twoColRow: { flexDirection: 'row', gap: spacing.sm },
  colCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.grayBorder,
    padding: spacing.md, alignItems: 'center',
    ...shadow.card,
  },
  colTitle: { fontSize: 13, fontWeight: '800', color: colors.primaryDeep, marginBottom: spacing.sm, textAlign: 'center' },
  stepperRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtnSm: {
    width: 36, height: 36, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperNumberSm: { fontSize: 30, fontWeight: '900', color: colors.primaryDeep, minWidth: 44, textAlign: 'center' },
  colUnit: { fontSize: 11, color: colors.gray, marginTop: spacing.sm, textAlign: 'center' },

  // Paliers plan de réduction
  paliersRow: {
    flexDirection: 'row', gap: 6, position: 'relative',
    padding: spacing.md, paddingBottom: spacing.lg,
  },
  paliersConnector: {
    position: 'absolute', left: spacing.md + 16, right: spacing.md + 16, top: spacing.md + 30,
    height: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderTopColor: colors.grayBorder,
  },
  palierChip: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.md, position: 'relative',
    paddingVertical: 8, alignItems: 'center', minHeight: 60, justifyContent: 'center',
  },
  palierSemaine: { fontSize: 10, color: colors.gray },
  palierValeur:  { fontSize: 15, fontWeight: '800', color: colors.black, marginTop: 2 },
  palierFlag:    { width: 20, height: 20, position: 'absolute', bottom: -14, alignSelf: 'center' },
  planResume: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, margin: spacing.md, marginTop: 4,
  },
  planResumeFlag: { width: 28, height: 28 },
  planResumeText: { flex: 1, fontSize: 12, color: colors.black, lineHeight: 18 },

  // Aperçu
  apercuCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: spacing.md, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.grayBorder,
    ...shadow.card,
  },
  apercuTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, textAlign: 'center', marginBottom: 4 },
  apercuRef:   { fontSize: 10, color: colors.gray, textAlign: 'center', marginBottom: spacing.md, fontStyle: 'italic' },
  apercuRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  apercuIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  apercuLabel:    { flex: 1, fontSize: 12, color: colors.gray },
  apercuValGreen:  { fontSize: font.sm, fontWeight: '800', color: colors.primary },
  apercuValOrange: { fontSize: font.sm, fontWeight: '800', color: '#F59E0B' },

  // Blocs mois / an / 10 ans
  apercuBloc: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  apercuBlocHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  apercuBlocTitre:  { fontSize: 12, fontWeight: '700', color: colors.black },
  apercuCols:   { flexDirection: 'row', gap: 6 },
  apercuColBox: {
    flex: 1, backgroundColor: '#F0FDF4', borderRadius: radius.md,
    paddingVertical: 8, alignItems: 'center',
  },
  apercuColVal: { fontSize: 13, fontWeight: '800', color: colors.primary },
  apercuColLbl: { fontSize: 10, color: colors.gray, marginTop: 2 },

  // Boutons
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.pill,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg,
    ...shadow.card,
  },
  saveBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  footerNote:  { textAlign: 'center', fontSize: 11, color: colors.gray, marginTop: spacing.sm },
});
