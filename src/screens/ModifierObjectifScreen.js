import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

const OBJECTIFS = [
  {
    key: 'stop',
    titre: 'Arréter complètement',
    desc: '0 cigarette',
    icon: '🎯',
    iconBg: colors.primaryLight,
  },
  {
    key: 'reduce',
    titre: 'Réduire progressivement',
    desc: 'Diminuer étape par étape',
    icon: '📉',
    iconBg: '#FEF3C7',
  },
  {
    key: 'libre',
    titre: 'Objectif libre',
    desc: 'Choisir vous-même',
    icon: '✏️',
    iconBg: '#EDE9FE',
  },
];

export default function ModifierObjectifScreen({ navigation }) {
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
  const eco10   = Math.round(evitees10 * prixCig).toLocaleString('fr-FR');

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
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const paliers = Array.from({ length: Math.min(semainesTotal + 1, 6) },
    (_, i) => Math.max(0, quantite - rythme * i));

  async function handleEnregistrer() {
    const changes = {
      typeObjectif: selected,
      objectifCigarettes: selected === 'stop' ? 0 : quantite,
    };
    if (selected === 'reduce') {
      changes.reductionParSemaine = rythme;
      changes.planStartDate = new Date().toISOString(); // le plan (re)démarre aujourd'hui
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
        <Text style={styles.headerTitle}>Modifier mon objectif</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Choisir l'objectif ── */}
        <Text style={styles.sectionTitle}>Choisissez votre objectif</Text>
        <View style={styles.card}>
          {OBJECTIFS.map((obj, i) => (
            <TouchableOpacity
              key={obj.key}
              style={[
                styles.optionRow,
                i < OBJECTIFS.length - 1 && styles.optionRowBorder,
                selected === obj.key && styles.optionRowActive,
              ]}
              onPress={() => setSelected(obj.key)}
            >
              {/* Radio */}
              <View style={[styles.radio, selected === obj.key && styles.radioActive]}>
                {selected === obj.key && <View style={styles.radioDot} />}
              </View>

              {/* Texte */}
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitre}>{obj.titre}</Text>
                <Text style={styles.optionDesc}>{obj.desc}</Text>
              </View>

              {/* Icône */}
              <View style={[styles.iconCircle, { backgroundColor: obj.iconBg }]}>
                <Text style={{ fontSize: 18 }}>{obj.icon}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Objectif quotidien (masqué si arrêt complet) ── */}
        {selected !== 'stop' && (
          <>
            <Text style={styles.sectionTitle}>
              {selected === 'reduce' ? 'Point de départ (aujourd\'hui)' : 'Objectif quotidien'}
            </Text>
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
                  <Text style={styles.stepperUnit}>cigarettes / jour</Text>
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

        {/* ── Rythme de réduction (uniquement mode "réduire") ── */}
        {selected === 'reduce' && (
          <>
            <Text style={styles.sectionTitle}>Rythme de réduction</Text>
            <View style={styles.card}>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepperBtn, rythme <= 1 && styles.stepperBtnDisabled]}
                  onPress={() => setRythme(r => Math.max(1, r - 1))}
                  disabled={rythme <= 1}
                >
                  <Text style={[styles.stepperBtnText, rythme <= 1 && { color: colors.grayBorder }]}>−</Text>
                </TouchableOpacity>

                <View style={styles.stepperCenter}>
                  <Text style={[styles.stepperNumber, { fontSize: 36, lineHeight: 40 }]}>−{rythme}</Text>
                  <Text style={styles.stepperUnit}>cigarette{rythme > 1 ? 's' : ''} par semaine</Text>
                </View>

                <TouchableOpacity
                  style={[styles.stepperBtn, rythme >= 10 && styles.stepperBtnDisabled]}
                  onPress={() => setRythme(r => Math.min(10, r + 1))}
                  disabled={rythme >= 10}
                >
                  <Text style={[styles.stepperBtnText, rythme >= 10 && { color: colors.grayBorder }]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Paliers semaine par semaine */}
              <View style={styles.paliersRow}>
                {paliers.map((v, i) => (
                  <View key={i} style={styles.palierChip}>
                    <Text style={styles.palierSemaine}>{i === 0 ? 'Auj.' : `S+${i}`}</Text>
                    <Text style={[styles.palierValeur, v === 0 && { color: colors.primary }]}>
                      {v === 0 ? '🎉 0' : v}
                    </Text>
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
                <Text style={styles.planResumeText}>
                  🏁 À ce rythme, vous atteindrez <Text style={{ fontWeight: '800' }}>0 cigarette</Text> dans{' '}
                  <Text style={{ fontWeight: '800' }}>{semainesTotal} semaine{semainesTotal > 1 ? 's' : ''}</Text>,
                  {' '}vers le <Text style={{ fontWeight: '800' }}>{dateZero}</Text>.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── Aperçu de l'objectif ── */}
        <View style={styles.apercuCard}>
          <Text style={styles.apercuTitle}>Aperçu de votre objectif</Text>
          <Text style={styles.apercuRef}>
            Référence : {consoAvant} cig / jour avant l'app
            {stats?.consoEstimee ? ' (estimée — ajustez-la dans Profil → Paramètres de consommation)' : ''}
          </Text>

          {/* Économie estimée : mois / an / 10 ans */}
          <View style={styles.apercuBloc}>
            <View style={styles.apercuBlocHeader}>
              <View style={styles.apercuIconCircle}>
                <Text style={{ fontSize: 18 }}>💰</Text>
              </View>
              <Text style={styles.apercuBlocTitre}>Économie estimée</Text>
            </View>
            <View style={styles.apercuCols}>
              <View style={styles.apercuColBox}>
                <Text style={styles.apercuColVal}>+{ecoMois} €</Text>
                <Text style={styles.apercuColLbl}>par mois</Text>
              </View>
              <View style={styles.apercuColBox}>
                <Text style={styles.apercuColVal}>+{ecoAn} €</Text>
                <Text style={styles.apercuColLbl}>par an</Text>
              </View>
              <View style={styles.apercuColBox}>
                <Text style={styles.apercuColVal}>+{eco10} €</Text>
                <Text style={styles.apercuColLbl}>sur 10 ans</Text>
              </View>
            </View>
          </View>

          {/* Temps de vie récupéré : mois / an / 10 ans */}
          <View style={styles.apercuBloc}>
            <View style={styles.apercuBlocHeader}>
              <View style={[styles.apercuIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Text style={{ fontSize: 18 }}>🕐</Text>
              </View>
              <Text style={styles.apercuBlocTitre}>Temps de vie récupéré</Text>
            </View>
            <View style={styles.apercuCols}>
              <View style={[styles.apercuColBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.apercuColVal, { color: '#B45309' }]}>+{vieMoisH} h</Text>
                <Text style={styles.apercuColLbl}>par mois</Text>
              </View>
              <View style={[styles.apercuColBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.apercuColVal, { color: '#B45309' }]}>+{vieAnJ} j</Text>
                <Text style={styles.apercuColLbl}>par an</Text>
              </View>
              <View style={[styles.apercuColBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.apercuColVal, { color: '#B45309' }]}>+{vie10J} j</Text>
                <Text style={styles.apercuColLbl}>sur 10 ans</Text>
              </View>
            </View>
          </View>

          {/* Réduction de consommation */}
          <View style={styles.apercuRow}>
            <View style={[styles.apercuIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Text style={{ fontSize: 20 }}>📊</Text>
            </View>
            <Text style={styles.apercuLabel}>Réduction de consommation{'\n'}(moyenne sur le 1er mois)</Text>
            <Text style={styles.apercuValPurple}>-{reduction} %</Text>
          </View>
        </View>

        {/* ── Bouton enregistrer ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleEnregistrer}>
          <Text style={styles.saveBtnText}>Enregistrer mon objectif</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          ⓘ  Vous pourrez modifier votre objectif à tout moment.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },

  sectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm, marginTop: spacing.md },

  card: {
    backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  // Options radio
  optionRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm,
  },
  optionRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
  optionRowActive: { backgroundColor: colors.primaryLight },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optionTitre: { fontSize: font.sm, fontWeight: '700', color: colors.black },
  optionDesc:  { fontSize: 12, color: colors.gray },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  // Stepper
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

  // Paliers plan de réduction
  paliersRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  palierChip: {
    flex: 1, backgroundColor: '#F7F8FA', borderRadius: radius.md,
    paddingVertical: 8, alignItems: 'center',
  },
  palierSemaine: { fontSize: 10, color: colors.gray },
  palierValeur:  { fontSize: 15, fontWeight: '800', color: colors.black, marginTop: 2 },
  planResume: {
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    padding: spacing.sm, margin: spacing.md, marginTop: 4,
  },
  planResumeText: { fontSize: 12, color: colors.black, lineHeight: 18, textAlign: 'center' },

  // Aperçu
  apercuCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginTop: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
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
  apercuValPurple: { fontSize: font.sm, fontWeight: '800', color: '#7C3AED' },

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
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: spacing.lg,
  },
  saveBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  footerNote:  { textAlign: 'center', fontSize: 11, color: colors.gray, marginTop: spacing.sm },
});
