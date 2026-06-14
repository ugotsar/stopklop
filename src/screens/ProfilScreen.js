import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Modal, TextInput, Alert,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

// ── Modal bottom sheet générique ─────────────────────────────────────────────
function EditModal({ visible, onClose, title, currentValue, unit, onSave, step = 0.5 }) {
  const [val, setVal] = useState(currentValue);

  function handleSave() {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) { onSave(n); onClose(); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.bottomSheet}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>{title}</Text>

        <Text style={styles.sheetCurrentLabel}>Prix actuel</Text>
        <Text style={styles.sheetCurrentValue}>{currentValue} {unit}</Text>

        {/* Stepper */}
        <View style={styles.sheetStepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setVal(v => Math.max(0, parseFloat(v || 0) - step).toFixed(step < 1 ? 2 : 0))}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.stepCenter}>
            <Text style={styles.stepValue}>{val} {unit}</Text>
          </View>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={() => setVal(v => (parseFloat(v || 0) + step).toFixed(step < 1 ? 2 : 0))}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* OU saisie manuelle */}
        <Text style={styles.sheetOu}>OU</Text>
        <Text style={styles.sheetManuelLabel}>Saisir manuellement</Text>
        <View style={styles.sheetInputRow}>
          <TextInput
            style={styles.sheetInput}
            value={String(val)}
            onChangeText={setVal}
            keyboardType="decimal-pad"
          />
          <Text style={styles.sheetInputUnit}>{unit}</Text>
        </View>

        {/* Checkbox projections */}
        <View style={styles.sheetCheckRow}>
          <View style={styles.checkboxActive}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.checkLabel}>Mettre à jour mes projections</Text>
            <Text style={styles.checkSub}>Les statistiques seront recalculées avec cette nouvelle valeur.</Text>
          </View>
        </View>

        {/* Boutons */}
        <View style={styles.sheetBtns}>
          <TouchableOpacity style={styles.sheetBtnCancel} onPress={onClose}>
            <Text style={styles.sheetBtnCancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetBtnSave} onPress={handleSave}>
            <Text style={styles.sheetBtnSaveText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Écran Profil ─────────────────────────────────────────────────────────────
export default function ProfilScreen({ navigation }) {
  const { profile, stats, updateProfile, resetProfile } = useUser();

  const [notifs,       setNotifs]       = useState(true);
  const [modalPrix,    setModalPrix]    = useState(false);
  const [modalCig,     setModalCig]     = useState(false);

  const prixPaquet       = profile?.prixPaquet       ?? 11;
  const cigParPaquet     = profile?.cigarettesParPaquet ?? 20;
  const argentEco        = stats?.argentEconomise ?? 126.40;
  const vieGagneeMin     = (stats?.cigarettesNonFumees ?? 0) * 20;
  const vieGagneeH       = Math.floor(vieGagneeMin / 60);
  const vieStr           = vieGagneeH > 0 ? `${vieGagneeH} h ${vieGagneeMin % 60} min` : `${vieGagneeMin} min`;
  const motivation       = profile?.niveauMotivation ?? 8;
  const diffJours        = stats?.diffJours ?? 12;
  const objectifLabel    = profile?.typeObjectif === 'stop' ? 'Arrêt complet' : 'Réduction progressive';
  const objectifDetail   = `Objectif : ${profile?.objectifCigarettes ?? 8} cigarettes / jour`;

  async function handleDeleteAccount() {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await resetProfile();
            navigation.replace('Welcome');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Carte utilisateur ── */}
        <View style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>Membre</Text>
              <Text style={styles.userSince}>
                Membre depuis {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  : 'mai 2024'}
              </Text>
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {diffJours} jours sans cigarette</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          {/* Stats rapides */}
          <View style={styles.quickStats}>
            <QuickStat icon="🐷" valeur={`+${argentEco.toFixed(2)} €`} label="économisés"    color={colors.primary} />
            <QuickStat icon="🕐" valeur={vieStr}                        label="de vie gagnées" color="#F59E0B" />
            <QuickStat icon="🎯" valeur={`${motivation}/10`}            label="motivation"     color="#7C3AED" />
            <QuickStat icon="🏆" valeur="3"                             label="badges"         color="#F59E0B" />
          </View>
        </View>

        {/* ── Mon objectif actuel ── */}
        <Text style={styles.sectionTitle}>Mon objectif actuel</Text>
        <TouchableOpacity
          style={styles.listCard}
          onPress={() => navigation.navigate('ModifierObjectif')}
        >
          <View style={[styles.listIconCircle, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ fontSize: 20 }}>🎯</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.listItemTitle}>{objectifLabel}</Text>
            <Text style={styles.listItemSub}>{objectifDetail}</Text>
          </View>
          <Text style={styles.listModifier}>Modifier  ›</Text>
        </TouchableOpacity>

        {/* ── Paramètres de consommation ── */}
        <Text style={styles.sectionTitle}>Paramètres de consommation</Text>
        <View style={styles.listCard}>
          <TouchableOpacity style={styles.listRow} onPress={() => setModalPrix(true)}>
            <View style={[styles.listIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ fontSize: 20 }}>💶</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Prix du paquet</Text>
              <Text style={styles.listItemSub}>{prixPaquet.toFixed(2)} €</Text>
            </View>
            <Text style={styles.listModifier}>Modifier  ›</Text>
          </TouchableOpacity>

          <View style={styles.listDivider} />

          <TouchableOpacity style={styles.listRow} onPress={() => setModalCig(true)}>
            <View style={[styles.listIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Text style={{ fontSize: 20 }}>🚬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Cigarettes par paquet</Text>
              <Text style={styles.listItemSub}>{cigParPaquet} cigarettes</Text>
            </View>
            <Text style={styles.listModifier}>Modifier  ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Préférences ── */}
        <Text style={styles.sectionTitle}>Préférences</Text>
        <View style={styles.listCard}>
          <View style={styles.listRow}>
            <View style={[styles.listIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Notifications</Text>
              <Text style={styles.listItemSub}>Rappels, motivation, conseils</Text>
            </View>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              trackColor={{ false: colors.grayBorder, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.listDivider} />

          <TouchableOpacity
            style={styles.listRow}
            onPress={() => navigation.navigate('UniteMonnaie')}
          >
            <View style={[styles.listIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Text style={{ fontSize: 20 }}>🌍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Unités</Text>
              <Text style={styles.listItemSub}>Euro (€) · Heures · Cigarettes</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Aide & support ── */}
        <Text style={styles.sectionTitle}>Aide & support</Text>
        <View style={styles.listCard}>
          <TouchableOpacity style={styles.listRow}>
            <View style={[styles.listIconCircle, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ fontSize: 20 }}>❓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Centre d'aide</Text>
              <Text style={styles.listItemSub}>FAQ, guides et ressources</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.listDivider} />

          <TouchableOpacity
            style={styles.listRow}
            onPress={() => navigation.navigate('NousContacter')}
          >
            <View style={[styles.listIconCircle, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ fontSize: 20 }}>💬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>Nous contacter</Text>
              <Text style={styles.listItemSub}>Une question ? On est là pour vous</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.listDivider} />

          <TouchableOpacity style={styles.listRow}>
            <View style={[styles.listIconCircle, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ fontSize: 20 }}>ℹ️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>À propos de Stopklop</Text>
              <Text style={styles.listItemSub}>Version 1.0.0</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Supprimer compte ── */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteBtnText}>🗑  Supprimer mon compte</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modals bottom sheet ── */}
      <EditModal
        visible={modalPrix}
        onClose={() => setModalPrix(false)}
        title="Modifier le prix du paquet"
        currentValue={prixPaquet}
        unit="€"
        step={0.5}
        onSave={v => updateProfile({ prixPaquet: v })}
      />
      <EditModal
        visible={modalCig}
        onClose={() => setModalCig(false)}
        title="Modifier le nombre de cigarettes par paquet"
        currentValue={cigParPaquet}
        unit="cigarettes"
        step={1}
        onSave={v => updateProfile({ cigarettesParPaquet: Math.round(v) })}
      />

    </SafeAreaView>
  );
}

