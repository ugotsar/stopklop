import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import NatureBackground from '../../components/NatureBackground';
import { useUser } from '../../context/UserContext';
import { jouerSon } from '../../services/sounds';
import { localDateKey } from '../../utils/dateKeys';

const { height: SCREEN_H } = Dimensions.get('window');

const DRAFT_KEY = '@stopklop_onboarding_draft';

// Pictogrammes de la synthèse (pack stopklop-illustrations-hd)
const PICTOS_PLAN = {
  objectif: require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/07-plan-objectif.jpg'),
  palier:   require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/08-plan-palier-protege.jpg'),
  economie: require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/09-plan-economies.jpg'),
};
// ── Pack « Stopklop_Design_Assets_V2 » ───────────────────────────────────────
// Les 3 scènes illustrées sont des PNG RGB sur fond blanc opaque (volontaire :
// ne pas les détourer, cf. GUIDE-CLAUDE.md). Les icônes sont des RGBA
// transparents. Les courbes des écrans 05 et 10 sont dessinées nativement.
const V2 = {
  illusTentatives:  require('../../../assets/onboarding/v2/02-identification-tentatives/illustration-tentatives/illustration-tentatives.png'),
  actionNon:        require('../../../assets/onboarding/v2/02-identification-tentatives/non/non.png'),
  actionOui:        require('../../../assets/onboarding/v2/02-identification-tentatives/oui/oui.png'),
  illusAutomatisme: require('../../../assets/onboarding/v2/03-identification-automatisme/illustration-automatisme/illustration-automatisme.png'),
  illusChemins:     require('../../../assets/onboarding/v2/04-identification-reduction/illustration-chemins/illustration-chemins.png'),
  illusPlan:        require('../../../assets/onboarding/v2/06-plan-adapte/illustration-plan/illustration-plan.png'),
  etapeConso:       require('../../../assets/onboarding/v2/06-plan-adapte/etape-consommation/etape-consommation.png'),
  etapeHabitudes:   require('../../../assets/onboarding/v2/06-plan-adapte/etape-habitudes/etape-habitudes.png'),
  etapeObjectif:    require('../../../assets/onboarding/v2/06-plan-adapte/etape-objectif/etape-objectif.png'),
  habitudesReperees: require('../../../assets/onboarding/v2/07-cigarette-choix/habitudes-reperees/habitudes-reperees.png'),
  journalCoffee:    require('../../../assets/onboarding/v2/07-cigarette-choix/journal-coffee/journal-coffee.png'),
  journalPause:     require('../../../assets/onboarding/v2/07-cigarette-choix/journal-pause/journal-pause.png'),
  illusDeclencheurs: require('../../../assets/onboarding/v2/08-declencheurs/illustration-declencheurs/illustration-declencheurs.png'),
  decCoffee:        require('../../../assets/onboarding/v2/08-declencheurs/declencheur-coffee/declencheur-coffee.png'),
  decStress:        require('../../../assets/onboarding/v2/08-declencheurs/declencheur-stress/declencheur-stress.png'),
  decWine:          require('../../../assets/onboarding/v2/08-declencheurs/declencheur-wine/declencheur-wine.png'),
  decFriends:       require('../../../assets/onboarding/v2/08-declencheurs/declencheur-friends/declencheur-friends.png'),
  decPause:         require('../../../assets/onboarding/v2/08-declencheurs/declencheur-pause/declencheur-pause.png'),
  decEnergy:        require('../../../assets/onboarding/v2/08-declencheurs/declencheur-energy/declencheur-energy.png'),
  objectifDuJour:   require('../../../assets/onboarding/v2/09-reduction-rythme/objectif-du-jour/objectif-du-jour.png'),
  statAvoided:      require('../../../assets/onboarding/v2/10-benefices-concrets/avoided/avoided.png'),
  statWallet:       require('../../../assets/onboarding/v2/10-benefices-concrets/wallet/wallet.png'),
  statTime:         require('../../../assets/onboarding/v2/10-benefices-concrets/time/time.png'),
  goalReduce:       require('../../../assets/onboarding/v2/11-objectif/reduce/reduce.png'),
  goalStop:         require('../../../assets/onboarding/v2/11-objectif/stop/stop.png'),
  devEur:           require('../../../assets/onboarding/v2/17-devise/eur/eur.png'),
  devChf:           require('../../../assets/onboarding/v2/17-devise/chf/chf.png'),
  devGbp:           require('../../../assets/onboarding/v2/17-devise/gbp/gbp.png'),
  motivHealth:      require('../../../assets/onboarding/v2/18-motivations/health/health.png'),
  motivFriends:     require('../../../assets/onboarding/v2/18-motivations/friends/friends.png'),
  motivSpark:       require('../../../assets/onboarding/v2/18-motivations/spark/spark.png'),
  motivWallet:      require('../../../assets/onboarding/v2/18-motivations/wallet/wallet.png'),
  motivBreath:      require('../../../assets/onboarding/v2/18-motivations/breath/breath.png'),
  motivTrend:       require('../../../assets/onboarding/v2/18-motivations/trend/trend.png'),
  motivPerso:       require('../../../assets/onboarding/v2/18-motivations/motivation-personnelle/motivation-personnelle.png'),
};
const AFFIRMATION_HERO = [V2.illusTentatives, V2.illusAutomatisme, V2.illusChemins];
const DEVISE_ICONS = { EUR: V2.devEur, CHF: V2.devChf, GBP: V2.devGbp };
const MOTIV_ICONS_V2 = {
  health: V2.motivHealth, family: V2.motivFriends, appearance: V2.motivSpark,
  money: V2.motivWallet, breathing: V2.motivBreath, fitness: V2.motivTrend,
};

// Données d'exemple des graphiques (cf. GUIDE-CLAUDE.md § Graphiques) :
// illustratives uniquement, à remplacer par les données réelles en production.
const SUIVI_QUOTIDIEN = [12, 11, 12, 9, 8, 7, 5];   // écran 05 — cig./jour
const CUMUL_EVITEES   = [4, 10, 15, 23, 29, 36, 47]; // écran 10 — cumul évitées
const PALIERS_V2      = [12, 10, 8, 5];              // écran 09 — cig./jour

// ── Contenus statiques ────────────────────────────────────────────────────────
// Les libellés (titre/texte/label) sont désormais résolus via i18n au moment
// du rendu (voir t('affirmations.items'), t('benefits.items'),
// t('motivations.options.*') et t('currency.options.*')) ; seules les clés
// stables et emojis (utilisés par la logique/état) restent ici.
export const MOTIVATIONS_CHOIX = [
  { key: 'health',     emoji: '❤️' },
  { key: 'family',     emoji: '👨‍👩‍👧' },
  { key: 'appearance', emoji: '✨' },
  { key: 'money',      emoji: '💰' },
  { key: 'breathing',  emoji: '🫁' },
  { key: 'fitness',    emoji: '🏃' },
];

