import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
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

// Illustrations HD (pack stopklop-illustrations-hd, sans texte incrusté)
const ILLUS = {
  bienvenue:         require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/01-decor-accueil-montgolfiere.jpg'),
  affirmation0:      require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/02-tentatives-precedentes.jpg'),
  affirmation1:      require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/03-cigarette-automatique.jpg'),
  affirmation2:      require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/04-choix-parcours.jpg'),
  deculpabilisation: require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/05-comparaison-accompagnement.jpg'),
  solution:          require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/06-plan-adapte.jpg'),
  benefice0:         require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/07-enregistrement-cigarettes.jpg'),
  benefice1:         require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/08-declencheurs.jpg'),
  benefice2:         require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/09-reduction-progressive.jpg'),
  benefice3:         require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/10-benefices-concrets.jpg'),
  objReduire:        require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/11-objectif-reduire.jpg'),
  objArreter:        require('../../../assets/onboarding/stopklop-illustrations-hd/illustrations/12-objectif-arreter.jpg'),
};
const PICTOS_PLAN = {
  objectif: require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/07-plan-objectif.jpg'),
  palier:   require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/08-plan-palier-protege.jpg'),
  economie: require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/09-plan-economies.jpg'),
};
const PICTOS_MOTIV = {
  health:     require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/01-motivation-sante.jpg'),
  family:     require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/02-motivation-famille.jpg'),
  appearance: require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/03-motivation-apparence.jpg'),
  money:      require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/04-motivation-economies.jpg'),
  breathing:  require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/05-motivation-souffle.jpg'),
  fitness:    require('../../../assets/onboarding/stopklop-illustrations-hd/pictogrammes/06-motivation-condition.jpg'),
};

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

