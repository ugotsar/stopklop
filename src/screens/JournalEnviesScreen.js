import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, font, radius } from '../theme';

const TRIGGER_LABELS = {
  stress:   { emoji: '😰', label: 'Stress' },
  ennui:    { emoji: '😴', label: 'Ennui' },
  cafe:     { emoji: '☕', label: 'Café / pause' },
  repas:    { emoji: '🍽', label: 'Après repas' },
  social:   { emoji: '👥', label: 'Entourage' },
  alcool:   { emoji: '🍺', label: 'Soirée / alcool' },
  habitude: { emoji: '🚬', label: 'Habitude' },
  autre:    { emoji: '🤷', label: 'Autre' },
};

// Regroupe les envies par jour (clé YYYY-MM-DD), du plus récent au plus ancien
function grouperParJour(envies) {
  const parJour = {};
  envies.forEach(e => {
    const d = new Date(e.ts);
    if (isNaN(d)) return;
    const key = d.toISOString().slice(0, 10);
    (parJour[key] = parJour[key] || []).push(e);
  });
  return Object.entries(parJour)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, list]) => ({
      key,
      list: list.sort((a, b) => new Date(b.ts) - new Date(a.ts)),
      nbFumees:    list.filter(e => e.fume).length,
      nbResistees: list.filter(e => !e.fume).length,
    }));
}

function labelJour(key) {
  const d = new Date(key + 'T12:00:00');
  const todayKey = new Date().toISOString().slice(0, 10);
  const hierKey  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (key === todayKey) return "Aujourd'hui";
  if (key === hierKey)  return 'Hier';
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Regroupe les envies par déclencheur (clés perso conservées telles quelles)
function grouperParDeclencheur(envies) {
  const parTrig = {};
  envies.forEach(e => {
    const key = e.trigger ?? 'autre';
    (parTrig[key] = parTrig[key] || []).push(e);
  });
  return Object.entries(parTrig)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([key, list]) => ({
      key,
      list: list.sort((a, b) => new Date(b.ts) - new Date(a.ts)),
      nbFumees:    list.filter(e => e.fume).length,
      nbResistees: list.filter(e => !e.fume).length,
    }));
}

function fmtDateHeure(ts) {
  const d = new Date(ts);
  const jour = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const heure = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
  return `${jour.charAt(0).toUpperCase() + jour.slice(1)} · ${heure}`;
}