// ── Sous-composant stat rapide ────────────────────────────────────────────────
function QuickStat({ icon, valeur, label, color }) {
  return (
    <View style={styles.quickStat}>
      <Text style={{ fontSize: 20, marginBottom: 2 }}>{icon}</Text>
      <Text style={[styles.quickStatVal, { color }]}>{valeur}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: spacing.md, paddingBottom: 90 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  headerTitle: { fontSize: font.lg, fontWeight: '800', color: colors.black, flex: 1, textAlign: 'center' },
  settingsBtn: { position: 'absolute', right: spacing.lg },

  // Carte utilisateur
  userCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  userRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  avatar:     {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarIcon: { fontSize: 32 },
  userName:   { fontSize: font.lg, fontWeight: '800', color: colors.black },
  userSince:  { fontSize: 12, color: colors.gray, marginTop: 2 },
  streakBadge: {
    marginTop: 6, backgroundColor: '#FEF3C7', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
  },
  streakText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  chevron:    { fontSize: 18, color: colors.gray },

  // Stats rapides
  quickStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.grayBorder, paddingTop: spacing.sm },
  quickStat:  { flex: 1, alignItems: 'center' },
  quickStatVal:   { fontSize: 13, fontWeight: '800' },
  quickStatLabel: { fontSize: 10, color: colors.gray, textAlign: 'center' },

  // Sections
  sectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginTop: spacing.md, marginBottom: spacing.sm },

  // Listes
  listCard: {
    backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden',
    marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  listDivider: { height: 1, backgroundColor: colors.grayBorder, marginLeft: 68 },
  listIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  listItemTitle: { fontSize: font.sm, fontWeight: '600', color: colors.black },
  listItemSub:   { fontSize: 12, color: colors.gray, marginTop: 1 },
  listModifier:  { fontSize: 12, color: colors.primary, fontWeight: '600' },

  // Supprimer
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginTop: spacing.sm,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  deleteBtnText: { fontSize: font.sm, fontWeight: '600', color: '#EF4444' },

  // Modal / Bottom sheet
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: colors.grayBorder,
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  sheetTitle:        { fontSize: font.lg, fontWeight: '800', color: colors.black, textAlign: 'center', marginBottom: spacing.md },
  sheetCurrentLabel: { fontSize: 12, color: colors.gray, textAlign: 'center' },
  sheetCurrentValue: { fontSize: 28, fontWeight: '900', color: colors.primary, textAlign: 'center', marginBottom: spacing.md },

  sheetStepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  stepBtn: {
    width: 52, height: 52, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.grayBorder,
    alignItems: 'center', justifyContent: 'center', flex: 0,
  },
  stepBtnText:  { fontSize: 28, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  stepCenter:   { flex: 1, alignItems: 'center', backgroundColor: '#F7F8FA', borderRadius: radius.md, paddingVertical: 14 },
  stepValue:    { fontSize: font.lg, fontWeight: '800', color: colors.black },

  sheetOu:          { textAlign: 'center', color: colors.gray, fontSize: 12, marginBottom: spacing.sm },
  sheetManuelLabel: { fontSize: 12, color: colors.gray, marginBottom: 6 },
  sheetInputRow:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.grayBorder, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  sheetInput:       { flex: 1, fontSize: font.lg, fontWeight: '700', paddingVertical: 12 },
  sheetInputUnit:   { fontSize: font.md, color: colors.gray },

  sheetCheckRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.lg },
  checkboxActive: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  checkLabel: { fontSize: 13, fontWeight: '600', color: colors.black },
  checkSub:   { fontSize: 11, color: colors.gray, marginTop: 2 },

  sheetBtns:        { flexDirection: 'row', gap: spacing.sm },
  sheetBtnCancel:   { flex: 1, borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center' },
  sheetBtnCancelText: { color: colors.primary, fontWeight: '700', fontSize: font.md },
  sheetBtnSave:     { flex: 1, backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center' },
  sheetBtnSaveText: { color: colors.white, fontWeight: '700', fontSize: font.md },
});
