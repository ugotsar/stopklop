import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Switch, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadow } from '../theme';
import { UI } from '../assets/uiKit';
import {
  demanderPermissionNotifications,
  annulerToutesNotifications,
} from '../services/notifications';
import * as Notifications from 'expo-notifications';
import i18n from '../i18n';

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
    { title: i18n.t('notifications:screen.messages.morning.title'),       body: i18n.t('notifications:screen.messages.morning.body') },
    { title: i18n.t('notifications:screen.messages.afternoon.title'),     body: i18n.t('notifications:screen.messages.afternoon.body') },
    { title: i18n.t('notifications:screen.messages.evening.title'),       body: i18n.t('notifications:screen.messages.evening.body') },
    { title: i18n.t('notifications:screen.messages.encouragement.title'), body: i18n.t('notifications:screen.messages.encouragement.body') },
    { title: i18n.t('notifications:screen.messages.midday.title'),        body: i18n.t('notifications:screen.messages.midday.body') },
    { title: i18n.t('notifications:screen.messages.night.title'),         body: i18n.t('notifications:screen.messages.night.body') },
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
  const { t } = useTranslation('notifications');
  const [count, setCount]         = useState(3);
  const [autoRep, setAutoRep]     = useState(true);
  const [tipVisible, setTipVisible] = useState(true);
  const horaires = computeHoraires(count);

  const tip = t('screen.tips', { returnObjects: true });

  function decrement() { setCount(c => Math.max(MIN_NOTIFS, c - 1)); setTipVisible(true); }
  function increment() { setCount(c => Math.min(MAX_NOTIFS, c + 1)); setTipVisible(true); }

  async function handleSave() {
    const ok = await demanderPermissionNotifications();
    if (!ok) {
      Alert.alert(t('screen.alerts.permissionDeniedTitle'), t('screen.alerts.permissionDeniedBody'));
      return;
    }
    await programmerNotifsDynamiques(count);
    Alert.alert(t('screen.alerts.savedTitle'), t('screen.alerts.savedBody', { count }));
  }

  async function handleDesactiver() {
    Alert.alert(
      t('screen.alerts.disableConfirmTitle'),
      t('screen.alerts.disableConfirmBody'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('screen.alerts.disableButton'), style: 'destructive',
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
        <Text style={s.headerTitle}>{t('screen.headerTitle')}</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.subtitle}>
          {t('screen.subtitle')}
        </Text>

        {/* Card : nombre */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t('screen.countCard.title')}</Text>
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
          <Text style={s.counterLabel}>{t('screen.countCard.unitLabel')}</Text>

          <View style={s.infoBox}>
            <Image source={UI.information} style={s.infoIllus} resizeMode="contain" />
            <Text style={s.infoText}>
              {t('screen.countCard.infoText', { count })}
            </Text>
          </View>
        </View>

        {/* Card : répartition */}
        <View style={s.card}>
          <View style={s.repRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{t('screen.distributionCard.title')}</Text>
              <Text style={s.cardSub}>
                {t('screen.distributionCard.sub')}
              </Text>
            </View>
            <Switch
              value={autoRep}
              onValueChange={setAutoRep}
              trackColor={{ false: colors.grayBorder, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <Text style={s.aperçuTitle}>{t('screen.distributionCard.previewTitle')}</Text>
          <View style={s.chipsRow}>
            {horaires.map((h, i) => (
              <View key={i} style={s.chip}>
                <Image source={UI.cloche_rappel} style={s.chipIllus} resizeMode="contain" />
                <Text style={s.chipText}>{h.label}</Text>
              </View>
            ))}
          </View>
          <Text style={s.aperçuSub}>{t('screen.distributionCard.previewSub')}</Text>

          {tipVisible && (
            <View style={s.tipBox}>
              <View style={s.tipLeft}>
                <Image source={UI.reveil_conseil} style={s.tipIllus} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={s.tipTitle}>{t('screen.tipLabel')}</Text>
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
          <Text style={s.saveBtnText}>{t('screen.saveButton')}</Text>
        </TouchableOpacity>

        {/* Rows */}
        <View style={s.rowsCard}>
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => navigation.navigate('PersonnaliserHoraires', { count })}>
            <Image source={UI.cloche_reglages} style={s.rowIllus} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{t('screen.rows.customizeTitle')}</Text>
              <Text style={s.rowSub}>{t('screen.rows.customizeSub')}</Text>
            </View>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>

          <View style={s.divider} />

          <TouchableOpacity style={s.row} onPress={handleDesactiver} activeOpacity={0.7}>
            <Image source={UI.cloche_desactivee} style={s.rowIllus} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={[s.rowTitle, { color: colors.red }]}>{t('screen.rows.disableTitle')}</Text>
              <Text style={s.rowSub}>{t('screen.rows.disableSub')}</Text>
            </View>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.cream },
  scroll:       { padding: spacing.md, paddingBottom: 40 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  backBtn:      { width: 36, alignItems: 'flex-start' },
  backArrow:    { fontSize: 28, color: colors.primaryDeep, lineHeight: 32 },
  headerTitle:  { flex: 1, fontSize: 22, fontWeight: '900', color: colors.primaryDeep, textAlign: 'center' },

  subtitle:     { fontSize: font.sm, color: colors.gray, marginBottom: spacing.md, lineHeight: 21 },

  card:         { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.grayBorder, ...shadow.card },
  cardTitle:    { fontSize: font.md, fontWeight: '800', color: colors.primaryDeep, marginBottom: spacing.sm },
  cardSub:      { fontSize: 13, color: colors.gray, lineHeight: 19, marginTop: 2, marginRight: spacing.sm },

  counterRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginVertical: spacing.sm },
  counterBtn:   { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  counterBtnDisabled: { backgroundColor: colors.grayLight },
  counterBtnText: { fontSize: 24, color: colors.primaryDeep, fontWeight: '300', lineHeight: 28 },
  counterBtnTextDisabled: { color: colors.gray },
  counterNum:   { fontSize: 52, fontWeight: '900', color: colors.primaryDeep, lineHeight: 60, minWidth: 60, textAlign: 'center' },
  counterLabel: { fontSize: 13, color: colors.gray, textAlign: 'center', marginBottom: spacing.sm },

  infoBox:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.xs },
  infoIllus:    { width: 28, height: 28 },
  infoText:     { flex: 1, fontSize: 13, color: colors.primaryDeep, lineHeight: 19 },

  repRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  aperçuTitle:  { fontSize: 14, fontWeight: '700', color: colors.primaryDeep, marginBottom: spacing.sm },
  chipsRow:     { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  chip:         {
    flex: 1, alignItems: 'center', backgroundColor: colors.primaryLight,
    borderRadius: radius.lg, paddingVertical: 14, gap: 6,
  },
  chipIllus:    { width: 30, height: 30 },
  chipText:     { fontSize: 14, color: colors.primaryDeep, fontWeight: '800' },
  aperçuSub:    { fontSize: 12, color: colors.gray, marginBottom: spacing.sm },

  tipBox:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.xs },
  tipLeft:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  tipIllus:     { width: 34, height: 34 },
  tipTitle:     { fontSize: 13, fontWeight: '700', color: colors.primaryDeep, marginBottom: 2 },
  tipText:      { fontSize: 12, color: colors.primaryDeep, lineHeight: 17 },
  tipClose:     { fontSize: 14, color: colors.gray, paddingLeft: spacing.sm },

  saveBtn:      { backgroundColor: colors.primary, borderRadius: radius.pill, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md, ...shadow.card },
  saveBtnText:  { color: colors.white, fontSize: font.md, fontWeight: '700' },

  rowsCard:     { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.grayBorder, ...shadow.card },
  row:          { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  rowIllus:     { width: 36, height: 36 },
  rowTitle:     { fontSize: font.sm, fontWeight: '700', color: colors.black },
  rowSub:       { fontSize: 12, color: colors.gray, marginTop: 2 },
  rowArrow:     { fontSize: 22, color: colors.gray },
  divider:      { height: 0.5, backgroundColor: colors.grayBorder, marginLeft: spacing.md + 36 + spacing.sm },
});