// ── Graphique illustratif (page déculpabilisation) ───────────────────────────
function IllustrativeChart({ width = 260, height = 110 }) {
  // Purement illustratif — aucune statistique réelle.
  const bad  = 'M0,30 L40,45 L75,25 L115,55 L150,40 L195,70 L230,55 L260,75';
  const good = 'M0,30 C60,38 120,70 180,88 C210,96 240,100 260,102';
  return (
    <Svg width={width} height={height}>
      <Path d={bad}  stroke="#EF4444" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.8} />
      <Path d={good} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Circle cx={260} cy={75}  r={4} fill="#EF4444" />
      <Circle cx={260} cy={102} r={4} fill={colors.primary} />
    </Svg>
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
          if (typeof draft.step === 'number') setStep(Math.min(draft.step, 19));
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
  const PAGES = [
    'bienvenue',                       // 1
    'affirmation0', 'affirmation1', 'affirmation2', // 2-4
    'deculpabilisation',               // 5
    'solution',                        // 6
    'benefice0', 'benefice1', 'benefice2', 'benefice3', // 7-10
    'objectif',                        // 11
    'conso',                           // 12
    'paquet',                          // 13
    'prix',                            // 14
    'dateDebut',                       // 15
    'objectifQuotidien',               // 16 (si réduction)
    'devise',                          // 17
    'motivations',                     // 18
    'niveauMotivation',                // 19
    'synthese',                        // 20
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

  // ── Page 1 : Bienvenue (plein écran, sans header) ──────────────────────────
  if (page === 'bienvenue') {
    return (
      <SafeAreaView style={[st.safe, { backgroundColor: '#EAF4EC' }]}>
        <Image
          source={ILLUS.bienvenue}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: SCREEN_H * 0.68 }}
          resizeMode="cover"
        />
        <View style={[st.welcomeCard, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
          <Text style={st.welcomeTitle}>
            {t('welcome.titlePrefix')}{'\n'}<Text style={{ color: colors.primary }}>Stopklop</Text>
          </Text>
          <Text style={st.welcomeSub}>
            {t('welcome.subtitle')}
          </Text>
          <PrimaryButton title={t('welcome.startButton')} onPress={next} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <Text style={{ color: colors.gray, fontSize: font.md }}>{t('welcome.alreadyHaveAccount')}</Text>
          </TouchableOpacity>
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
        <View style={st.illusBox}>
          <Image source={ILLUS[page]} style={st.illusImg} resizeMode="contain" />
        </View>
        <View style={st.ouiNonRow}>
          <TouchableOpacity
            style={[st.ouiNonBtn, answers.identification[idx] === false && st.ouiNonBtnNon]}
            onPress={() => {
              const id = [...answers.identification]; id[idx] = false;
              set('identification', id); next();
            }}
          >
            <Text style={st.ouiNonIcon}>✕</Text>
            <Text style={st.ouiNonLabel}>{t('common:no')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.ouiNonBtn, answers.identification[idx] === true && st.ouiNonBtnOui]}
            onPress={() => {
              const id = [...answers.identification]; id[idx] = true;
              set('identification', id); next();
            }}
          >
            <Text style={[st.ouiNonIcon, { color: colors.primary }]}>✓</Text>
            <Text style={st.ouiNonLabel}>{t('common:yes')}</Text>
          </TouchableOpacity>
        </View>
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
        <View style={[st.illusBox, { height: 280 }]}>
          <Image source={ILLUS.deculpabilisation} style={st.illusImg} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginTop: 4 }}>
          <View style={st.chartLegRow}>
            <View style={[st.legDot, { backgroundColor: '#EF4444' }]} />
            <Text style={st.legText}>{t('deculpabilisation.withoutSupport')}</Text>
          </View>
          <View style={st.chartLegRow}>
            <View style={[st.legDot, { backgroundColor: colors.primary }]} />
            <Text style={st.legText}>{t('deculpabilisation.withStopklop')}</Text>
          </View>
        </View>
        <Text style={st.chartNote}>{t('deculpabilisation.note')}</Text>
      </>
    );
  }

  else if (page === 'solution') {
    body = (
      <>
        <Text style={st.title}>{t('solution.title')}</Text>
        <View style={[st.illusBox, { height: 260, marginBottom: spacing.lg }]}>
          <Image source={ILLUS.solution} style={st.illusImg} resizeMode="contain" />
        </View>
        <Text style={st.subtitle}>
          {t('solution.subtitle')}
        </Text>
      </>
    );
  }

  else if (page.startsWith('benefice')) {
    const beneficeIdx = Number(page.slice(-1));
    const b = t(`benefits.items.${beneficeIdx}`, { returnObjects: true });
    body = (
      <>
        <Text style={st.title}>{b.title}</Text>
        <Text style={st.subtitle}>{b.text}</Text>
        <View style={[st.illusBox, { height: 300 }]}>
          <Image source={ILLUS[page]} style={st.illusImg} resizeMode="contain" />
        </View>
      </>
    );
  }

  else if (page === 'objectif') {
    body = (
      <>
        <Text style={st.title}>{t('goalType.title')}</Text>
        <Text style={st.subtitle}>{t('goalType.subtitle')}</Text>
        {[
          { key: 'reduce', img: ILLUS.objReduire, titre: t('goalType.options.reduce.title'), desc: t('goalType.options.reduce.desc') },
          { key: 'stop',   img: ILLUS.objArreter, titre: t('goalType.options.stop.title'),    desc: t('goalType.options.stop.desc') },
        ].map(o => (
          <TouchableOpacity
            key={o.key}
            style={[st.choixCard, answers.typeObjectif === o.key && st.choixCardActive]}
            onPress={() => set('typeObjectif', o.key)}
          >
            <Image source={o.img} style={st.choixImg} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={st.choixTitre}>{o.titre}</Text>
              <Text style={st.choixDesc}>{o.desc}</Text>
            </View>
            {answers.typeObjectif === o.key && (
              <View style={st.checkBadge}><Text style={{ color: '#fff', fontWeight: '800' }}>✓</Text></View>
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
            <Text style={{ fontSize: 22, fontWeight: '800', width: 44, textAlign: 'center', color: colors.primary }}>{d.symbole}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.choixTitre}>{d.code}</Text>
              <Text style={st.choixDesc}>{t(`currency.options.${d.code}`)}</Text>
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
        <Text style={st.title}>Quelles sont vos{'\n'}principales motivations ?</Text>
        <Text style={st.subtitle}>Sélectionnez jusqu'à 3 motivations qui comptent le plus pour vous.</Text>
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
                <Image source={PICTOS_MOTIV[m.key]} style={st.motivImg} resizeMode="contain" />
                <Text style={[st.motivLabel, active && { color: colors.primary, fontWeight: '700' }]}>{t(`motivations.options.${m.key}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={st.motivPersoCard}>
          <Text style={st.motivPersoTitre}>✏️  Écrire ma propre motivation</Text>
          <TextInput
            style={st.motivPersoInput}
            value={answers.motivationPerso}
            onChangeText={v => set('motivationPerso', v)}
            placeholder="Votre motivation…"
            placeholderTextColor="#B0B0B0"
            maxLength={120}
            accessibilityLabel="Motivation personnalisée"
          />
        </View>
      </>
    );
  }

  else if (page === 'niveauMotivation') {
    const lvl = answers.niveauMotivation;
    body = (
      <>
        <Text style={st.title}>Quel est votre niveau{'\n'}de motivation ?</Text>
        <Text style={st.subtitle}>Soyez honnête avec vous-même.</Text>
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
              accessibilityLabel={`Niveau ${n}`}
            />
          ))}
        </View>
        <View style={st.nivLabels}>
          <Text style={st.hint}>Faible</Text>
          <Text style={st.hint}>Élevé</Text>
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
  ouiNonIcon:  { fontSize: 26, color: '#EF4444', fontWeight: '800' },
  ouiNonLabel: { fontSize: font.md, fontWeight: '700', color: colors.black },

  // Déculpabilisation
  chartCard: {
    borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md, marginTop: spacing.sm,
  },
  chartLegRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  legDot:  { width: 8, height: 8, borderRadius: 4 },
  legText: { fontSize: 12, color: colors.gray },
  chartNote: { fontSize: 10, color: colors.gray, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },

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

  // Stats exemple
  statExRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  statExVal: { fontSize: 20, fontWeight: '900', color: colors.primary, width: 90 },
  statExLbl: { flex: 1, fontSize: 12, color: colors.gray },

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
  motivGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  motivChip: {
    width: '48%', flexGrow: 1,
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.xl,
    padding: spacing.md, alignItems: 'center', gap: 6, minHeight: 84,
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
