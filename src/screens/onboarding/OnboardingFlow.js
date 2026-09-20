import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text as RNText, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useFonts } from 'expo-font';
import { colors, spacing, font, radius } from '../../theme';
import NatureBackground from '../../components/NatureBackground';
import { useUser } from '../../context/UserContext';
import { jouerSon } from '../../services/sounds';
import { localDateKey } from '../../utils/dateKeys';
import { buildOnboardingProfile } from './onboardingProfile';
import PlanLoading from './PlanLoading';

import { DRAFT_KEY } from '../../store/onboardingStore';
const PLAN_HD = {
  hero: require('../../../assets/onboarding/plan-adapte-hd/hero-plan-adapte.png'),
  back: require('../../../assets/onboarding/plan-adapte-hd/navigation-retour.png'),
  consumption: require('../../../assets/onboarding/plan-adapte-hd/consommation.png'),
  habits: require('../../../assets/onboarding/plan-adapte-hd/habitudes.png'),
  goal: require('../../../assets/onboarding/plan-adapte-hd/objectif.png'),
};
const CIGARETTE_CHOIX_HD = {
  hero: require('../../../assets/onboarding/cigarette-choix-hd/hero-suivi-cigarette.png'),
  insight: require('../../../assets/onboarding/cigarette-choix-hd/habitude-detectee.png'),
};
const DECLENCHEURS_HD = {
  hero: require('../../../assets/onboarding/declencheurs-hd/hero-declencheurs.png'),
  coffee: require('../../../assets/onboarding/declencheurs-hd/cafe.png'),
  stress: require('../../../assets/onboarding/declencheurs-hd/stress.png'),
  alcohol: require('../../../assets/onboarding/declencheurs-hd/alcool.png'),
  pause: require('../../../assets/onboarding/declencheurs-hd/pause.png'),
  friends: require('../../../assets/onboarding/declencheurs-hd/entourage.png'),
};
const REDUCTION_RYTHME_HD = {
  path: require('../../../assets/onboarding/reduction-rythme-hd/parcours-reduction.png'),
  goal: require('../../../assets/onboarding/reduction-rythme-hd/objectif-du-jour.png'),
  journey: require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/09-reduction-progressive.jpg'),
};
const OBJECTIF_HD = {
  reduce: require('../../../assets/onboarding/objectif-hd/reduire-progressivement.png'),
  stop: require('../../../assets/onboarding/objectif-hd/arreter-completement.png'),
};
const DESIGN = { ink: '#0B5135', green: '#0AA85B', muted: '#4B6358', mint: '#DDF5E8', border: '#E6EEE9' };

// Police livrée avec la maquette finale, limitée à l'onboarding.
function Text({ style, ...props }) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  const bold = weight === 'bold' || Number(weight) >= 600;
  return <RNText {...props} style={[{ fontFamily: bold ? 'DejaVuSans-Bold' : 'DejaVuSans' }, style]} />;
}

