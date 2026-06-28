import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Modal,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';
import { annulerNotificationSoir } from '../services/notifications';
import { jouerSon } from '../services/sounds';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Modal journée parfaite ──────────────────────────────────────────────────
function ModalParfait({ visible, diffJours, objectifJour, onClose }) {
  const streak = diffJours || 0;
  const vieGagnee = objectifJour * 20;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mp.overlay}>
        <View style={mp.card}>
          <View style={mp.banner}>
            <Text style={mp.emoji}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={mp.titre}>Journée sans tabac !</Text>
              <Text style={mp.sous}>0 cigarette aujourd'hui</Text>
            </View>
          </View>
          <View style={mp.body}>
            <View style={mp.statsRow}>
              <StatColonne valeur={`+${vieGagnee} min`} label="vie gagnée" color="#1B6B3A" />
              <View style={mp.div} />
              <StatColonne valeur="0,00 €" label="dépensé" color="#1B6B3A" />
              <View style={mp.div} />
              <StatColonne valeur={`🔥 ${streak}j`} label="streak" color="#F59E0B" />
            </View>
            <TouchableOpacity style={mp.btn} onPress={onClose}>
              <Text style={mp.btnText}>Super, merci !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StatColonne({ valeur, label, color }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color }}>{valeur}</Text>
      <Text style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const mp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card:    { width: '100%', backgroundColor: colors.white, borderRadius: 20, overflow: 'hidden' },
  banner:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B6B3A', paddingVertical: 16, paddingHorizontal: 18, gap: 12 },
  emoji:   { fontSize: 30 },
  titre:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  sous:    { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body:    { padding: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#F9FAFB', borderRadius: 12, paddingVertical: 12, marginBottom: 16 },
  div:     { width: 1, height: 32, backgroundColor: colors.grayBorder },
  btn:     { backgroundColor: '#1B6B3A', borderRadius: 30, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

// ── Modal feedback journée (variante A = ok, variante B = dépassé) ───────────
function ModalObjectif({ visible, count, objectif, prixCigarette, onClose }) {
  const isOk      = count <= objectif;
  const depense   = (count * prixCigarette).toFixed(2);

  // Variante A — objectif respecté
  const pct          = isOk ? Math.round((count / objectif) * 100) : 0;
  const marge        = isOk ? Math.round(((objectif - count) / objectif) * 100) : 0;
  const viePreservee = isOk ? (objectif - count) * 5 : 0;

  // Variante B — objectif dépassé
  const exces      = !isOk ? count - objectif : 0;
  const viePerdue  = !isOk ? count * 5 : 0;
  const totalBar   = !isOk ? objectif + exces : 1;
  const pctObj     = !isOk ? Math.round((objectif / totalBar) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mp.overlay}>
        <View style={[mp.card, { borderWidth: 0.5, borderColor: isOk ? '#C0DD97' : '#FCD34D' }]}>

          {/* ── Bandeau ── */}
          {isOk ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF3DE', paddingVertical: 14, paddingHorizontal: 16, gap: 10, borderBottomWidth: 0.5, borderBottomColor: '#C0DD97' }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#C0DD97', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>✅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#27500A' }}>Bien joué !</Text>
                <Text style={{ fontSize: 11, color: '#3B6D11', marginTop: 2 }}>Objectif respecté aujourd'hui</Text>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#92400E', paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Objectif dépassé</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{count} cig · +{exces} au-dessus</Text>
              </View>
            </View>
          )}

          {/* ── Corps ── */}
          <View style={{ padding: 16 }}>
            {isOk ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, color: '#888' }}>{count} cigarette{count > 1 ? 's' : ''}</Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>objectif : {objectif}</Text>
                </View>
                <View style={{ height: 7, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: '#1B6B3A', borderRadius: 6 }} />
                </View>
                <Text style={{ fontSize: 10, color: '#1B6B3A', textAlign: 'right', marginBottom: 12 }}>{marge}% de marge</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: '#EAF3DE', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#27500A' }}>{depense} €</Text>
                    <Text style={{ fontSize: 10, color: '#1B6B3A', marginTop: 1 }}>dépensé</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#EAF3DE', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#27500A' }}>{viePreservee} min</Text>
                    <Text style={{ fontSize: 10, color: '#1B6B3A', marginTop: 1 }}>vie préservée</Text>
                  </View>
                </View>
                <TouchableOpacity style={{ backgroundColor: '#1B6B3A', borderRadius: 30, paddingVertical: 12, alignItems: 'center' }} onPress={onClose}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>C'est noté !</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, color: '#92400E' }}>objectif : {objectif}</Text>
                  <Text style={{ fontSize: 11, color: '#DC2626' }}>+{exces} de trop</Text>
                </View>
                <View style={{ height: 7, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', marginBottom: 4 }}>
                  <View style={{ height: '100%', width: `${pctObj}%`, backgroundColor: '#F59E0B' }} />
                  <View style={{ height: '100%', width: `${100 - pctObj}%`, backgroundColor: '#DC2626' }} />
                </View>
                <Text style={{ fontSize: 10, color: '#B45309', textAlign: 'center', marginBottom: 12 }}>{count} cigarettes fumées aujourd'hui</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>{depense} €</Text>
                    <Text style={{ fontSize: 10, color: '#B45309', marginTop: 1 }}>dépensé</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400E' }}>{viePerdue} min</Text>
                    <Text style={{ fontSize: 10, color: '#B45309', marginTop: 1 }}>de vie</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#FFF7ED', borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A', padding: 12, marginBottom: 14 }}>
                  <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 19, textAlign: 'center' }}>
                    Chaque jour est une nouvelle chance.{'\n'}Demain, vous pouvez le faire. 💪
                  </Text>
                </View>
                <TouchableOpacity style={{ backgroundColor: '#92400E', borderRadius: 30, paddingVertical: 12, alignItems: 'center' }} onPress={onClose}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Compris !</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Citations motivation ────────────────────────────────────────────────────
const MOTIVATIONS = [
  "Chaque heure sans cigarette est une victoire pour votre santé.",
  "Vous n'abandonnez pas quelque chose, vous gagnez une vie meilleure.",
  "La force que vous montrez aujourd'hui construit votre santé de demain.",
  "Un jour à la fois. Vous y arrivez ! 💪",
  "Votre corps vous remercie à chaque minute sans tabac.",
];

// ── Arc circulaire de progression ───────────────────────────────────────────
function CircularProgress({ current, total, size = 110 }) {
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  const dash = circumference * ratio;
  const gap  = circumference - dash;

  // Arc starts at top (rotate -90deg)
  return (
    <Svg width={size} height={size}>
      {/* Track */}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={colors.primary}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${dash} ${gap}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${cx}, ${cy}`}
      />
    </Svg>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }) {
  const { profile, stats, resetProfile } = useUser();
  const [, setTick]          = useState(0);
  const [quoteIdx]           = useState(() => Math.floor(Math.random() * MOTIVATIONS.length));
  const [liked, setLiked]    = useState(false);
  const [modalParfait, setModalParfait]   = useState(false);
  const [modalObjectif, setModalObjectif] = useState(false);
  const milestonesJoues      = React.useRef(new Set());

  // Rafraîchir chaque seconde pour le compteur live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Détection milestones — jouer le son une seule fois par session
  useEffect(() => {
    if (!stats) return;
    const { diffJours, diffHeures } = stats;
    const totalHeures = diffJours * 24 + diffHeures;

    if (totalHeures >= 24 && !milestonesJoues.current.has('24h')) {
      milestonesJoues.current.add('24h');
      jouerSon('milestone_24h');
    } else if (diffJours >= 7 && !milestonesJoues.current.has('7j')) {
      milestonesJoues.current.add('7j');
      jouerSon('milestone_7j');
    } else if (diffJours >= 30 && !milestonesJoues.current.has('30j')) {
      milestonesJoues.current.add('30j');
      jouerSon('milestone_30j');
    }
  }, [stats?.diffJours]);

  if (!profile || !stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🌿</Text>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { diffJours, diffHeures, diffMinutes, cigarettesNonFumees, argentEconomise } = stats;

  // Objectif cigarettes / jour (depuis le profil ou 10 par défaut)
  const objectifJour   = profile.objectifCigarettes ?? Math.max(1, Math.floor((profile.consoAvantApp || 10) * 0.8));
  const cigarettesToday = profile.cigarettesToday ?? 0;

  // Vie gagnée : 20 min / cigarette non fumée
  const vieGagneeMin  = cigarettesNonFumees * 20;
  const vieGagneeH    = Math.floor(vieGagneeMin / 60);
  const vieGagneeJ    = Math.floor(vieGagneeH / 24);
  const vieGagneeStr  = vieGagneeJ > 0
    ? `${vieGagneeJ}j ${vieGagneeH % 24}h`
    : `${vieGagneeH}h`;

  // Progression (% réduction vs avant)
  const consoAvant   = profile.consoAvantApp || 10;
  const progression  = Math.min(100, Math.round(((consoAvant - cigarettesToday) / consoAvant) * 100));

  // Durée formatée : Xj XXh XXm
  const dureeStr = diffJours > 0
    ? `${diffJours}j ${String(diffHeures % 24).padStart(2,'0')}h ${String(diffMinutes % 60).padStart(2,'0')}m`
    : `${String(diffHeures % 24).padStart(2,'0')}h ${String(diffMinutes % 60).padStart(2,'0')}m`;

  return (
    <SafeAreaView style={styles.safe}>

      <ModalParfait
        visible={modalParfait}
        diffJours={diffJours}
        objectifJour={objectifJour}
        onClose={() => setModalParfait(false)}
      />
      <ModalObjectif
        visible={modalObjectif}
        count={cigarettesToday}
        objectif={objectifJour}
        prixCigarette={stats?.prixCigarette ?? 0.55}
        onClose={() => setModalObjectif(false)}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.hello}>
            Bonjour 👋{' '}
            <Text style={styles.prenom}>
              {profile.prenom || profile.email?.split('@')[0] || 'Champion'}
            </Text>
          </Text>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* ── Carte verte "Temps sans fumer" ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <Text style={styles.heroLabel}>Temps sans fumer</Text>
            <Text style={styles.heroMedal}>🏅</Text>
          </View>
          <Text style={styles.heroTimer}>{dureeStr}</Text>
        </View>

        {/* ── Section Aujourd'hui ── */}
        <View style={styles.todayCard}>
          <Text style={styles.sectionTitle}>Aujourd'hui</Text>

          <View style={styles.todayContent}>
            {/* Arc circulaire */}
            <View style={styles.arcContainer}>
              <CircularProgress current={cigarettesToday} total={objectifJour} size={110} />
              <View style={styles.arcInner}>
                <Text style={styles.arcCurrent}>{cigarettesToday}</Text>
                <Text style={styles.arcSep}>/</Text>
                <Text style={styles.arcTotal}>{objectifJour}</Text>
              </View>
            </View>

            {/* Label à côté */}
            <View style={styles.todayRight}>
              <Text style={styles.todaySubtitle}>cigarettes{'\n'}aujourd'hui</Text>
              <Text style={styles.todayObjectif}>Objectif : {objectifJour} max</Text>
            </View>
          </View>

          {/* Bouton valider */}
          <TouchableOpacity
            style={styles.validateBtn}
            onPress={() => {
              jouerSon(cigarettesToday === 0 ? 'enregistrer_zero' : 'valider_journee');
              annulerNotificationSoir();
              if (cigarettesToday === 0) setModalParfait(true);
              else setModalObjectif(true);
            }}
          >
            <Text style={styles.validateBtnText}>✓  Valider ma journée</Text>
          </TouchableOpacity>

          {/* Lien "J'ai fumé" */}
          <TouchableOpacity
            style={styles.fumerLink}
            onPress={() => navigation.navigate('JaiFume')}
          >
            <Text style={styles.fumerLinkText}>J'ai fumé aujourd'hui  ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Grille stats 2×2 ── */}
        <View style={styles.statsGrid}>
          <StatBox
            emoji="🚬"
            valeur={cigarettesNonFumees}
            label="Cigarettes évitées"
          />
          <StatBox
            emoji="💰"
            valeur={`${argentEconomise.toFixed(2)}€`}
            label="Argent économisé"
            valeurColor="#F59E0B"
          />
          <StatBox
            emoji="⏱"
            valeur={vieGagneeStr}
            label="Vie gagnée"
            valeurColor={colors.primary}
          />
          <StatBox
            emoji="📈"
            valeur={`${progression}%`}
            label="Progression"
            valeurColor={colors.primary}
          />
        </View>

        {/* ── Motivation du jour ── */}
        <View style={styles.motivCard}>
          <View style={styles.motivHeader}>
            <Text style={styles.motivTitle}>✨  Motivation du jour</Text>
            <TouchableOpacity onPress={() => { if (!liked) jouerSon('motivation_like'); setLiked(l => !l); }}>
              <Text style={styles.motivHeart}>{liked ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.motivQuote}>"{MOTIVATIONS[quoteIdx]}"</Text>
        </View>

        {/* ── Reset dev ── */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={async () => { await resetProfile(); navigation.replace('Welcome'); }}
        >
          <Text style={styles.resetText}>↩ Recommencer l'onboarding</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composant StatBox ───────────────────────────────────────────────────────
function StatBox({ emoji, valeur, label, valeurColor = colors.black }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValeur, { color: valeurColor }]}>{valeur}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 90 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: font.md, color: colors.gray, marginTop: spacing.sm },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  hello:  { fontSize: font.lg, color: colors.black, fontWeight: '500' },
  prenom: { fontWeight: '800', color: colors.black },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  bellIcon: { fontSize: 18 },

  // Hero verte
  heroCard: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: font.sm, fontWeight: '600' },
  heroMedal: { fontSize: 22 },
  heroTimer: { color: colors.white, fontSize: 30, fontWeight: '900', letterSpacing: 1 },

  // Aujourd'hui
  todayCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: font.md, fontWeight: '700', color: colors.black, marginBottom: spacing.md },
  todayContent: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  arcContainer: { position: 'relative', width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  arcInner: { position: 'absolute', flexDirection: 'row', alignItems: 'baseline' },
  arcCurrent: { fontSize: 26, fontWeight: '900', color: colors.primary },
  arcSep:     { fontSize: 14, color: colors.gray, marginHorizontal: 2 },
  arcTotal:   { fontSize: 14, fontWeight: '600', color: colors.gray },
  todayRight: { marginLeft: spacing.lg, flex: 1 },
  todaySubtitle: { fontSize: font.md, fontWeight: '600', color: colors.black, lineHeight: 22 },
  todayObjectif:  { fontSize: 12, color: colors.gray, marginTop: 4 },

  validateBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.sm,
  },
  validateBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  fumerLink:   { alignItems: 'center', paddingVertical: 4 },
  fumerLinkText: { color: colors.primary, fontSize: font.sm, fontWeight: '500' },

  // Stats 2×2
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md,
  },
  statBox: {
    width: (SCREEN_W - spacing.md * 2 - spacing.sm) / 2,
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statEmoji:  { fontSize: 22, marginBottom: 6 },
  statValeur: { fontSize: font.xl, fontWeight: '900', color: colors.black, marginBottom: 2 },
  statLabel:  { fontSize: 12, color: colors.gray, lineHeight: 16 },

  // Motivation
  motivCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  motivHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  motivTitle:  { fontSize: font.sm, fontWeight: '700', color: colors.black },
  motivHeart:  { fontSize: 22 },
  motivQuote:  { fontSize: font.sm, color: colors.gray, lineHeight: 22, fontStyle: 'italic' },

  // Reset
  resetBtn:  { alignItems: 'center', paddingVertical: spacing.md },
  resetText: { color: colors.gray, fontSize: 12 },
});