export default function JournalEnviesScreen({ navigation, route }) {
  const { profile } = useUser();
  const envies = Array.isArray(profile?.envies) ? profile.envies : [];
  // Habitudes personnalisées : résolution des clés "perso_*" vers leur libellé
  const persoMap = Object.fromEntries(
    (Array.isArray(profile?.declencheursPerso) ? profile.declencheursPerso : [])
      .map(d => [d.key, { emoji: '📝', label: d.label }])
  );
  const resoudreTrig = k => TRIGGER_LABELS[k] ?? persoMap[k] ?? TRIGGER_LABELS.autre;
  const jours  = grouperParJour(envies);
  const trigs  = grouperParDeclencheur(envies);
  const total  = envies.length;

  const [mode, setMode]       = useState(route?.params?.mode ?? 'jour');
  const [openKey, setOpenKey] = useState(jours[0]?.key ?? null);
  const [openTrig, setOpenTrig] = useState(null);

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal des envies</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Onglets Par jour / Par déclencheur ── */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'jour' && styles.tabActive]}
          onPress={() => setMode('jour')}
        >
          <Text style={[styles.tabText, mode === 'jour' && styles.tabTextActive]}>Par jour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'declencheur' && styles.tabActive]}
          onPress={() => setMode('declencheur')}
        >
          <Text style={[styles.tabText, mode === 'declencheur' && styles.tabTextActive]}>Par déclencheur</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {jours.length === 0 && (
          <View style={styles.vide}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🔥</Text>
            <Text style={styles.videTitre}>Aucune envie enregistrée</Text>
            <Text style={styles.videTexte}>
              Utilisez le bouton « J'ai envie de fumer » dans l'Accueil : chaque envie sera notée ici avec son heure et son déclencheur.
            </Text>
          </View>
        )}

        {mode === 'jour' && jours.map(jour => {
          const open = openKey === jour.key;
          return (
            <View key={jour.key} style={styles.jourCard}>

              {/* Ligne jour (repliable) */}
              <TouchableOpacity
                style={styles.jourRow}
                activeOpacity={0.7}
                onPress={() => setOpenKey(open ? null : jour.key)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.jourTitre}>{labelJour(jour.key)}</Text>
                  <Text style={styles.jourSous}>
                    {jour.list.length} envie{jour.list.length > 1 ? 's' : ''}
                    {'  ·  '}💪 {jour.nbResistees} résistée{jour.nbResistees > 1 ? 's' : ''}
                    {'  ·  '}🚬 {jour.nbFumees} fumée{jour.nbFumees > 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.jourChevron}>{open ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {/* Détail heure par heure */}
              {open && (
                <View style={styles.detail}>
                  {jour.list.map((e, i) => {
                    const d = new Date(e.ts);
                    const heure = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
                    const info  = resoudreTrig(e.trigger);
                    return (
                      <View key={i} style={styles.envieRow}>
                        <Text style={styles.envieHeure}>{heure}</Text>
                        <Text style={{ fontSize: 15 }}>{info.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.envieLabel}>{info.label}</Text>
                          {e.note ? <Text style={styles.envieNote} numberOfLines={3}>« {e.note} »</Text> : null}
                        </View>
                        <Text style={[styles.envieIssue, { color: e.fume ? '#DC2626' : colors.primary }]}>
                          {e.fume ? '🚬 fumé' : '💪 résisté'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Vue par déclencheur ── */}
        {mode === 'declencheur' && trigs.map(t => {
          const info = resoudreTrig(t.key);
          const open = openTrig === t.key;
          const pct  = total > 0 ? Math.round((t.list.length / total) * 100) : 0;
          return (
            <View key={t.key} style={styles.jourCard}>

              <TouchableOpacity
                style={styles.jourRow}
                activeOpacity={0.7}
                onPress={() => setOpenTrig(open ? null : t.key)}
              >
                <Text style={{ fontSize: 22 }}>{info.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jourTitre}>{info.label}</Text>
                  <Text style={styles.jourSous}>
                    {t.list.length} envie{t.list.length > 1 ? 's' : ''} ({pct}%)
                    {'  ·  '}💪 {t.nbResistees}
                    {'  ·  '}🚬 {t.nbFumees}
                  </Text>
                  <View style={styles.trigBarTrack}>
                    <View style={[styles.trigBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
                <Text style={styles.jourChevron}>{open ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {open && (
                <View style={styles.detail}>
                  {t.list.map((e, i) => (
                    <View key={i} style={styles.envieRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.envieLabel}>{fmtDateHeure(e.ts)}</Text>
                        {e.note ? <Text style={styles.envieNote} numberOfLines={3}>« {e.note} »</Text> : null}
                      </View>
                      <Text style={[styles.envieIssue, { color: e.fume ? '#DC2626' : colors.primary }]}>
                        {e.fume ? '🚬 fumé' : '💪 résisté'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F8FA' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },

  tabs: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: '#F0F0F0', alignItems: 'center',
  },
  tabActive:    { backgroundColor: colors.primary },
  tabText:      { fontSize: 12, fontWeight: '600', color: colors.gray },
  tabTextActive: { color: colors.white },

  trigBarTrack: {
    height: 6, backgroundColor: '#F0F0F0', borderRadius: 3,
    overflow: 'hidden', marginTop: 6,
  },
  trigBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },

  vide:       { alignItems: 'center', paddingVertical: spacing.xxl },
  videTitre:  { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: 6 },
  videTexte:  { fontSize: 12, color: colors.gray, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.lg },

  jourCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    marginBottom: spacing.sm, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  jourRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, gap: spacing.sm,
  },
  jourTitre:   { fontSize: font.sm, fontWeight: '700', color: colors.black },
  jourSous:    { fontSize: 11, color: colors.gray, marginTop: 3 },
  jourChevron: { fontSize: 16, color: colors.gray },

  detail: {
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  envieRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#FAFAFA',
  },
  envieHeure: { fontSize: 12, fontWeight: '700', color: colors.black, width: 44 },
  envieLabel: { fontSize: 12, color: colors.black },
  envieNote:  { fontSize: 11, color: colors.gray, fontStyle: 'italic', marginTop: 2 },
  envieIssue: { fontSize: 11, fontWeight: '700' },
});