// ── Pack « Stopklop_Design_Assets_V2 » ───────────────────────────────────────
// Les 3 scènes illustrées sont des PNG RGB sur fond blanc opaque (volontaire :
// ne pas les détourer, cf. GUIDE-CLAUDE.md). Les icônes sont des RGBA
// transparents. Les courbes des écrans 05 et 10 sont dessinées nativement.
const V2 = {
  illusTentatives:  require('../../../assets/onboarding/v2/02-identification-tentatives/illustration-tentatives/illustration-tentatives.png'),
  // Le pack V2 livre pour « Non » une icône « pause » (deux barres vertes) :
  // on garde les boutons du premier pack, croix rouge et coche verte.
  actionNon:        require('../../../assets/onboarding/v2/02-identification-tentatives/non-rouge/non-rouge.png'),
  actionOui:        require('../../../assets/onboarding/v2/02-identification-tentatives/oui-vert/oui-vert.png'),
  illusAutomatisme: require('../../../assets/onboarding/v2/03-identification-automatisme/illustration-automatisme/illustration-automatisme.png'),
  illusChemins:     require('../../../assets/onboarding/v2/04-identification-reduction/illustration-chemins/illustration-chemins.png'),
  illusPlan:        require('../../../assets/onboarding/v2/06-plan-adapte/illustration-plan/illustration-plan.png'),
  planConso:        require('../../../assets/onboarding/v2/06-plan-adapte/consommation/consommation.png'),
  planHabitudes:    require('../../../assets/onboarding/v2/06-plan-adapte/habitudes/habitudes.png'),
  planObjectif:     require('../../../assets/onboarding/v2/06-plan-adapte/objectif/objectif.png'),
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
  courbeEvolution:  require('../../../assets/onboarding/v2/10-benefices-concrets/courbe-evolution/courbe-evolution.png'),
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
// Icônes 3D de l'app pour le résumé final (frise « Ton chemin »), recadrées
// au plus près du dessin et carrées pour être bien centrées dans les ronds.
const RECAP = {
  paquet:       require('../../../assets/ui-kit/recap/paquet_cigarettes.png'),
  calendrier:   require('../../../assets/ui-kit/recap/calendrier_mois.png'),
  escalier:     require('../../../assets/ui-kit/recap/escalier_reduction.png'),
  limite:       require('../../../assets/ui-kit/recap/cible_limite.png'),
  cible:        require('../../../assets/ui-kit/recap/cible_objectif.png'),
  portefeuille: require('../../../assets/ui-kit/recap/portefeuille_euros_feuilles.png'),
  crayon:       require('../../../assets/ui-kit/recap/autre_main_crayon.png'),
  klop:         require('../../../assets/ui-kit/recap/mascotte_entete.png'),
};
const AFFIRMATION_HERO =[V2.illusTentatives, V2.illusAutomatisme, V2.illusChemins];
const DEVISE_ICONS = { EUR: V2.devEur, CHF: V2.devChf, GBP: V2.devGbp };
const MOTIV_ICONS_V2 = {
  health: V2.motivHealth, family: V2.motivFriends, appearance: V2.motivSpark,
  money: V2.motivWallet, breathing: V2.motivBreath, fitness: V2.motivTrend,
};

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
export default function OnboardingFlow({ navigation, route }) {
  const previewMode = __DEV__ && route?.params?.previewMode === true;
  const { t, i18n } = useTranslation('onboardingFlow');
  const { profile, updateProfile } = useUser();
  const [fontsLoaded] = useFonts({
    'DejaVuSans': require('../../../assets/onboarding/fonts/DejaVuSans.ttf'),
    'DejaVuSans-Bold': require('../../../assets/onboarding/fonts/DejaVuSans-Bold.ttf'),
  });

  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showPersonalReason, setShowPersonalReason] = useState(false);
  const [artworkReady, setArtworkReady] = useState(Platform.OS !== 'web');
  const savingRef = useRef(false);

  // Sur le Web, attendre le décodage des grandes scènes avant d'afficher
  // l'étape : les anciennes captures montraient des panneaux totalement vides.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let active = true;
    const pictures = [...AFFIRMATION_HERO, PLAN_HD.hero, V2.illusDeclencheurs, V2.actionOui, V2.actionNon];
    // react-native-web n'expose pas Image.resolveAssetSource : y appeler cette
    // méthode lève, artworkReady reste faux et l'écran ne s'affiche jamais.
    // Sur le Web, require() d'une image donne déjà l'URL (ou un objet { uri }).
    const uriOf = source =>
      typeof source === 'string' ? source : source?.uri ?? Image.resolveAssetSource?.(source)?.uri;
    Promise.allSettled(pictures.map(uriOf).filter(Boolean).map(uri => Image.prefetch(uri)))
      .then(() => { if (active) setArtworkReady(true); })
      .catch(() => { if (active) setArtworkReady(true); });
    return () => { active = false; };
  }, []);

  // ── Reprise : brouillon local puis données déjà en base ────────────────────
  useEffect(() => {
    if (previewMode) {
      setDraftLoaded(true);
      return;
    }
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
  }, [previewMode]);

  // Sauvegarde du brouillon à chaque changement (reprise en cas de fermeture)
  useEffect(() => {
    if (!draftLoaded || previewMode) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ step, answers })).catch(() => {});
  }, [step, answers, draftLoaded, previewMode]);

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
    'devise',                          // 13
    'prix',                            // 14
    'dateDebut',                       // 15
    'objectifQuotidien',               // 16 (si réduction)
    'motivations',                     // 17
    'niveauMotivation',                // 18
    'chargement',                      // 19 (« Création de ton plan… », avance seul)
    'synthese',                        // 20
  ];
  const pages = answers.typeObjectif === 'stop'
    ? PAGES.filter(p => p !== 'objectifQuotidien')
    : PAGES;
  const page = pages[Math.min(step, pages.length - 1)];

  function next() {
    jouerSon('onboarding_step');
    setStep(s => Math.min(s + 1, pages.length - 1));
  }
  function back() {
    if (previewMode && step === 0) {
      navigation.goBack();
      return;
    }
    // Depuis le résumé, on revient à la motivation sans rejouer le chargement.
    const skip = page === 'synthese' ? 2 : 1;
    setStep(s => Math.max(0, s - skip));
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
    if (previewMode) {
      navigation.goBack();
      return;
    }
    if (savingRef.current) return; // anti double-soumission
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await updateProfile(buildOnboardingProfile(answers, profile));
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

  if (!draftLoaded || !fontsLoaded || !artworkReady) {
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
      <View style={st.affirmationLayout}>
        <Text style={st.title}>{t('affirmations.title')}</Text>
        <View style={st.affirmationCard}>
          <Text style={st.affirmationText}>
            {t('affirmations.quoted', { text: affirmationItems[idx] })}
          </Text>
        </View>
        {/* Les panneaux de l'illustration 04 sont vides : leurs libellés sont
            natifs (positions reprises de page-redesignee.svg). */}
        <View style={st.illusBoxRatio}>
          <Image source={AFFIRMATION_HERO[idx]} style={st.illusImg} resizeMode="contain" fadeDuration={0} />
          {idx === 2 && (
            <>
              <Text style={[st.cheminLabel, { left: '17%', width: '15%', top: '27.5%', color: colors.primaryDeep }]}>
                {t('affirmations.pathReduce')}
              </Text>
              <Text style={[st.cheminLabel, { left: '68%', width: '16%', top: '27.5%', color: '#A9653C' }]}>
                {t('affirmations.pathStop')}
              </Text>
            </>
          )}
        </View>
        <Text style={st.footerNote}>{t('affirmations.footer')}</Text>
        <View style={st.ouiNonRow}>
          <TouchableOpacity
            style={[st.ouiNonBtn, st.ouiNonBtnNonBase, answers.identification[idx] === false && st.ouiNonBtnNon]}
            onPress={() => {
              const id = [...answers.identification]; id[idx] = false;
              set('identification', id); next();
            }}
          >
            <Image source={V2.actionNon} style={st.ouiNonImg} resizeMode="contain" />
            <Text style={st.ouiNonLabel}>{t('common:no')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.ouiNonBtn, st.ouiNonBtnOuiBase, answers.identification[idx] === true && st.ouiNonBtnOui]}
            onPress={() => {
              const id = [...answers.identification]; id[idx] = true;
              set('identification', id); next();
            }}
          >
            <Image source={V2.actionOui} style={st.ouiNonImg} resizeMode="contain" />
            <Text style={st.ouiNonLabel}>{t('common:yes')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
    cta = null; // les boutons Oui/Non font avancer
  }

  else if (page === 'deculpabilisation') {
    body = (
      <>
        <Text style={st.deculpTitle}>{t('deculpabilisation.title')}</Text>
        <Text style={st.deculpSubtitle}>
          {t('deculpabilisation.subtitle')}
        </Text>
      {/* Proposition C : mêmes tracés, proportions et épaisseurs que la maquette. */}
        <View style={st.deculpGraph}>
          <View style={st.deculpLegend}>
            <View style={st.deculpLegendItem}>
              <View style={[st.deculpDot, { backgroundColor: '#ED594C' }]} />
              <Text style={[st.deculpLegendText, { color: '#A33830' }]}>{t('deculpabilisation.withoutSupport')}</Text>
            </View>
            <View style={st.deculpLegendItem}>
              <View style={[st.deculpDot, { backgroundColor: '#079B58' }]} />
              <Text style={[st.deculpLegendText, { color: '#087246' }]}>{t('deculpabilisation.withStopklop')}</Text>
            </View>
          </View>
          <Svg width="100%" height={210} viewBox="0 0 240 170" style={st.deculpChart} accessibilityLabel={`${t('deculpabilisation.withoutSupport')} / ${t('deculpabilisation.withStopklop')}`}>
            <Path d="M8 25H232 M8 65H232 M8 105H232 M8 145H232" stroke="#E5EDE8" strokeWidth={1.1} />
            <Path d="M8 83 L32 33 L57 61 L78 29 L104 112 L128 81 L153 82 L176 32 L204 48 L219 108 L232 88" fill="none" stroke="#ED594C" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M8 123 L35 126 L59 136 L83 140 L108 151 L128 133 L155 140 L178 153 L207 158 L232 142" fill="none" stroke="#079B58" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={st.deculpCallout}>
          <View style={st.deculpCalloutBadge}>
          <Text style={st.deculpCalloutSymbol}>✦</Text>
          </View>
          <Text style={st.deculpCalloutText}>{t('deculpabilisation.note')}</Text>
        </View>
      </>
    );
  }

  else if (page === 'solution') {
    body = (
      <View style={st.planLayout}>
        <Text style={st.planTitle}>{t('solution.title')}</Text>
        <Image source={PLAN_HD.hero} style={st.planHero} resizeMode="contain" fadeDuration={0} />
        <Text style={st.planCopy}>{t('solution.subtitle')}</Text>
        <View style={st.solutionChipsRow}>
          <View style={st.solutionChip}>
            <Image source={PLAN_HD.consumption} style={st.solutionChipIcon} resizeMode="contain" />
            <Text style={st.solutionChipText}>{t('solution.chips.consumption')}</Text>
          </View>
          <View style={st.solutionChip}>
            <Image source={PLAN_HD.habits} style={st.solutionChipIcon} resizeMode="contain" />
            <Text style={st.solutionChipText}>{t('solution.chips.habits')}</Text>
          </View>
          <View style={st.solutionChip}>
            <Image source={PLAN_HD.goal} style={st.solutionChipIcon} resizeMode="contain" />
            <Text style={st.solutionChipText}>{t('solution.chips.goal')}</Text>
          </View>
        </View>
      </View>
    );
  }

  else if (page.startsWith('benefice')) {
    const beneficeIdx = Number(page.slice(-1));
    const b = t(`benefits.items.${beneficeIdx}`, { returnObjects: true });
    body = (
      <>
        <Text style={beneficeIdx <= 2 ? st.cigaretteChoixTitle : st.title}>
          {beneficeIdx === 0 ? t('benefits.journal.hdTitle') : beneficeIdx === 2 ? t('benefits.pace.hdTitle') : b.title}
        </Text>
        <Text style={beneficeIdx <= 2 ? st.cigaretteChoixSubtitle : st.subtitle}>
          {beneficeIdx === 0 ? t('benefits.journal.hdSubtitle') : beneficeIdx === 1 ? t('benefits.triggers.hdSubtitle') : beneficeIdx === 2 ? t('benefits.pace.hdSubtitle') : b.text}
        </Text>

        {/* 07 — journal d'exemple + habitude repérée */}
        {beneficeIdx === 0 && (
          <>
            <Image source={CIGARETTE_CHOIX_HD.hero} style={st.cigaretteChoixHero} resizeMode="contain" fadeDuration={0} />
            <View style={st.cigaretteChoixInsight}>
              <Image source={CIGARETTE_CHOIX_HD.insight} style={st.cigaretteChoixInsightIcon} resizeMode="contain" />
              <View style={st.cigaretteChoixInsightCopy}>
                <Text style={st.cigaretteChoixInsightTitle}>{t('benefits.journal.hdInsightTitle')}</Text>
                <Text style={st.cigaretteChoixInsightText}>{t('benefits.journal.hdInsightText')}</Text>
              </View>
            </View>
          </>
        )}

        {/* 08 — illustration dégagée + contextes dans une carte native */}
        {beneficeIdx === 1 && (
          <>
            <View style={st.declencheursHeroBox}>
              <Image source={DECLENCHEURS_HD.hero} style={st.declencheursHeroImage} resizeMode="contain" fadeDuration={0} />
            </View>
            <View style={st.declencheursContextCard}>
              <Text style={st.declencheursContextTitle}>{t('benefits.triggers.footer')}</Text>
              <View style={st.declencheursContextRow}>
                {[
                  ['coffee', 'coffee'], ['stress', 'stress'], ['alcohol', 'alcohol'],
                  ['pause', 'pause'], ['friends', 'friends'],
                ].map(([asset, label]) => (
                  <View key={asset} style={st.declencheursContextItem}>
                    <Image source={DECLENCHEURS_HD[asset]} style={st.declencheursContextIcon} resizeMode="contain" />
                    <Text style={st.declencheursContextLabel}>{t(`benefits.triggers.${label}`)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* 09 — parcours illustré, fidèle à la référence */}
        {beneficeIdx === 2 && (
          <>
            <View style={st.reductionJourney}>
              <Image source={REDUCTION_RYTHME_HD.journey} style={st.reductionJourneyImage} resizeMode="stretch" />
              <View style={st.reductionSteps} pointerEvents="none">
                {PALIERS_V2.map((v, i) => (
                  <View key={v} style={[st.reductionStep, st.reductionStepPositions[i]]}>
                    <Text style={st.reductionStepNumber}>{v}</Text>
                    <Text style={st.reductionStepLabel}>{t('benefits.pace.hdUnit')}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={st.goalOfDayCard}>
              <Image source={REDUCTION_RYTHME_HD.goal} style={st.goalOfDayIcon} resizeMode="contain" />
              <View style={st.goalOfDayCopy}>
                <Text style={st.goalOfDayTitle}>{t('benefits.pace.goalTitle')}</Text>
                <Text style={st.goalOfDayValue}>{t('benefits.pace.goalValue')}</Text>
              </View>
              <View style={st.goalOfDayDots}>
                {[0,1,2,3,4,5,6].map(i => <View key={i} style={[st.goalOfDayDot, i > 4 && st.goalOfDayDotMuted]} />)}
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
              <Image source={V2.courbeEvolution} style={st.chartAsset} resizeMode="contain" />
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
        <Text style={st.goalTypeTitle}>{t('goalType.title')}</Text>
        <Text style={st.goalTypeSubtitle}>{t('goalType.subtitle')}</Text>
        {[
          { key: 'reduce', img: OBJECTIF_HD.reduce, titre: t('goalType.options.reduce.title') },
          { key: 'stop',   img: OBJECTIF_HD.stop,   titre: t('goalType.options.stop.title') },
        ].map(o => (
          <TouchableOpacity
            key={o.key}
            style={[st.objectifHdCard, o.key === 'stop' && st.objectifHdCardStop, answers.typeObjectif === o.key && st.objectifCardActive]}
            onPress={() => set('typeObjectif', o.key)}
          >
            <View style={st.objectifHdCopy}>
              <Text style={[st.objectifHdTitle, o.key === 'stop' && st.objectifHdTitleStop]}>{o.titre}</Text>
            </View>
            <Image source={o.img} style={st.objectifHdImage} resizeMode="contain" />
            {answers.typeObjectif === o.key && (
              <View style={[st.checkBadge, st.objectifHdBadge]}><Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text></View>
            )}
          </TouchableOpacity>
        ))}
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
          <TouchableOpacity style={st.personalReasonHeader} onPress={() => setShowPersonalReason(v => !v)} accessibilityRole="button">
            <Image source={V2.motivPerso} style={{ width: 28, height: 28 }} resizeMode="contain" />
            <Text style={st.motivPersoTitre}>{t('motivations.personalTitle')}</Text>
          </TouchableOpacity>
          {(showPersonalReason || !!answers.motivationPerso) && (
            <TextInput
              style={st.motivPersoInput}
              value={answers.motivationPerso}
              onChangeText={v => set('motivationPerso', v)}
              placeholder={t('motivations.personalPlaceholder')}
              placeholderTextColor="#B0B0B0"
              maxLength={120}
              accessibilityLabel={t('motivations.personalA11y')}
            />
          )}
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

  else if (page === 'chargement') {
    body = <PlanLoading onDone={next} />;
    cta = null;
  }

  else if (page === 'synthese') {
    const motivLabels = answers.motivations
      .filter(k => MOTIVATIONS_CHOIX.some(m => m.key === k))
      .map(k => t(`motivations.options.${k}`));
    const pourquoi = motivLabels.map(l => l.charAt(0).toLowerCase() + l.slice(1));
    const pourquoiTexte = pourquoi.length > 1
      ? `Pour ${pourquoi.slice(0, -1).join(', ')} et ${pourquoi[pourquoi.length - 1]}`
      : pourquoi.length === 1 ? `Pour ${pourquoi[0]}` : null;
    const arret = answers.typeObjectif === 'stop';
    const prixTexte = isNaN(prixNum) ? '—' : prixNum.toFixed(2).replace('.', ',');
    const dateTexte = new Date(answers.dateDebut + 'T12:00:00')
      .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const coutJour = (consoNormalisee * prixCig).toFixed(2).replace('.', ',');
    const enMoins = Math.max(0, consoNormalisee - objectifFinal);
    const baissePct = consoNormalisee > 0 ? Math.round((enMoins / consoNormalisee) * 100) : 0;
    const eviteesAn = Math.round(enMoins * 365).toLocaleString('fr-FR');
    const etapes = [
      { img: RECAP.paquet, quand: 'Aujourd’hui', titre: `${consoNormalisee} cigarettes par jour`,
        detail: `Paquet à ${prixTexte} ${symboleDevise} (${answers.cigarettesParPaquet} cigarettes), soit environ ${coutJour} ${symboleDevise} par jour.` },
      { img: RECAP.calendrier, quand: dateTexte, titre: 'Début du plan',
        detail: `Chaque jour, tu notes simplement ce que tu fumes. Motivation de départ : ${answers.niveauMotivation} / 10.` },
      { img: RECAP.escalier, quand: 'Semaine après semaine', titre: 'Tu avances à ton rythme',
        detail: 'Pas de pression : un écart ne casse rien, on repart le lendemain.', raison: pourquoiTexte },
      { img: arret ? RECAP.cible : RECAP.limite, quand: 'Objectif',
        titre: arret ? 'Zéro cigarette' : `${objectifFinal} cigarettes par jour maximum`,
        detail: arret
          ? 'Arrêter complètement, en avançant étape par étape vers une vie sans cigarette.'
          : `Soit ${enMoins} cigarette${enMoins > 1 ? 's' : ''} de moins chaque jour (−${baissePct} %).` },
      { img: RECAP.portefeuille, quand: 'À la clé',
        titre: `≈ ${Math.round(ecoEstimeeAn).toLocaleString('fr-FR')} ${symboleDevise} par an`,
        detail: `Soit ≈ ${ecoEstimeeMois.toFixed(0)} ${symboleDevise} chaque mois et ${eviteesAn} cigarettes évitées sur un an.` },
    ];
    body = (
      <>
        <Text style={[st.title, st.recapTitle]}>{'Ton chemin,\nétape par étape'}</Text>
        <Text style={[st.subtitle, st.recapIntro]}>
          Voici le plan préparé à partir de tes réponses. Tu pourras l’ajuster à tout moment.
        </Text>
        <View style={st.recapFrise}>
          {etapes.map((e, i) => (
            <View key={i} style={st.recapEtape}>
              <View style={st.recapRail}>
                <View style={st.recapBulle}>
                  <Image source={e.img} style={st.recapIcone} resizeMode="contain" />
                </View>
                {i < etapes.length - 1 && (
                  <View style={st.recapTrait}>
                    {[0, 1, 2, 3].map(d => <View key={d} style={st.recapPoint} />)}
                  </View>
                )}
              </View>
              <View style={st.recapTexte}>
                <Text style={st.recapQuand}>{e.quand}</Text>
                <Text style={st.recapTitre}>{e.titre}</Text>
                {e.detail ? <Text style={st.recapDetail}>{e.detail}</Text> : null}
                {e.raison ? <Text style={st.recapRaison}>{e.raison}</Text> : null}
              </View>
            </View>
          ))}
        </View>
        {answers.motivationPerso.trim() !== '' && (
          <View style={st.recapMot}>
            <Image source={RECAP.crayon} style={st.recapMotIcone} resizeMode="contain" />
            <Text style={st.recapMotTexte}>« {answers.motivationPerso.trim()} »</Text>
          </View>
        )}
        <View style={st.recapKlop}>
          <Image source={RECAP.klop} style={st.recapKlopImg} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={st.recapKlopTitre}>Klop t’accompagne chaque jour</Text>
            <Text style={st.recapKlopTexte}>Rappels, statistiques et encouragements : tout est prêt dans l’app.</Text>
          </View>
        </View>
        {saveError && <Text style={st.errorHint}>{saveError}</Text>}
      </>
    );
    cta   = saving ? null : previewMode ? 'Terminer l’aperçu' : 'Commencer';
    onCta = handleFinish;
  }

  return (
    <SafeAreaView style={st.safe}>
      {/* En-tête de la maquette finale : retour et marque centrée. */}
      <View style={st.header}>
        <TouchableOpacity onPress={back} style={st.backBtn} accessibilityLabel="Retour">
          {page === 'solution'
            ? <Image source={PLAN_HD.back} style={st.planBackIcon} resizeMode="contain" />
            : <Text style={{ fontSize: 28, color: DESIGN.ink }}>‹</Text>}
        </TouchableOpacity>
        <Text style={st.brand}>STOPKLOP</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={[st.content, page.startsWith('affirmation') && st.affirmationContent, page === 'solution' && st.planContent]} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>

        {cta && (
          <View style={[st.bottom, page === 'solution' && st.planBottom]}>
            <TouchableOpacity style={[st.designCta, page === 'solution' && st.planCta, !isValid() && st.designCtaDisabled]} onPress={onCta} disabled={!isValid()} accessibilityRole="button">
              <Text style={st.designCtaText}>{cta}</Text>
            </TouchableOpacity>
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

function TriggerItem({ trigger, label }) {
  return (
    <View style={st.triggerItem}>
      <Image source={trigger.img} style={st.triggerIcon} resizeMode="contain" />
      <Text style={st.triggerLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  // Maquette : bouton retour à y=43 (28 × 28), marque centrée à y=49.
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 28, paddingBottom: 8, minHeight: 62,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: DESIGN.mint, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 11, fontWeight: '700', color: DESIGN.green, letterSpacing: 0.5 },
  planBackIcon: { width: 28, height: 28 },

  content: { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  planContent: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 20 },
  planLayout: { width: '100%', alignItems: 'center' },
  planTitle: { alignSelf: 'stretch', color: DESIGN.ink, fontSize: 27, lineHeight: 33, fontWeight: '700', textAlign: 'left' },
  planHero: { width: '86%', maxWidth: 320, aspectRatio: 380 / 448, marginTop: 10 },
  planCopy: { marginTop: 2, color: DESIGN.ink, fontSize: 15, lineHeight: 22, fontWeight: '500', textAlign: 'center' },
  planBottom: { paddingHorizontal: 22, paddingBottom: 18 },
  planCta: { borderRadius: 18, backgroundColor: '#00884A' },
  // Le titre doit tomber à y=105 : en-tête (≈80 avec son paddingTop) + celui-ci.
  affirmationContent: { flexGrow: 1, paddingTop: 25 },
  bottom:  { width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18, backgroundColor: colors.white },
  designCta: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: DESIGN.green },
  designCtaDisabled: { opacity: 0.45 },
  designCtaText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  title:    { fontSize: 27, fontWeight: '700', color: DESIGN.ink, textAlign: 'left', lineHeight: 34, marginBottom: 34 },
  // Titre nettement plus long que les autres : réduit pour tenir en 3 lignes.
  titleLong: { fontSize: 23, lineHeight: 30 },
  subtitle: { fontSize: 15, color: DESIGN.muted, textAlign: 'left', lineHeight: 22, marginBottom: 28 },
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
  // Rythme vertical repris de page-redesignee.svg (canevas 390 × 844) :
  // titre y=105, texte y=222, illustration y=328, note y=628, cartes y=691.
  affirmationLayout: { flexGrow: 1 },
  // Citation dans une carte menthe, comme avant le passage au pack V2.
  affirmationCard: {
    backgroundColor: DESIGN.mint, borderRadius: 18,
    paddingVertical: 18, paddingHorizontal: 20,
    marginTop: 15, marginBottom: 40,
  },
  affirmationText: {
    fontSize: 15, color: DESIGN.ink, lineHeight: 24,
    textAlign: 'center', fontStyle: 'italic',
  },
  ouiNonRow: { flexDirection: 'row', gap: 12, marginTop: 45, marginBottom: 4 },
  ouiNonBtn: {
    flex: 1, borderWidth: 1, borderColor: DESIGN.border, borderRadius: 18,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 104,
  },
  // Bordures teintées comme la maquette : rouge pâle côté Non, vert pâle côté Oui.
  ouiNonBtnNonBase: { borderColor: '#FFD9D5' },
  ouiNonBtnOuiBase: { borderColor: '#CDEBDA' },
  ouiNonBtnOui: { borderColor: DESIGN.green, backgroundColor: '#F6FAF7' },
  ouiNonBtnNon: { borderColor: '#FF4B3E', backgroundColor: '#FFF6F5' },
  ouiNonImg:   { width: 52, height: 52 },
  ouiNonLabel: { fontSize: 17, fontWeight: '700', color: DESIGN.ink },

  // Déculpabilisation
  deculpTitle: { fontSize: 23, lineHeight: 30, fontWeight: '500', color: DESIGN.ink, marginTop: 12 },
  deculpSubtitle: { fontSize: 14, lineHeight: 21, color: DESIGN.muted, marginTop: 20 },
  deculpGraph: { marginTop: 28, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: '#DCEBE2', borderRadius: 22 },
  deculpChart: { marginTop: 10 },
  deculpLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  deculpLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deculpDot: { width: 9, height: 9, borderRadius: 5 },
  deculpLegendText: { fontSize: 11, fontWeight: '500' },
  deculpCallout: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, padding: 16, borderLeftWidth: 4, borderLeftColor: '#079B58', borderTopRightRadius: 16, borderBottomRightRadius: 16, backgroundColor: '#F4FBF6' },
  deculpCalloutBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D8F1E1', alignItems: 'center', justifyContent: 'center' },
  deculpCalloutSymbol: { fontSize: 26, color: '#00884A', lineHeight: 32 },
  deculpCalloutText: { flex: 1, color: DESIGN.ink, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  chartCard: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: 14, marginVertical: 12, backgroundColor: colors.white,
  },
  chartAsset: { width: '100%', aspectRatio: 920 / 550, marginTop: 8 },
  chartCardTitre: { fontSize: font.md, fontWeight: '700', color: DESIGN.ink },
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
  solutionChipsRow: { width: '100%', flexDirection: 'row', gap: 6, marginTop: 16 },
  solutionChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: '#FFFFFF', borderRadius: 24,
    borderWidth: 1, borderColor: '#E6EEE9',
    minHeight: 40, paddingVertical: 5, paddingHorizontal: 3,
  },
  solutionChipIcon: { width: 24, height: 24 },
  solutionChipText: { fontSize: 10, fontWeight: '700', color: DESIGN.ink, textAlign: 'center', flexShrink: 1 },

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
    minHeight: 90, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: DESIGN.border, borderRadius: radius.xl,
    backgroundColor: '#FBFEFC',
  },
  statBadge:    { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  statBadgeImg: { width: 32, height: 32 },
  statValeur:   { fontSize: 16, fontWeight: '800', color: colors.primaryDeep, lineHeight: 21 },
  statLabel:    { fontSize: 11, color: colors.gray, marginTop: 2, lineHeight: 15 },

  footerNote: { fontSize: 14, color: DESIGN.muted, textAlign: 'center', marginTop: 56, marginBottom: 0 },
  // Illustration 366 × 244 : la maquette la pose à x=12, soit 12 pt au-delà
  // de la marge de contenu (24) de chaque côté.
  illusBoxRatio: {
    alignSelf: 'stretch', marginHorizontal: -12, aspectRatio: 366 / 244,
    borderRadius: radius.xl, overflow: 'hidden', marginVertical: 0,
    backgroundColor: colors.white,
  },
  cheminLabel: { position: 'absolute', fontSize: 11, lineHeight: 16, fontWeight: '700', textAlign: 'center' },

  // Écran 07 — journal d'exemple
  cigaretteChoixTitle: { color: DESIGN.ink, fontSize: 25, lineHeight: 32, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  cigaretteChoixSubtitle: { color: DESIGN.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 16 },
  cigaretteChoixHero: { width: '100%', maxWidth: 350, aspectRatio: 350 / 368, alignSelf: 'center', marginTop: 12 },
  cigaretteChoixInsight: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, padding: 14, borderWidth: 1, borderColor: DESIGN.border, borderRadius: 20, backgroundColor: colors.white },
  cigaretteChoixInsightIcon: { width: 52, height: 52 },
  cigaretteChoixInsightCopy: { flex: 1 },
  cigaretteChoixInsightTitle: { color: DESIGN.ink, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  cigaretteChoixInsightText: { color: DESIGN.muted, fontSize: 13, lineHeight: 19, marginTop: 3 },
  declencheursHeroBox: { width: '100%', maxWidth: 314, aspectRatio: 350 / 356, alignSelf: 'center', marginTop: 10 },
  declencheursHeroImage: { width: '100%', height: '100%' },
  declencheursContextCard: { marginTop: 4, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: DESIGN.border, borderRadius: 22, backgroundColor: '#F5FBF7' },
  declencheursContextTitle: { color: DESIGN.ink, fontSize: 14, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  declencheursContextRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  declencheursContextItem: { alignItems: 'center', width: '19%' },
  declencheursContextIcon: { width: 36, height: 36 },
  declencheursContextLabel: { color: DESIGN.ink, fontSize: 10, lineHeight: 13, fontWeight: '600', textAlign: 'center', marginTop: 3 },
  reductionJourney: { width: '100%', maxWidth: 394, height: 372, alignSelf: 'center', marginTop: 12, position: 'relative', overflow: 'hidden' },
  reductionJourneyImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: 512 },
  reductionSteps: { position: 'absolute', inset: 0 },
  reductionStep: { position: 'absolute', width: '22%', height: 76, paddingHorizontal: 9, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#D7E8D7', backgroundColor: '#F9FFF9', alignItems: 'center', justifyContent: 'center' },
  reductionStepPositions: [
    { left: '12%', top: 284 },
    { left: '29%', top: 208 },
    { left: '48%', top: 128 },
    { left: '67%', top: 50 },
  ],
  reductionStepNumber: { color: DESIGN.ink, fontSize: 21, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  reductionStepLabel: { color: DESIGN.ink, fontSize: 8, lineHeight: 10, fontWeight: '600', textAlign: 'center', marginTop: 5 },
  goalOfDayCard: { position: 'relative', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 14, padding: 16, borderWidth: 1, borderColor: DESIGN.border, borderRadius: 20, backgroundColor: colors.white },
  goalOfDayIcon: { width: 52, height: 52 },
  goalOfDayCopy: { flex: 1 },
  goalOfDayTitle: { color: DESIGN.ink, fontSize: 17, lineHeight: 21, fontWeight: '700' },
  goalOfDayValue: { color: DESIGN.ink, fontSize: 18, lineHeight: 23, fontWeight: '700' },
  goalOfDayDots: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 3, marginTop: 3 },
  goalOfDayDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0AA85B', borderWidth: 3, borderColor: '#E4F5EB' },
  goalOfDayDotMuted: { backgroundColor: '#D7E0DB', borderColor: '#F0F4F1' },
  journalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  journalTitre:  { fontSize: font.md, fontWeight: '800', color: colors.primaryDeep },
  journalIcon:   { width: 22, height: 22 },
  tagPill:     { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingVertical: 3, paddingHorizontal: 10 },
  tagPillText: { fontSize: 10, fontWeight: '700', color: colors.primaryDeep },

  // Écran 08 — contextes déclencheurs
  trigGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  triggerComposition: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, minHeight: 260 },
  triggerSide: { width: 76, justifyContent: 'space-around', alignItems: 'center', minHeight: 250 },
  triggerHero: { flex: 1, height: 240, maxWidth: 210 },
  triggerBottom: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 6 },
  triggerItem: { alignItems: 'center', gap: 4, minWidth: 70 },
  triggerIcon: { width: 52, height: 52 },
  triggerLabel: { color: DESIGN.ink, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  trigChip: {
    width: '31.5%', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  trigChipIcon: { width: 30, height: 30 },
  trigChipText: { fontSize: 11, fontWeight: '600', color: colors.black },

  // Écran 09 — paliers chiffrés
  paliersRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginVertical: spacing.md, minHeight: 116 },
  paliersFleche: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  palierCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 76,
    borderRadius: radius.lg, backgroundColor: '#E3FAF0',
  },
  palierCardFinal: { backgroundColor: DESIGN.green },
  palierNum:  { fontSize: 24, fontWeight: '700', color: DESIGN.ink, lineHeight: 28 },
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
    borderWidth: 1.5, borderColor: DESIGN.border, borderRadius: radius.xl,
    paddingHorizontal: spacing.md, marginBottom: 20, minHeight: 142, backgroundColor: '#FBFEFC',
  },
  objectifCardStop: { backgroundColor: '#FBF8FF', borderColor: '#E5DCF1' },
  objectifCardActive: { borderColor: DESIGN.green, borderWidth: 2 },
  objectifImg: { width: 78, height: 78 },
  goalTypeTitle: { color: DESIGN.ink, fontSize: 27, lineHeight: 34, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  goalTypeSubtitle: { color: DESIGN.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 17, marginBottom: 30, paddingHorizontal: 16 },
  objectifHdCard: { minHeight: 124, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: '#D5EBDC', borderRadius: 22, marginBottom: 20, backgroundColor: '#F1FBF4' },
  objectifHdCardStop: { backgroundColor: '#FBF8FF', borderColor: '#E7DEF4' },
  objectifHdCopy: { flex: 1, paddingLeft: 20, paddingRight: 6 },
  // « progressivement » est le mot le plus long : il doit tenir avec de la
  // marge, sinon il se coupe dès que la bordure de sélection (2 pt) mange un
  // pixel. 18 pt + illustration 106 pt laissent ~20 pt de jeu.
  objectifHdTitle: { color: '#0A9C56', fontSize: 18, lineHeight: 24, fontWeight: '700' },
  objectifHdTitleStop: { color: '#7047B5' },
  objectifHdImage: { width: 106, height: 88, marginRight: 14 },
  // Coche posée dans le coin : dans la rangée, elle recomprimait la colonne
  // de texte et recoupait « progressivement » au milieu du mot.
  objectifHdBadge: { position: 'absolute', top: 10, right: 10 },
  choixTitre: { fontSize: font.md, fontWeight: '700', color: colors.black },
  choixDesc:  { fontSize: 12, color: colors.gray, marginTop: 2 },
  choixImg:   { width: 52, height: 52, borderRadius: 26 },
  motivImg:   { width: 48, height: 48 },
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
  motivGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  motivChip: {
    width: '48%', minHeight: 106,
    borderWidth: 1, borderColor: DESIGN.border, borderRadius: 17,
    paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F6FAF7',
  },
  motivChipActive: { borderColor: DESIGN.green, backgroundColor: '#E3FAF0' },
  motivLabel: { fontSize: 14, fontWeight: '700', color: DESIGN.ink, textAlign: 'center' },
  motivPersoCard: {
    borderWidth: 1, borderColor: DESIGN.border, borderRadius: 17,
    padding: 12, marginTop: 26,
  },
  personalReasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 36 },
  motivPersoTitre: { fontSize: font.sm, color: DESIGN.muted },
  motivPersoInput: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.md,
    padding: spacing.sm, fontSize: font.sm, color: colors.black, minHeight: 44,
  },

  // Niveau motivation
  nivCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 5, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  nivNum: { fontSize: 48, fontWeight: '900', color: colors.primary, lineHeight: 52 },
  nivDots: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm, marginTop: spacing.md },
  nivDot:  { width: 22, height: 22, borderRadius: 11 },
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

  // Synthèse : frise « Ton chemin, étape par étape »
  recapTitle: { marginBottom: 10 },
  recapIntro: { marginBottom: 24 },
  recapFrise: { gap: 0 },
  recapEtape: { flexDirection: 'row', gap: 14 },
  recapRail: { width: 52, alignItems: 'center' },
  recapBulle: { width: 52, height: 52, borderRadius: 26, backgroundColor: DESIGN.mint, alignItems: 'center', justifyContent: 'center' },
  recapIcone: { width: 32, height: 32 },
  // Pointillés qui relient les étapes (points dessinés : un bord « dashed »
  // sur un seul côté ne s'affiche pas sur iOS).
  recapTrait: { flex: 1, minHeight: 16, paddingVertical: 5, justifyContent: 'space-evenly', alignItems: 'center' },
  recapPoint: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#A9D6BA' },
  recapTexte: { flex: 1, paddingTop: 3, paddingBottom: 20 },
  recapQuand: { fontSize: 12, fontWeight: '700', color: DESIGN.green },
  recapTitre: { fontSize: 16, fontWeight: '700', color: DESIGN.ink, lineHeight: 21, marginTop: 2 },
  recapDetail: { fontSize: 13, color: DESIGN.muted, lineHeight: 19, marginTop: 3 },
  recapRaison: { fontSize: 13, fontWeight: '700', color: DESIGN.ink, lineHeight: 19, marginTop: 4 },
  recapKlop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: DESIGN.mint },
  recapKlopImg: { width: 50, height: 54 },
  recapKlopTitre: { fontSize: 14, fontWeight: '700', color: DESIGN.ink },
  recapKlopTexte: { fontSize: 12.5, color: DESIGN.muted, lineHeight: 18, marginTop: 2 },
  recapMot: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF8E8', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  recapMotIcone: { width: 34, height: 34 },
  recapMotTexte: { flex: 1, fontSize: 14, fontStyle: 'italic', color: '#5B4A22', lineHeight: 20 },
});
