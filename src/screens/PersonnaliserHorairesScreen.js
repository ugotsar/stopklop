import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Alert, Modal,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import { annulerToutesNotifications, demanderPermissionNotifications } from '../services/notifications';
import { colors, spacing, font, radius } from '../theme';

function defaultTimes(count) {
  return Array.from({ length: count }, (_, i) => {
    const debut = 9 * 60;
    const fin   = 21 * 60 + 30;
    const step  = count === 1 ? 0 : (fin - debut) / (count - 1);
    const total = Math.round(debut + i * step);
    return { h: Math.floor(total / 60), m: total % 60 };
  });
}

function pad(n) { return String(n).padStart(2, '0'); }

export default function PersonnaliserHorairesScreen({ navigation, route }) {
  const { t } = useTranslation('personnaliserHoraires');
  const count = route?.params?.count ?? 3;
  const [times, setTimes]         = useState(defaultTimes(count));
  const [editing, setEditing]     = useState(null); // index en cours d'édition
  const [tempH, setTempH]         = useState(9);
  const [tempM, setTempM]         = useState(0);
  const [saving, setSaving]       = useState(false);

  const MESSAGES = [
    { title: t('messages.morning.title'),       body: t('messages.morning.body') },
    { title: t('messages.afternoon.title'),      body: t('messages.afternoon.body') },
    { title: t('messages.evening.title'),        body: t('messages.evening.body') },
    { title: t('messages.encouragement.title'),  body: t('messages.encouragement.body') },
    { title: t('messages.extra.title'),          body: t('messages.extra.body') },
    { title: t('messages.night.title'),          body: t('messages.night.body') },
  ];

  function openPicker(i) {
    setTempH(times[i].h);
    setTempM(times[i].m);
    setEditing(i);
  }

  function confirmTime() {
    const updated = [...times];
    updated[editing] = { h: tempH, m: tempM };
    setTimes(updated);
    setEditing(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const ok = await demanderPermissionNotifications();
      if (!ok) {
        Alert.alert(t('alerts.permissionDeniedTitle'), t('alerts.permissionDeniedBody'));
        return;
      }
      await annulerToutesNotifications();
      for (let i = 0; i < times.length; i++) {
        const msg = MESSAGES[i % MESSAGES.length];
        await Notifications.scheduleNotificationAsync({
          identifier: `stopklop-notif-${i}`,
          content: { title: msg.title, body: msg.body, data: { screen: 'JaiFume' }, sound: true },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: times[i].h,
            minute: times[i].m,
          },
        });
      }
      Alert.alert(
        t('alerts.savedTitle'),
        times.map((time, i) => t('alerts.savedLine', { index: i + 1, time: `${pad(time.h)}:${pad(time.m)}` })).join('\n'),
        [{ text: t('common:ok'), onPress: () => navigation.goBack() }]
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('headerTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.subtitle}>{t('subtitle')}</Text>

        <View style={s.card}>
          {times.map((time, i) => (
            <View key={i}>
              <TouchableOpacity style={s.row} onPress={() => openPicker(i)} activeOpacity={0.7}>
                <View style={s.rowLeft}>
                  <View style={s.numCircle}>
                    <Text style={s.numText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowTitle}>{t('reminderLabel', { index: i + 1 })}</Text>
                    <Text style={s.rowMsg} numberOfLines={1}>{MESSAGES[i % MESSAGES.length].title}</Text>
                  </View>
                </View>
                <View style={s.timeBadge}>
                  <Text style={s.timeText}>{pad(time.h)}:{pad(time.m)}</Text>
                </View>
              </TouchableOpacity>
              {i < times.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <View style={s.infoBox}>
          <Text style={s.infoText}>
            {t('infoText')}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? t('savingButton') : t('saveButton')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de sélection d'heure */}
      <Modal visible={editing !== null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{editing !== null ? t('reminderLabel', { index: editing + 1 }) : ''}</Text>

            <View style={s.pickerRow}>
              {/* Heures */}
              <View style={s.pickerCol}>
                <TouchableOpacity style={s.arrowBtn} onPress={() => setTempH(h => (h + 1) % 24)}>
                  <Text style={s.arrowText}>▲</Text>
                </TouchableOpacity>
                <Text style={s.pickerNum}>{pad(tempH)}</Text>
                <TouchableOpacity style={s.arrowBtn} onPress={() => setTempH(h => (h + 23) % 24)}>
                  <Text style={s.arrowText}>▼</Text>
                </TouchableOpacity>
                <Text style={s.pickerLabel}>{t('picker.hourLabel')}</Text>
              </View>

              <Text style={s.pickerColon}>:</Text>

              {/* Minutes */}
              <View style={s.pickerCol}>
                <TouchableOpacity style={s.arrowBtn} onPress={() => setTempM(m => (m + 5) % 60)}>
                  <Text style={s.arrowText}>▲</Text>
                </TouchableOpacity>
                <Text style={s.pickerNum}>{pad(tempM)}</Text>
                <TouchableOpacity style={s.arrowBtn} onPress={() => setTempM(m => (m + 55) % 60)}>
                  <Text style={s.arrowText}>▼</Text>
                </TouchableOpacity>
                <Text style={s.pickerLabel}>{t('picker.minuteLabel')}</Text>
              </View>
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(null)}>
                <Text style={s.cancelText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={confirmTime}>
                <Text style={s.confirmText}>{t('common:confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F5F5F5' },
  scroll:      { padding: spacing.md, paddingBottom: 40 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  backBtn:     { width: 36, alignItems: 'flex-start' },
  backArrow:   { fontSize: 28, color: colors.black, lineHeight: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.black },

  subtitle:    { fontSize: font.sm, color: colors.gray, marginBottom: spacing.md, lineHeight: 21 },

  card:        { backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  rowLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  numCircle:   { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  numText:     { fontSize: 14, fontWeight: '700', color: colors.primary },
  rowTitle:    { fontSize: font.sm, fontWeight: '600', color: colors.black },
  rowMsg:      { fontSize: 11, color: colors.gray, marginTop: 1 },
  timeBadge:   { backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7 },
  timeText:    { fontSize: 16, fontWeight: '700', color: colors.primary },
  divider:     { height: 0.5, backgroundColor: colors.grayBorder, marginLeft: spacing.md + 32 + 12 },

  infoBox:     { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  infoText:    { fontSize: 13, color: colors.primary, lineHeight: 19 },

  saveBtn:     { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: colors.white, borderRadius: 24, padding: spacing.lg, paddingBottom: 36, margin: spacing.md },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: colors.black, textAlign: 'center', marginBottom: spacing.lg },

  pickerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: spacing.lg },
  pickerCol:    { alignItems: 'center', gap: 4 },
  pickerColon:  { fontSize: 40, fontWeight: '700', color: colors.black, marginBottom: 20 },
  arrowBtn:     { width: 48, height: 40, alignItems: 'center', justifyContent: 'center' },
  arrowText:    { fontSize: 18, color: colors.primary },
  pickerNum:    { fontSize: 52, fontWeight: '800', color: colors.black, lineHeight: 60, minWidth: 70, textAlign: 'center' },
  pickerLabel:  { fontSize: 11, color: colors.gray, textTransform: 'uppercase', letterSpacing: 0.5 },

  modalBtns:    { flexDirection: 'row', gap: spacing.sm },
  cancelBtn:    { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.grayLight, alignItems: 'center' },
  cancelText:   { fontSize: font.sm, fontWeight: '600', color: colors.gray },
  confirmBtn:   { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center' },
  confirmText:  { fontSize: font.sm, fontWeight: '700', color: colors.white },
});