const DEVISES = [
  { code: 'EUR', symbole: '€' },
  { code: 'CHF', symbole: 'CHF' },
  { code: 'GBP', symbole: '£' },
];

// ── Icône « Non » ────────────────────────────────────────────────────────────
// Le pack V2 livre une icône « pause » (deux barres) à la place d'une croix
// pour assets/non/non.png. On dessine la croix nativement, dans le même style
// que oui.png (pastille menthe + trait vert foncé) en attendant l'asset corrigé.
function IconNon({ size = 32 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={20} fill={colors.primaryLight} />
      <Path d="M13,13 L27,27 M27,13 L13,27" stroke={colors.primaryDeep}
        strokeWidth={3.2} strokeLinecap="round" />
    </Svg>
  );
}

// ── Graphique en courbe, dessiné nativement ──────────────────────────────────
// Le pack fournit des PNG de courbes à titre de référence seulement : le guide
// demande un graphique natif, pour garder axes, unité et légendes accessibles
// et pouvoir brancher les vraies données en production.
function LineChart({ data, maxY, ticks, refValue, dayShort }) {
  const [w, setW] = useState(0);
  const H = 176, padL = 30, padR = 10, padT = 12, padB = 26;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = H - padT - padB;
  const x = i => padL + (innerW * i) / (data.length - 1);
  const y = v => padT + innerH * (1 - v / maxY);
  const d = data.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');

  return (
    <View onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={w} height={H}>
          {ticks.map(t => (
            <Line key={`g${t}`} x1={padL} y1={y(t)} x2={w - padR} y2={y(t)}
              stroke="#E8ECE9" strokeWidth={1} />
          ))}
          {ticks.map(t => (
            <SvgText key={`l${t}`} x={padL - 7} y={y(t) + 4} fontSize={10}
              fill={colors.gray} textAnchor="end">{String(t)}</SvgText>
          ))}
          {refValue != null && (
            <Line x1={padL} y1={y(refValue)} x2={w - padR} y2={y(refValue)}
              stroke="#C8A88A" strokeWidth={2} strokeDasharray="6 5" />
          )}
          <Path d={d} stroke={colors.primary} strokeWidth={3} fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          {data.map((v, i) => (
            <Circle key={`p${i}`} cx={x(i)} cy={y(v)} r={3.5} fill={colors.primary} />
          ))}
          {data.map((_, i) => (
            <SvgText key={`d${i}`} x={x(i)} y={H - 7} fontSize={10}
              fill={colors.gray} textAnchor="middle">{`${dayShort}${i + 1}`}</SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}

// ── État initial des réponses ─────────────────────────────────────────────────
const initialAnswers = {
  identification: [null, null, null],  // réponses oui/non aux 3 affirmations
  typeObjectif: null,                  // 'reduce' | 'stop'
  consoDeclaree: 12,
  consoUnite: 'jour',                  // 'jour' | 'semaine'
  cigarettesParPaquet: 20,
  prixPaquet: '12.50',
  dateDebut: localDateKey(),
  objectifQuotidien: 8,
  monnaie: 'EUR',
  motivations: [],
  motivationPerso: '',
  niveauMotivation: 5,
};

// ── Composant principal ───────────────────────────────────────────────────────
export default function OnboardingFlow({ navigation }) {
  const { t, i18n } = useTranslation('onboardingFlow');
  const { profile, updateProfile } = useUser();

  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const savingRef = useRef(false);

  // ── Reprise : brouillon local puis données déjà en base ────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          setAnswers(a => ({ ...a, ...draft.answers }));
          if (typeof draft.step === 'number') setStep(Math.min(draft.step, PAGES.length - 1));
        } else if (profile) {
          // Préremplissage depuis les données existantes (profil incomplet)
          setAnswers(a => ({
            ...a,
            typeObjectif: profile.typeObjectif ?? a.typeObjectif,
            consoDeclaree: profile.consoDeclaree ?? profile.consoAvantApp ?? a.consoDeclaree,
            consoUnite: profile.consoUnite ?? a.consoUnite,
            cigarettesParPaquet: profile.cigarettesParPaquet ?? a.cigarettesParPaquet,
            prixPaquet: profile.prixPaquet != null ? String(profile.prixPaquet) : a.prixPaquet,
            monnaie: profile.monnaie ?? a.monnaie,
            objectifQuotidien: profile.objectifCigarettes ?? a.objectifQuotidien,
            motivations: Array.isArray(profile.motivations) && profile.motivations.every(m => typeof m === 'string')
              ? profile.motivations.filter(m => MOTIVATIONS_CHOIX.some(c => c.key === m))
              : a.motivations,
            motivationPerso: profile.motivationPerso ?? a.motivationPerso,
            niveauMotivation: profile.niveauMotivation ?? a.niveauMotivation,
          }));
        }
      } catch (_) {}
      setDraftLoaded(true);
    })();
  }, []);

  // Sauvegarde du brouillon à chaque changement (reprise en cas de fermeture)
  useEffect(() => {
    if (!draftLoaded) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ step, answers })).catch(() => {});
  }, [step, answers, draftLoaded]);

  function set(key, value) {
    setAnswers(a => ({ ...a, [key]: value }));
  }

  // ── Séquence des pages (l'objectif quotidien saute en mode arrêt complet) ──
  // Plus de page "Bienvenue" distincte : l'utilisateur vient de se connecter
  // sur AuthScreen (Google/Apple/Email), une deuxième page d'accueil quasi
  // identique juste après n'apportait rien et proposait même un lien "j'ai
  // déjà un compte" mort (aucune route 'Login' dans ce stack).
  const PAGES = [
    'affirmation0', 'affirmation1', 'affirmation2', // 1-3
    'deculpabilisation',               // 4
    'solution',                        // 5
    'benefice0', 'benefice1', 'benefice2', 'benefice3', // 6-9
    'objectif',                        // 10
    'conso',                           // 11
    'paquet',                          // 12
    'prix',                            // 13
    'dateDebut',                       // 14
    'objectifQuotidien',               // 15 (si réduction)
    'devise',                          // 16
    'motivations',                     // 17
    'niveauMotivation',                // 18
    'synthese',                        // 19
  ];
  const pages = answers.typeObjectif === 'stop'
    ? PAGES.filter(p => p !== 'objectifQuotidien')
    : PAGES;
  const page = pages[Math.min(step, pages.length - 1)];
  const progress = (step + 1) / pages.length;

  function next() {
    jouerSon('onboarding_step');
    setStep(s => Math.min(s + 1, pages.length - 1));
  }
  function back() {
    setStep(s => Math.max(0, s - 1));
  }

  // ── Valeurs dérivées ────────────────────────────────────────────────────────
  const consoNormalisee = answers.consoUnite === 'semaine'
    ? Math.round((answers.consoDeclaree / 7) * 10) / 10
    : answers.consoDeclaree;
  const prixNum  = parseFloat(String(answers.prixPaquet).replace(',', '.'));
  const prixCig  = answers.cigarettesParPaquet > 0 && !isNaN(prixNum)
    ? prixNum / answers.cigarettesParPaquet : 0;
  const objectifFinal = answers.typeObjectif === 'stop' ? 0 : answers.objectifQuotidien;
  const ecoEstimeeMois = Math.max(0, (consoNormalisee - objectifFinal) * prixCig * 30);
  const ecoEstimeeAn   = Math.max(0, (consoNormalisee - objectifFinal) * prixCig * 365);
  const symboleDevise  = DEVISES.find(d => d.code === answers.monnaie)?.symbole ?? '€';

  // ── Validation par page (bouton désactivé tant que la réponse est invalide) ─
  function isValid() {
    switch (page) {
      case 'objectif':          return answers.typeObjectif != null;
      case 'conso':             return answers.consoDeclaree >= 1;
      case 'paquet':            return answers.cigarettesParPaquet >= 1;
      case 'prix':              return !isNaN(prixNum) && prixNum > 0;
      case 'dateDebut':         return !!answers.dateDebut;
      case 'objectifQuotidien': return answers.objectifQuotidien >= 0 && answers.objectifQuotidien < Math.max(consoNormalisee, 1);
      case 'devise':            return !!answers.monnaie;
      case 'motivations':       return answers.motivations.length > 0 || answers.motivationPerso.trim().length > 0;
      case 'niveauMotivation':  return answers.niveauMotivation >= 1 && answers.niveauMotivation <= 10;
      default:                  return true;
    }
  }

  // ── Sauvegarde finale (attend la réussite avant de quitter l'onboarding) ───
  async function handleFinish() {
    if (savingRef.current) return; // anti double-soumission
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const now = new Date().toISOString();
      const debutISO = new Date(answers.dateDebut + 'T00:00:00').toISOString();
      const result = await updateProfile({
        // Identification (3 affirmations oui/non)
        identification: {
          echecPasse:  answers.identification[0],
          automatisme: answers.identification[1],
          perduMethode: answers.identification[2],
        },
        // Objectif & consommation
        typeObjectif: answers.typeObjectif,             // 'reduce' | 'stop'
        consoDeclaree: answers.consoDeclaree,
        consoUnite: answers.consoUnite,                  // 'jour' | 'semaine'
        consoAvantApp: consoNormalisee,                  // référence quotidienne normalisée
        consoAvantDeclaree: true,
        objectifCigarettes: objectifFinal,
        reductionParSemaine: answers.typeObjectif === 'reduce' ? 2 : null,
        planStartDate: answers.typeObjectif === 'reduce' ? debutISO : null,
        // Budget
        cigarettesParPaquet: answers.cigarettesParPaquet,
        prixPaquet: Math.round(prixNum * 100) / 100,
        monnaie: answers.monnaie,                        // code ISO 4217
        // Dates
        dateArretSouhaitee: debutISO,
        startDate: debutISO,
        createdAt: profile?.createdAt ?? now,
        // Motivations
        motivations: answers.motivations,                // identifiants stables
        motivationPerso: answers.motivationPerso.trim() || null,
        niveauMotivation: answers.niveauMotivation,
        // Statut
        onboardingComplete: true,
        onboardingCompletedAt: now,
      });
      // Ne jamais marquer l'onboarding terminé si Firestore n'a pas confirmé
      // l'écriture : le brouillon local est conservé pour une reprise sûre.
      if (!result?.synced) throw result?.error ?? new Error('cloud-save-failed');
      await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      navigation.replace('Paywall');
    } catch (e) {
      setSaveError(t('summary.saveError'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (!draftLoaded) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Corps de page selon l'étape ────────────────────────────────────────────
  let body = null;
  let cta  = t('common:continue');
  let onCta = next;

  if (page.startsWith('affirmation')) {
    const idx = Number(page.slice(-1));
    const affirmationItems = t('affirmations.items', { returnObjects: true });
    body = (
      <>
        <Text style={st.title}>{t('affirmations.title')}</Text>
        <View style={st.affirmationCard}>
          <Text style={st.affirmationText}>{t('affirmations.quoted', { text: affirmationItems[idx] })}</Text>
        </View>
        {/* Les panneaux de l'illustration 04 sont vides : leurs libellés sont
            natifs (positions reprises de page-redesignee.svg). */}
        <View style={idx === 2 ? st.illusBoxRatio : st.illusBoxBlanc}>
          <Image source={AFFIRMATION_HERO[idx]} style={st.illusImg} resizeMode="contain" />
          {idx === 2 && (
            <>
              <Text style={[st.cheminLabel, { left: '14.2%', top: '29%', color: colors.primaryDeep }]}>
                {t('affirmations.pathReduce')}
              </Text>
              <Text style={[st.cheminLabel, { left: '70.9%', top: '29%', color: '#A9653C' }]}>
                {t('affirmations.pathStop')}
              </Text>
            </>
          )}
        </View>
        <View style={st.ouiNonRow}>
          <TouchableOpacity
            style={[st.ouiNonBtn, answers.identification[idx] === false && st.ouiNonBtnNon]}
            onPress={() => {
              const id = [...answers.identification]; id[idx] = false;
              set('identification', id); next();
            }}
          >
            <IconNon size={32} />
            <Text style={st.ouiNonLabel}>{t('common:no')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.ouiNonBtn, answers.identification[idx] === true && st.ouiNonBtnOui]}
            onPress={() => {
              const id = [...answers.identification]; id[idx] = true;
              set('identification', id); next();
            }}
          >
            <Image source={V2.actionOui} style={st.ouiNonImg} resizeMode="contain" />
            <Text style={st.ouiNonLabel}>{t('common:yes')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={st.footerNote}>{t('affirmations.footer')}</Text>
      </>
    );
    cta = null; // les boutons Oui/Non font avancer
  }

  else if (page === 'deculpabilisation') {
    body = (
      <>
        <Text style={st.title}>{t('deculpabilisation.title')}</Text>
        <Text style={st.subtitle}>
          {t('deculpabilisation.subtitle')}
        </Text>
        <View style={st.chartCard}>
          <Text style={st.chartCardTitre}>{t('deculpabilisation.chartTitle')}</Text>
          <Text style={st.chartCardUnite}>{t('deculpabilisation.chartUnit')}</Text>
          <LineChart
            data={SUIVI_QUOTIDIEN}
            maxY={15}
            ticks={[0, 5, 10, 15]}
            refValue={SUIVI_QUOTIDIEN[0]}
            dayShort={t('chart.dayShort')}
          />
          <View style={st.legendRow}>
            <View style={st.legendItem}>
              <View style={[st.legendDash, { backgroundColor: '#C8A88A' }]} />
              <Text style={st.legendLabel}>{t('deculpabilisation.legendStart')}</Text>
            </View>
            <View style={st.legendItem}>
              <View style={[st.legendDash, { backgroundColor: colors.primary }]} />
              <Text style={st.legendLabel}>{t('deculpabilisation.legendDaily')}</Text>
            </View>
          </View>
        </View>
        <Text style={st.leadText}>{t('deculpabilisation.lead')}</Text>
        <Text style={st.disclaimer}>{t('deculpabilisation.disclaimer')}</Text>
      </>
    );
  }

  else if (page === 'solution') {
    body = (
      <>
        <Text style={st.title}>{t('solution.title')}</Text>
        <Text style={st.subtitle}>
          {t('solution.subtitle')}
        </Text>
        <View style={st.illusBoxBlanc}>
          <Image source={V2.illusPlan} style={st.illusImg} resizeMode="contain" />
        </View>
        <View style={st.solutionChipsRow}>
          <View style={st.solutionChip}>
            <Image source={V2.etapeConso} style={st.solutionChipIcon} resizeMode="contain" />
            <Text style={st.solutionChipText}>{t('solution.chips.consumption')}</Text>
          </View>
          <View style={st.solutionChip}>
            <Image source={V2.etapeHabitudes} style={st.solutionChipIcon} resizeMode="contain" />
            <Text style={st.solutionChipText}>{t('solution.chips.habits')}</Text>
          </View>
          <View style={st.solutionChip}>
            <Image source={V2.etapeObjectif} style={st.solutionChipIcon} resizeMode="contain" />
            <Text style={st.solutionChipText}>{t('solution.chips.goal')}</Text>
          </View>
        </View>
      </>
    );
  }

  else if (page.startsWith('benefice')) {
    const beneficeIdx = Number(page.slice(-1));
    const b = t(`benefits.items.${beneficeIdx}`, { returnObjects: true });
    const journalRows = t('benefits.journal.rows', { returnObjects: true });
    const JOURNAL_ICONS = [V2.journalCoffee, V2.journalPause, V2.journalCoffee];
    const TRIGGERS = [
      { img: V2.decCoffee,  k: 'coffee'  }, { img: V2.decStress, k: 'stress' },
      { img: V2.decWine,    k: 'alcohol' }, { img: V2.decFriends, k: 'friends' },
      { img: V2.decPause,   k: 'pause'   }, { img: V2.decEnergy, k: 'energy' },
    ];
    body = (
      <>
        <Text style={st.title}>{b.title}</Text>
        <Text style={st.subtitle}>{b.text}</Text>

        {/* 07 — journal d'exemple + habitude repérée */}
        {beneficeIdx === 0 && (
          <>
            <View style={st.mockCard}>
              <View style={st.journalHeader}>
                <Text style={st.journalTitre}>{t('benefits.journal.title')}</Text>
                <View style={st.tagPill}><Text style={st.tagPillText}>{t('benefits.journal.tag')}</Text></View>
              </View>
              {journalRows.map((r, i) => (
                <View key={r.time} style={[st.mockRow, i === journalRows.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={st.mockHeure}>{r.time}</Text>
                  <Image source={JOURNAL_ICONS[i]} style={st.journalIcon} resizeMode="contain" />
                  <Text style={st.mockTexte}>{r.label}</Text>
                </View>
              ))}
            </View>
            <View style={st.persoRow}>
              <View style={st.persoBadge}>
                <Image source={V2.habitudesReperees} style={{ width: 30, height: 30 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.persoTitre}>{t('benefits.journal.insightTitle')}</Text>
                <Text style={st.persoText}>{t('benefits.journal.insightText')}</Text>
              </View>
            </View>
          </>
        )}

        {/* 08 — scène + les 6 contextes validés du pack */}
        {beneficeIdx === 1 && (
          <>
            <View style={st.illusBoxBlanc}>
              <Image source={V2.illusDeclencheurs} style={st.illusImg} resizeMode="contain" />
            </View>
            <View style={st.trigGrid}>
              {TRIGGERS.map(tr => (
                <View key={tr.k} style={st.trigChip}>
                  <Image source={tr.img} style={st.trigChipIcon} resizeMode="contain" />
                  <Text style={st.trigChipText}>{t(`benefits.triggers.${tr.k}`)}</Text>
                </View>
              ))}
            </View>
            <Text style={st.footerNote}>{t('benefits.triggers.footer')}</Text>
          </>
        )}

        {/* 09 — paliers chiffrés, entièrement natifs */}
        {beneficeIdx === 2 && (
          <>
            <View style={st.mockCard}>
              <Text style={st.chartCardTitre}>{t('benefits.pace.title')}</Text>
              <View style={st.paliersRow}>
                {PALIERS_V2.map((v, i) => (
                  <React.Fragment key={v}>
                    {i > 0 && <Text style={st.paliersFleche}>→</Text>}
                    <View style={[st.palierCard, i === PALIERS_V2.length - 1 && st.palierCardFinal]}>
                      <Text style={st.palierNum}>{v}</Text>
                      <Text style={st.palierUnit}>{t('benefits.pace.unit')}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              <Text style={st.disclaimer}>{t('benefits.pace.note')}</Text>
            </View>
            <View style={st.persoRow}>
              <View style={st.persoBadge}>
                <Image source={V2.objectifDuJour} style={{ width: 30, height: 30 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.persoTitre}>{t('benefits.pace.goalTitle')}</Text>
                <Text style={st.persoText}>{t('benefits.pace.goalValue')}</Text>
              </View>
            </View>
          </>
        )}

        {/* 10 — bénéfices chiffrés + cumul des cigarettes évitées */}
        {beneficeIdx === 3 && (
          <View style={st.statsPanel}>
            <StatCard img={V2.statAvoided} teinte={colors.primaryLight}
              valeur={t('benefits.stats.avoidedValue')} label={t('benefits.stats.avoidedNote')} />
            <StatCard img={V2.statWallet} teinte={colors.primaryLight}
              valeur={t('benefits.stats.savedValue')} label={t('benefits.stats.savedNote')} />
            <StatCard img={V2.statTime} teinte="#EFE9FB"
              valeur={t('benefits.stats.timeValue')} label={t('benefits.stats.timeNote')} />
            <View style={st.chartCard}>
              <Text style={st.chartCardTitre}>{t('benefits.stats.chartTitle')}</Text>
              <LineChart
                data={CUMUL_EVITEES}
                maxY={50}
                ticks={[0, 25, 50]}
                dayShort={t('chart.dayShort')}
              />
            </View>
            <Text style={st.disclaimer}>{t('benefits.stats.disclaimer')}</Text>
          </View>
        )}
      </>
    );
  }

  else if (page === 'objectif') {
    body = (
      <>
        <Text style={st.title}>{t('goalType.title')}</Text>
        <Text style={st.subtitle}>{t('goalType.subtitle')}</Text>
        {[
          { key: 'reduce', img: V2.goalReduce, titre: t('goalType.options.reduce.title'), desc: t('goalType.options.reduce.desc') },
          { key: 'stop',   img: V2.goalStop,   titre: t('goalType.options.stop.title'),   desc: t('goalType.options.stop.desc') },
        ].map(o => (
          <TouchableOpacity
            key={o.key}
            style={[st.objectifCard, answers.typeObjectif === o.key && st.choixCardActive]}
            onPress={() => set('typeObjectif', o.key)}
          >
            <Image source={o.img} style={st.objectifImg} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={st.choixTitre}>{o.titre}</Text>
              <Text style={st.choixDesc}>{o.desc}</Text>
            </View>
            {answers.typeObjectif === o.key && (
              <View style={st.checkBadge}><Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text></View>
            )}
          </TouchableOpacity>
        ))}
        <Text style={st.footerNote}>{t('goalType.note')}</Text>
      </>
    );
  }

  else if (page === 'conso') {
    body = (
      <>
        <Text style={st.title}>{t('consumption.title')}</Text>
        <Text style={st.subtitle}>{t('consumption.subtitle')}</Text>
        <View style={st.stepperRow}>
          <TouchableOpacity style={st.stepperBtn} onPress={() => set('consoDeclaree', Math.max(1, answers.consoDeclaree - 1))}>
            <Text style={st.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <View style={st.stepperCenter}>
            <Text style={st.stepperNum}>{answers.consoDeclaree}</Text>
            <Text style={st.stepperUnit}>{t('consumption.cigarettesPerUnit', { unit: t(`consumption.unit.${answers.consoUnite}`) })}</Text>
          </View>
          <TouchableOpacity style={st.stepperBtn} onPress={() => set('consoDeclaree', answers.consoDeclaree + 1)}>
            <Text style={st.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={st.toggleRow}>
          {['jour', 'semaine'].map(u => (
            <TouchableOpacity
              key={u}
              style={[st.toggleBtn, answers.consoUnite === u && st.toggleBtnActive]}
              onPress={() => set('consoUnite', u)}
            >
              <Text style={[st.toggleText, answers.consoUnite === u && st.toggleTextActive]}>
                {t(`consumption.toggle.${u}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {answers.consoUnite === 'semaine' && (
          <Text style={st.hint}>{t('consumption.estimatedPerDay', { count: consoNormalisee })}</Text>
        )}
      </>
    );
  }

  else if (page === 'paquet') {
    body = (
      <>
        <Text style={st.title}>{t('packSize.title')}</Text>
        <Text style={st.subtitle}>{t('packSize.subtitle')}</Text>
        <View style={st.stepperRow}>
          <TouchableOpacity style={st.stepperBtn} onPress={() => set('cigarettesParPaquet', Math.max(1, answers.cigarettesParPaquet - 1))}>
            <Text style={st.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <View style={st.stepperCenter}>
            <Text style={st.stepperNum}>{answers.cigarettesParPaquet}</Text>
            <Text style={st.stepperUnit}>{t('packSize.unit')}</Text>
          </View>
          <TouchableOpacity style={st.stepperBtn} onPress={() => set('cigarettesParPaquet', answers.cigarettesParPaquet + 1)}>
            <Text style={st.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  else if (page === 'prix') {
    body = (
      <>
        <Text style={st.title}>{t('packPrice.title')}</Text>
        <Text style={st.subtitle}>{t('packPrice.subtitle')}</Text>
        <View style={st.prixRow}>
          <TextInput
            style={st.prixInput}
            value={String(answers.prixPaquet)}
            onChangeText={v => set('prixPaquet', v)}
            keyboardType="decimal-pad"
            placeholder="12.50"
            placeholderTextColor="#B0B0B0"
            accessibilityLabel={t('packPrice.priceLabel')}
          />
          <Text style={st.prixDevise}>{symboleDevise}</Text>
        </View>
        {!isValid() && String(answers.prixPaquet).length > 0 && (
          <Text style={st.errorHint}>{t('packPrice.error')}</Text>
        )}
      </>
    );
  }

  else if (page === 'dateDebut') {
    body = (
      <>
        <Text style={st.title}>{t('startDate.title')}</Text>
        <Text style={st.subtitle}>{t('startDate.subtitle')}</Text>
        <Calendrier
          selected={answers.dateDebut}
          onSelect={k => set('dateDebut', k)}
          weekdays={t('startDate.calendarWeekdays', { returnObjects: true })}
          locale={i18n.language}
        />
        {answers.dateDebut && (
          <Text style={st.hint}>
            {t('startDate.hint', {
              date: new Date(answers.dateDebut + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }),
            })}
          </Text>
        )}
      </>
    );
  }

  else if (page === 'objectifQuotidien') {
    body = (
      <>
        <Text style={st.title}>{t('dailyGoal.title')}</Text>
        <Text style={st.subtitle}>{t('dailyGoal.subtitle')}</Text>
        <View style={st.stepperRow}>
          <TouchableOpacity style={st.stepperBtn} onPress={() => set('objectifQuotidien', Math.max(0, answers.objectifQuotidien - 1))}>
            <Text style={st.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <View style={st.stepperCenter}>
            <Text style={st.stepperNum}>{answers.objectifQuotidien}</Text>
            <Text style={st.stepperUnit}>{t('dailyGoal.unit')}</Text>
          </View>
          <TouchableOpacity style={st.stepperBtn} onPress={() => set('objectifQuotidien', answers.objectifQuotidien + 1)}>
            <Text style={st.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        {answers.objectifQuotidien >= consoNormalisee && (
          <Text style={st.errorHint}>
            {t('dailyGoal.error', { count: consoNormalisee })}
          </Text>
        )}
      </>
    );
  }

  else if (page === 'devise') {
    body = (
      <>
        <Text style={st.title}>{t('currency.title')}</Text>
        <Text style={st.subtitle}>{t('currency.subtitle')}</Text>
        {DEVISES.map(d => (
          <TouchableOpacity
            key={d.code}
            style={[st.choixCard, answers.monnaie === d.code && st.choixCardActive]}
            onPress={() => set('monnaie', d.code)}
          >
            <Image source={DEVISE_ICONS[d.code]} style={{ width: 48, height: 48 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={st.choixTitre}>{t(`currency.options.${d.code}.name`)}</Text>
              <Text style={st.choixDesc}>{t(`currency.options.${d.code}.code`)}</Text>
            </View>
            {answers.monnaie === d.code && (
              <View style={st.checkBadge}><Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </>
    );
  }

  else if (page === 'motivations') {
    body = (
      <>
        <Text style={st.title}>{t('motivations.title')}</Text>
        <Text style={st.subtitle}>{t('motivations.subtitle')}</Text>
        <View style={st.motivGrid}>
          {MOTIVATIONS_CHOIX.map(m => {
            const active = answers.motivations.includes(m.key);
            return (
              <TouchableOpacity
                key={m.key}
                style={[st.motivChip, active && st.motivChipActive]}
                onPress={() => {
                  if (active) set('motivations', answers.motivations.filter(k => k !== m.key));
                  else if (answers.motivations.length < 3) set('motivations', [...answers.motivations, m.key]);
                }}
              >
                <Image source={MOTIV_ICONS_V2[m.key]} style={st.motivImg} resizeMode="contain" />
                <Text style={[st.motivLabel, active && { color: colors.primary, fontWeight: '700' }]}>{t(`motivations.options.${m.key}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={st.motivPersoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm }}>
            <Image source={V2.motivPerso} style={{ width: 26, height: 26 }} resizeMode="contain" />
            <Text style={[st.motivPersoTitre, { marginBottom: 0 }]}>{t('motivations.personalTitle')}</Text>
          </View>
          <TextInput
            style={st.motivPersoInput}
            value={answers.motivationPerso}
            onChangeText={v => set('motivationPerso', v)}
            placeholder={t('motivations.personalPlaceholder')}
            placeholderTextColor="#B0B0B0"
            maxLength={120}
            accessibilityLabel={t('motivations.personalA11y')}
          />
        </View>
      </>
    );
  }

  else if (page === 'niveauMotivation') {
    const lvl = answers.niveauMotivation;
    body = (
      <>
        <Text style={st.title}>{t('motivationLevel.title')}</Text>
        <Text style={st.subtitle}>{t('motivationLevel.subtitle')}</Text>
        <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
          <View style={st.nivCircle}>
            <Text style={st.nivNum}>{lvl}</Text>
            <Text style={{ fontSize: font.md, color: colors.gray }}>/ 10</Text>
          </View>
        </View>
        <View style={st.nivDots}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <TouchableOpacity
              key={n}
              style={[st.nivDot, { backgroundColor: n <= lvl ? colors.primary : colors.grayBorder }]}
              onPress={() => set('niveauMotivation', n)}
              accessibilityLabel={t('motivationLevel.levelA11y', { n })}
            />
          ))}
        </View>
        <View style={st.nivLabels}>
          <Text style={st.hint}>{t('motivationLevel.low')}</Text>
          <Text style={st.hint}>{t('motivationLevel.high')}</Text>
        </View>
        <View style={st.nivManuelRow}>
          <Text style={{ flex: 1, fontSize: font.sm, color: colors.black, fontWeight: '600' }}>Saisir manuellement</Text>
          <TextInput
            style={st.nivInput}
            value={String(lvl)}
            onChangeText={v => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 1 && n <= 10) set('niveauMotivation', n);
            }}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel="Niveau de motivation de 1 à 10"
          />
        </View>
      </>
    );
  }

  else if (page === 'synthese') {
    const motivLabels = answers.motivations
      .filter(k => MOTIVATIONS_CHOIX.some(m => m.key === k))
      .map(k => t(`motivations.options.${k}`));
    body = (
      <>
        <Text style={st.title}>Ton parcours est prêt 🎉</Text>
        <Text style={st.subtitle}>Voici un résumé de ton plan personnalisé.</Text>
        <View style={st.syntheseCard}>
          <SyntheseRow img={PICTOS_PLAN.objectif} label="Objectif"
            valeur={answers.typeObjectif === 'stop' ? 'Arrêter complètement' : 'Réduire progressivement'} />
          <SyntheseRow emoji="🚬" label="Consommation actuelle"
            valeur={`${consoNormalisee} cig / jour`} />
          <SyntheseRow img={PICTOS_PLAN.palier} label="Objectif quotidien"
            valeur={`${objectifFinal} cig / jour max`} />
          <SyntheseRow emoji="💶" label="Prix du paquet"
            valeur={`${isNaN(prixNum) ? '—' : prixNum.toFixed(2)} ${symboleDevise} (${answers.cigarettesParPaquet} cig.)`} />
          <SyntheseRow emoji="📅" label="Début"
            valeur={new Date(answers.dateDebut + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <SyntheseRow img={PICTOS_PLAN.economie} label="Économie estimée"
            valeur={`≈ ${ecoEstimeeMois.toFixed(0)} ${symboleDevise} / mois\n≈ ${Math.round(ecoEstimeeAn).toLocaleString('fr-FR')} ${symboleDevise} / an`} />
          {motivLabels.length > 0 && (
            <SyntheseRow emoji="💚" label="Motivations" valeur={motivLabels.join(' · ')} />
          )}
          {answers.motivationPerso.trim() !== '' && (
            <SyntheseRow emoji="✏️" label="Votre mot" valeur={`« ${answers.motivationPerso.trim()} »`} />
          )}
          <SyntheseRow emoji="🔥" label="Motivation" valeur={`${answers.niveauMotivation} / 10`} />
        </View>
        {saveError && <Text style={st.errorHint}>{saveError}</Text>}
      </>
    );
    cta   = saving ? null : 'Commencer  🚀';
    onCta = handleFinish;
  }

  return (
    <SafeAreaView style={st.safe}>
      {/* Header : retour + barre de progression */}
      <View style={st.header}>
        <TouchableOpacity onPress={back} style={st.backBtn} accessibilityLabel="Retour">
          <Text style={{ fontSize: 24, color: colors.black, fontWeight: '300' }}>←</Text>
        </TouchableOpacity>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>

        {cta && (
          <View style={st.bottom}>
            <PrimaryButton title={cta} onPress={onCta} disabled={!isValid()} />
          </View>
        )}
        {saving && (
          <View style={st.bottom}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ textAlign: 'center', color: colors.gray, fontSize: 12, marginTop: 8 }}>
              Enregistrement de ton parcours…
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Calendrier mensuel (page date de début) ──────────────────────────────────
function Calendrier({ selected, onSelect }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const init  = selected ? new Date(selected + 'T12:00:00') : today;
  const [mois, setMois] = useState(new Date(init.getFullYear(), init.getMonth(), 1));

  const annee   = mois.getFullYear();
  const moisIdx = mois.getMonth();
  const nbJours = new Date(annee, moisIdx + 1, 0).getDate();
  const premier = (new Date(annee, moisIdx, 1).getDay() + 6) % 7; // 0 = lundi
  const titre   = mois.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const todayKey = localDateKey(today);

  const cells = [
    ...Array.from({ length: premier }, () => null),
    ...Array.from({ length: nbJours }, (_, i) => i + 1),
  ];
  const estMoisCourant = annee === today.getFullYear() && moisIdx === today.getMonth();

  return (
    <View style={st.calCard}>
      <View style={st.calHeader}>
        <TouchableOpacity
          style={st.calNavBtn}
          disabled={estMoisCourant}
          onPress={() => setMois(new Date(annee, moisIdx - 1, 1))}
        >
          <Text style={[st.calNavText, estMoisCourant && { color: colors.grayBorder }]}>‹</Text>
        </TouchableOpacity>
        <Text style={st.calTitre}>{titre.charAt(0).toUpperCase() + titre.slice(1)}</Text>
        <TouchableOpacity style={st.calNavBtn} onPress={() => setMois(new Date(annee, moisIdx + 1, 1))}>
          <Text style={st.calNavText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={st.calSemaine}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, i) => (
          <Text key={i} style={st.calJourLbl}>{j}</Text>
        ))}
      </View>

      <View style={st.calGrille}>
        {cells.map((jour, i) => {
          if (jour === null) return <View key={i} style={st.calCell} />;
          const key = `${annee}-${String(moisIdx + 1).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
          const passe   = key < todayKey;
          const actif   = key === selected;
          const estAuj  = key === todayKey;
          return (
            <TouchableOpacity
              key={i}
              style={[st.calCell, actif && st.calCellActive, estAuj && !actif && st.calCellToday]}
              disabled={passe}
              onPress={() => onSelect(key)}
            >
              <Text style={[
                st.calCellText,
                passe && { color: colors.grayBorder },
                actif && { color: colors.white, fontWeight: '800' },
                estAuj && !actif && { color: colors.primary, fontWeight: '800' },
              ]}>{jour}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Carte statistique (page bénéfice "bénéfices concrets") ───────────────────
function StatCard({ img, teinte, valeur, label }) {
  return (
    <View style={st.statCard}>
      <View style={[st.statBadge, { backgroundColor: teinte }]}>
        <Image source={img} style={st.statBadgeImg} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.statValeur}>{valeur}</Text>
        <Text style={st.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SyntheseRow({ emoji, img, label, valeur }) {
  return (
    <View style={st.synthRow}>
      {img
        ? <Image source={img} style={{ width: 30, height: 30 }} resizeMode="contain" />
        : <Text style={{ fontSize: 18, width: 30 }}>{emoji}</Text>}
      <Text style={st.synthLabel}>{label}</Text>
      <Text style={st.synthVal}>{valeur}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#EDEDED', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 40 },
  bottom:  { padding: spacing.lg, backgroundColor: colors.white },

  title:    { fontSize: 24, fontWeight: '800', color: colors.black, textAlign: 'center', lineHeight: 32, marginBottom: spacing.sm },
  subtitle: { fontSize: font.sm, color: colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  hint:     { fontSize: 12, color: colors.gray, textAlign: 'center', marginTop: spacing.sm },
  errorHint: { fontSize: 12, color: '#DC2626', textAlign: 'center', marginTop: spacing.sm },

  // Bienvenue
  welcomeHero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: spacing.xl, gap: spacing.md,
  },
  welcomeTitle: { fontSize: 30, fontWeight: '800', color: colors.black, textAlign: 'center', lineHeight: 40 },
  welcomeSub:   { fontSize: font.md, color: colors.gray, textAlign: 'center', lineHeight: 24 },

  // Affirmations
  affirmationCard: {
    backgroundColor: colors.primaryLight, borderRadius: radius.xl,
    padding: spacing.lg, marginVertical: spacing.lg,
  },
  affirmationText: { fontSize: font.md, color: colors.black, lineHeight: 26, textAlign: 'center', fontStyle: 'italic' },
  ouiNonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  ouiNonBtn: {
    flex: 1, borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.xl,
    paddingVertical: 22, alignItems: 'center', gap: 6, minHeight: 88,
  },
  ouiNonBtnOui: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  ouiNonBtnNon: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  ouiNonImg:   { width: 32, height: 32 },
  ouiNonLabel: { fontSize: font.md, fontWeight: '700', color: colors.black },

  // Déculpabilisation
  chartCard: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md, marginVertical: spacing.md, backgroundColor: colors.white,
  },
  chartCardTitre: { fontSize: font.md, fontWeight: '800', color: colors.primaryDeep },
  chartCardUnite: { fontSize: 11, color: colors.gray, marginTop: 4 },
  legendRow:  { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDash: { width: 18, height: 3, borderRadius: 2 },
  legendLabel: { fontSize: 11, color: colors.gray },
  leadText: {
    fontSize: font.md, fontWeight: '800', color: colors.primaryDeep,
    lineHeight: 22, marginTop: spacing.xs,
  },
  disclaimer: { fontSize: 11, color: colors.gray, marginTop: spacing.sm },
  chartLegRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  // Comparatif « avec / sans accompagnement » (page 05) — chart width 370 pt
  comparCard: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    paddingVertical: spacing.md, marginVertical: spacing.md,
    backgroundColor: colors.white,
  },
  comparImg: { width: '100%', height: 195 },
  comparLeg: {
    position: 'absolute', left: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  comparLegText: { fontSize: 12, fontWeight: '700' },
  persoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md, backgroundColor: colors.white,
  },
  persoBadge: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  persoTitre: { fontSize: 16, fontWeight: '800', color: colors.black, marginBottom: 2 },
  // Parcours de réduction (page 09) — paliers natifs posés sur le PNG
  parcoursWrap: {
    height: 240, marginVertical: spacing.md, borderRadius: radius.xl,
    overflow: 'hidden', backgroundColor: '#FBF8F1',
  },
  parcoursImg: { width: '100%', height: '100%' },
  parcoursPalier: { position: 'absolute', width: '20%', alignItems: 'center' },
  parcoursNum: { fontSize: 17, fontWeight: '900', color: colors.black, lineHeight: 20 },
  parcoursLbl: { fontSize: 9, color: colors.gray, textAlign: 'center', lineHeight: 11 },
  persoText: { fontSize: 13, color: colors.black, lineHeight: 19 },
  legDot:  { width: 8, height: 8, borderRadius: 4 },
  legText: { fontSize: 12, color: colors.gray },
  chartNote: { fontSize: 10, color: colors.gray, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },

  // Puces "La consommation / Tes habitudes / Ton objectif" (page solution)
  // Puces sur une seule ligne, comme la maquette 06
  solutionChipsRow: { flexDirection: 'row', gap: 6 },
  solutionChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingVertical: 8, paddingHorizontal: 6,
  },
  solutionChipIcon: { width: 16, height: 16 },
  solutionChipText: { fontSize: 10, fontWeight: '700', color: colors.primaryDeep, flexShrink: 1 },

  // Bénéfices
  beneficeCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  // Illustrations HD plein cadre (fond crème assorti aux images)
  illusBox: {
    height: 210, borderRadius: radius.xl, overflow: 'hidden',
    marginVertical: spacing.md, backgroundColor: '#FBF8F1',
  },
  illusImg: { width: '100%', height: '100%' },

  // Maquettes visuelles des pages bénéfices
  mockCard: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md, marginTop: spacing.sm, backgroundColor: colors.white,
  },
  mockRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  mockHeure: { fontSize: 13, fontWeight: '700', color: colors.black, width: 46 },
  mockTexte: { flex: 1, fontSize: 13, color: colors.black },
  mockPlus: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  mockDetecte: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, marginTop: spacing.sm,
  },
  mockDetecteTitre: { fontSize: 12, fontWeight: '700', color: colors.primary },
  mockDetecteTexte: { fontSize: 11, color: colors.black, marginTop: 2, lineHeight: 15 },

  // Carte des déclencheurs
  trigMap: { marginTop: spacing.md, gap: spacing.sm },
  trigMapRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  trigCentre: { alignItems: 'center', paddingVertical: spacing.xs },
  trigBulle: {
    alignItems: 'center', gap: 2,
    backgroundColor: '#F7F8FA', borderWidth: 1, borderColor: colors.grayBorder,
    borderRadius: radius.xl, paddingVertical: 10, paddingHorizontal: 16, minWidth: 84,
  },
  trigBulleTexte: { fontSize: 11, fontWeight: '600', color: colors.black },

  // Escalier de réduction
  escalier: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-evenly', paddingTop: spacing.sm },
  escalierCol: { alignItems: 'center', gap: 4 },
  escalierVal: { fontSize: 15, fontWeight: '800', color: colors.black },
  escalierBarre: { width: 44, borderRadius: 8, backgroundColor: colors.primary, opacity: 0.85 },
  escalierLbl: { fontSize: 9, color: colors.gray },
  escalierPill: {
    backgroundColor: colors.primaryLight, borderRadius: radius.full,
    paddingVertical: 8, alignItems: 'center', marginTop: spacing.md,
  },

  // Stats concrètes (page bénéfice 10) — cartes de 80 pt, cf. layout-ios.json
  statsPanel:  { marginTop: spacing.sm, gap: 10 },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsPill: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.full,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  statsPillText: { fontSize: 12, fontWeight: '600', color: colors.gray },
  statCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    minHeight: 80, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    backgroundColor: colors.white,
  },
  statBadge:    { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  statBadgeImg: { width: 32, height: 32 },
  statValeur:   { fontSize: 16, fontWeight: '800', color: colors.primaryDeep, lineHeight: 21 },
  statLabel:    { fontSize: 11, color: colors.gray, marginTop: 2, lineHeight: 15 },

  // Écran 02/03/04 et 06/08 : scènes du pack, fond blanc opaque (ne pas détourer)
  illusBoxBlanc: {
    height: 230, borderRadius: radius.xl, overflow: 'hidden',
    marginVertical: spacing.md, backgroundColor: colors.white,
  },
  footerNote: { fontSize: 12, color: colors.gray, textAlign: 'center', marginTop: spacing.md },
  // Ratio exact de l'illustration 04 (366 × 244) pour caler les libellés natifs
  illusBoxRatio: {
    width: '100%', aspectRatio: 366 / 244, borderRadius: radius.xl,
    overflow: 'hidden', marginVertical: spacing.md, backgroundColor: colors.white,
  },
  cheminLabel: { position: 'absolute', fontSize: 11, fontWeight: '700' },

  // Écran 07 — journal d'exemple
  journalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  journalTitre:  { fontSize: font.md, fontWeight: '800', color: colors.primaryDeep },
  journalIcon:   { width: 22, height: 22 },
  tagPill:     { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingVertical: 3, paddingHorizontal: 10 },
  tagPillText: { fontSize: 10, fontWeight: '700', color: colors.primaryDeep },

  // Écran 08 — contextes déclencheurs
  trigGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  trigChip: {
    width: '31.5%', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  trigChipIcon: { width: 30, height: 30 },
  trigChipText: { fontSize: 11, fontWeight: '600', color: colors.black },

  // Écran 09 — paliers chiffrés
  paliersRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.md },
  paliersFleche: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  palierCard: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.lg, backgroundColor: '#F2F7F3',
  },
  palierCardFinal: { backgroundColor: colors.primaryLight },
  palierNum:  { fontSize: 20, fontWeight: '900', color: colors.primaryDeep, lineHeight: 24 },
  palierUnit: { fontSize: 9, color: colors.gray },

  // Calendrier
  calCard: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md, backgroundColor: colors.white,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  calNavBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
  },
  calNavText: { fontSize: 20, color: colors.primary, fontWeight: '600' },
  calTitre:   { fontSize: font.md, fontWeight: '800', color: colors.black },
  calSemaine: { flexDirection: 'row', marginBottom: 4 },
  calJourLbl: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.gray, fontWeight: '600' },
  calGrille:  { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', borderRadius: 999,
  },
  calCellActive: { backgroundColor: colors.primary },
  calCellToday:  { borderWidth: 1.5, borderColor: colors.primary },
  calCellText:   { fontSize: 14, color: colors.black },

  // Choix (objectif / devise)
  choixCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm, minHeight: 72,
  },
  choixCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  // Cartes d'objectif (page 11) — hauteur 124 pt, icône 96 px, cf. layout-ios.json
  objectifCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.xl,
    paddingHorizontal: spacing.md, marginBottom: spacing.md, height: 124,
  },
  objectifImg: { width: 96, height: 96 },
  choixTitre: { fontSize: font.md, fontWeight: '700', color: colors.black },
  choixDesc:  { fontSize: 12, color: colors.gray, marginTop: 2 },
  choixImg:   { width: 52, height: 52, borderRadius: 26 },
  motivImg:   { width: 44, height: 44 },
  checkBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  // Steppers
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.lg },
  stepperBtn: {
    width: 56, height: 56, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 30, color: colors.primary, fontWeight: '300', lineHeight: 34 },
  stepperCenter:  { alignItems: 'center', flex: 1 },
  stepperNum:  { fontSize: 56, fontWeight: '900', color: colors.black, lineHeight: 60 },
  stepperUnit: { fontSize: 12, color: colors.gray },

  // Toggle jour / semaine
  toggleRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  toggleBtn: {
    paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.grayBorder,
  },
  toggleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  toggleText: { fontSize: font.sm, color: colors.gray, fontWeight: '600' },
  toggleTextActive: { color: colors.primary },

  // Prix
  prixRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginVertical: spacing.lg,
  },
  prixInput: {
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.lg,
    fontSize: 40, fontWeight: '900', color: colors.black,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    minWidth: 160, textAlign: 'center',
  },
  prixDevise: { fontSize: 28, fontWeight: '800', color: colors.primary },

  // Date
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.xs, minHeight: 52,
  },
  dateRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  dateText: { fontSize: font.sm, color: colors.black },

  // Motivations
  // Grille 3 colonnes, cartes 111 × 119 pt (cf. layout-ios.json — 18-motivations)
  motivGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  motivChip: {
    width: '31.5%', height: 119,
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.xl,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  motivChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  motivLabel: { fontSize: 12, color: colors.black, textAlign: 'center' },
  motivPersoCard: {
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md, marginTop: spacing.md,
  },
  motivPersoTitre: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },
  motivPersoInput: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.md,
    padding: spacing.sm, fontSize: font.sm, color: colors.black, minHeight: 44,
  },

  // Niveau motivation
  nivCircle: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 6, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  nivNum: { fontSize: 56, fontWeight: '900', color: colors.primary, lineHeight: 62 },
  nivDots: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm, marginTop: spacing.md },
  nivDot:  { width: 26, height: 26, borderRadius: 13 },
  nivLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  nivManuelRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.lg,
    padding: spacing.md, marginTop: spacing.lg,
  },
  nivInput: {
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    fontSize: font.lg, fontWeight: '700', color: colors.black, minWidth: 64, textAlign: 'center',
  },

  // Synthèse
  syntheseCard: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md,
  },
  synthRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  synthLabel: { flex: 1, fontSize: 12, color: colors.gray },
  synthVal:   { fontSize: 12, fontWeight: '700', color: colors.black, maxWidth: '55%', textAlign: 'right' },
});
