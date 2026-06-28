import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Switch, Alert,
} from 'react-native';
import { colors, spacing, font, radius } from '../theme';
import {
  demanderPermissionNotifications,
  annulerToutesNotifications,
} from '../services/notifications';
import * as Notifications from 'expo-notifications';

const MIN_NOTIFS = 1;
const MAX_NOTIFS = 6;

function computeHoraires(count) {
  if (count <= 0) return [];
  const debut  = 9 * 60;
  const fin    = 21 * 60 + 30;
  const plage  = fin - debut;
  const step   = count === 1 ? 0 : plage / (count - 1);
  return Array.from({ length: count }, (_, i) => {
    const totalMinutes = Math.round(debut + i * step);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return { h, m, label: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` };
  });
}

async function programmerNotifsDynamiques(count) {
  await annulerToutesNotifications();
  const horaires = computeHoraires(count);
  const messages = [
    { title: '☀️ Nouvelle journée, nouveau départ',  body: "Aujourd'hui, tu peux faire mieux qu'hier. Note tes cigarettes." },
    { title: '🚬 Comment ça se passe aujourd\'hui ?', body: 'Pense à noter tes cigarettes. Chaque chiffre compte.' },
    { title: '📊 Bilan de ta journée',               body: "Tu as fumé combien aujourd'hui ? Note-le avant de dormir." },
    { title: '💪 Tu tiens le coup ?',                body: 'Un petit rappel pour noter tes cigarettes.' },
    { title: '⏰ Rappel de mi-journée',              body: 'Prends 10 secondes pour noter tes cigarettes.' },
    { title: '🌙 Fin de journée',                    body: 'Dernière chance de noter ta consommation du jour.' },
  ];
  for (let i = 0; i < horaires.length; i++) {
    const { h, m } = horaires[i];
    const msg = messages[i % messages.length];
    await Notifications.scheduleNotificationAsync({
      identifier: `stopklop-notif-${i}`,
      content: { title: msg.title, body: msg.body, data: { screen: 'JaiFume' }, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
    });
  }
}

export default function NotificationsScreen({ navigation }) {
  const [count, setCount]         = useState(3);
  const [autoRep, setAutoRep]     = useState(true);
  const [tipVisible, setTipVisible] = useState(true);
  const horaires = computeHoraires(count);

  const tip = {
    1: 'Une notification par jour suffit pour débuter le suivi.',
    2: 'Matin et soir : le minimum pour un suivi efficace.',
    3: '3 rappels par jour pour un suivi équilibré.',
    4: '4 rappels : idéal pour les premières semaines.',
    5: '5 rappels gardent la conscience de ta conso tout au long de la journée.',
    6: '6 notifications par jour est idéal pour rester motivé sans être dérangé.',
  };

  function decrement() { setCount(c => Math.max(MIN_NOTIFS, c - 1)); setTipVisible(true); }
  function increment() { setCount(c => Math.min(MAX_NOTIFS, c + 1)); setTipVisible(true); }

  async function handleSave() {
    const ok = await demanderPermissionNotifications();
    if (!ok) {
      Alert.alert('Permission refusée', 'Active les notifications dans les Réglages iOS pour recevoir des rappels.');
      return;
    }
    await programmerNotifsDynamiques(count);
    Alert.alert('Enregistré', `${count} notification${count > 1 ? 's' : ''} par jour programmée${count > 1 ? 's' : ''}.`);
  }

  async function handleDesactiver() {
    Alert.alert(
      'Désactiver les notifications',
      'Tu ne recevras plus de rappels pour noter tes cigarettes.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver', style: 'destructive',
          onPress: async () => {
            await annulerToutesNotifications();
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <View style={s.bellCircle}>
          <Text style={s.bellEmoji}>🔔</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.subtitle}>
          Choisis combien de fois par jour l'application te demande si tu as fumé.
        </Text>

        {/* Card : nombre */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Nombre de notifications par jour</Text>
          <View style={s.counterRow}>
            <TouchableOpacity
              style={[s.counterBtn, count <= MIN_NOTIFS && s.counterBtnDisabled]}
              onPress={decrement}
              activeOpacity={0.7}
            >
              <Text style={[s.counterBtnText, count <= MIN_NOTIFS && s.counterBtnTextDisabled]}>−</Text>
            </TouchableOpacity>
            <Text style={s.counterNum}>{count}</Text>
            <TouchableOpacity
              style={[s.counterBtn, count >= MAX_NOTIFS && s.counterBtnDisabled]}
              onPress={increment}
              activeOpacity={0.7}
            >
              <Text style={[s.counterBtnText, count >= MAX_NOTIFS && s.counterBtnTextDisabled]}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.counterLabel}>notifications par jour</Text>

          <View style={s.infoBox}>
            <View style={s.infoIcon}>
              <Text style={s.infoIconText}>i</Text>
            </View>
            <Text style={s.infoText}>
              Nous te demanderons jusqu'à {count} fois dans la journée si tu as fumé.
            </Text>
          </View>
        </View>

        {/* Card : répartition */}
        <View style={s.card}>
          <View style={s.repRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Répartition automatique</Text>
              <Text style={s.cardSub}>
                Les notifications seront réparties automatiquement et de manière équilibrée tout au long de la journée.
              </Text>
            </View>
            <Switch
              value={autoRep}
              onValueChange={setAutoRep}
              trackColor={{ false: colors.grayBorder, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <Text style={s.aperçuTitle}>Aperçu des horaires</Text>
          <View style={s.chipsRow}>
            {horaires.map((h, i) => (
              <View key={i} style={s.chip}>
                <Text style={s.chipText}>🔔 {h.label}</Text>
              </View>
            ))}
          </View>
          <Text style={s.aperçuSub}>Les horaires s'adaptent automatiquement à tes réglages.</Text>

          {tipVisible && (
            <View style={s.tipBox}>
              <View style={s.tipLeft}>
                <View style={s.tipIconCircle}>
                  <Text style={s.tipIcon}>🕐</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tipTitle}>Conseil</Text>
                  <Text style={s.tipText}>{tip[count]}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setTipVisible(false)}>
                <Text style={s.tipClose}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bouton enregistrer */}
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={s.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>

        {/* Rows */}
        <View style={s.rowsCard}>
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => navigation.navigate('PersonnaliserHoraires', { count })}>
            <Text style={s.rowIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Personnaliser les horaires</Text>
              <Text style={s.rowSub}>Choisir des horaires spécifiques</Text>
            </View>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>

          <View style={s.divider} />

          <TouchableOpacity style={s.row} onPress={handleDesactiver} activeOpacity={0.7}>
            <Text style={s.rowIcon}>🔕</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowTitle, { color: colors.red }]}>Désactiver les notifications</Text>
              <Text style={s.rowSub}>Ne plus recevoir de rappels</Text>
            </View>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#F5F5F5' },
  scroll:       { padding: spacing.md, paddingBottom: 40 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  backBtn:      { width: 36, alignItems: 'flex-start' },
  backArrow:    { fontSize: 28, color: colors.black, lineHeight: 32 },
  headerTitle:  { flex: 1, fontSize: 22, fontWeight: '800', color: colors.black },
  bellCircle:   { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  bellEmoji:    { fontSize: 20 },

  subtitle:     { fontSize: font.sm, color: colors.gray, marginBottom: spacing.md, lineHeight: 21 },

  card:         { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitle:    { fontSize: font.md, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },
  cardSub:      { fontSize: 13, color: colors.gray, lineHeight: 19, marginTop: 2, marginRight: spacing.sm },

  counterRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginVertical: spacing.sm },
  counterBtn:   { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  counterBtnDisabled: { backgroundColor: colors.grayLight },
  counterBtnText: { fontSize: 24, color: colors.primary, fontWeight: '300', lineHeight: 28 },
  counterBtnTextDisabled: { color: colors.gray },
  counterNum:   { fontSize: 52, fontWeight: '800', color: colors.primary, lineHeight: 60, minWidth: 60, textAlign: 'center' },
  counterLabel: { fontSize: 13, color: colors.gray, textAlign: 'center', marginBottom: spacing.sm },

  infoBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.xs },
  infoIcon:     { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoIconText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  infoText:     { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 19 },

  repRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  aperçuTitle:  { fontSize: 14, fontWeight: '600', color: colors.black, marginBottom: spacing.sm },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip:         { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  chipText:     { fontSize: 13, color: colors.primary, fontWeight: '600' },
  aperçuSub:    { fontSize: 12, color: colors.gray, marginBottom: spacing.sm },

  tipBox:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.xs },
  tipLeft:      { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, flex: 1 },
  tipIconCircle:{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tipIcon:      { fontSize: 15 },
  tipTitle:     { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  tipText:      { fontSize: 12, color: colors.primary, lineHeight: 17 },
  tipClose:     { fontSize: 14, color: colors.gray, paddingLeft: spacing.sm },

  saveBtn:      { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  saveBtnText:  { color: colors.white, fontSize: font.md, fontWeight: '700' },

  rowsCard:     { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  rowIcon:      { fontSize: 20 },
  rowTitle:     { fontSize: font.sm, fontWeight: '600', color: colors.black },
  rowSub:       { fontSize: 12, color: colors.gray, marginTop: 2 },
  rowArrow:     { fontSize: 22, color: colors.gray },
  divider:      { height: 0.5, backgroundColor: colors.grayBorder, marginLeft: spacing.md + 20 + spacing.sm },
});
