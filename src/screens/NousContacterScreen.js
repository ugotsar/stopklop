import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../theme';

const SUPPORT_EMAIL = 'ugosimonmailpro34@gmail.com';

const SUJETS = [
  { icon: '👤', key: 'account' },
  { icon: '📊', key: 'tracking' },
  { icon: '€',  key: 'payments' },
  { icon: '❓', key: 'usage' },
  { icon: '💡', key: 'suggestion' },
];

export default function NousContacterScreen({ navigation }) {
  const { t } = useTranslation('nousContacter');
  const [sujet,   setSujet]   = useState(null);
  const [message, setMessage] = useState('');

  async function handleEnvoyer() {
    if (sujet == null) {
      Alert.alert(t('alerts.subjectRequiredTitle'), t('alerts.subjectRequiredBody'));
      return;
    }
    if (message.trim().length < 10) {
      Alert.alert(t('alerts.messageTooShortTitle'), t('alerts.messageTooShortBody'));
      return;
    }
    // Ouvre l'app mail de l'utilisateur avec le message pré-rempli
    const sujetTitre = t(`subjects.${SUJETS[sujet]?.key}.title`, { defaultValue: t('subjectFallback') });
    const url = `mailto:${SUPPORT_EMAIL}`
      + `?subject=${encodeURIComponent(`[Stopklop] ${sujetTitre}`)}`
      + `&body=${encodeURIComponent(message.trim())}`;
    const ok = await Linking.canOpenURL(url).catch(() => false);
    if (ok) {
      await Linking.openURL(url);
      navigation.goBack();
    } else {
      Alert.alert(t('alerts.cantOpenMailTitle'), t('alerts.cantOpenMailBody', { email: SUPPORT_EMAIL }));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('header.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroRow}>
          <View style={styles.heroIconCircle}>
            <Text style={{ fontSize: 32 }}>💬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{t('hero.title')}</Text>
            <Text style={styles.heroSub}>
              {t('hero.subtitle')}
            </Text>
          </View>
        </View>

        {/* Choisir un sujet */}
        <Text style={styles.sectionTitle}>{t('sections.subjectTitle')}</Text>
        <View style={styles.listCard}>
          {SUJETS.map((sub, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.sujetRow,
                i < SUJETS.length - 1 && styles.sujetRowBorder,
                sujet === i && styles.sujetRowActive,
              ]}
              onPress={() => setSujet(i)}
            >
              <View style={[styles.sujetIconCircle, sujet === i && { backgroundColor: colors.primary }]}>
                <Text style={{ fontSize: 18, color: sujet === i ? '#fff' : colors.primary }}>{sub.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sujetTitre}>{t(`subjects.${sub.key}.title`)}</Text>
                <Text style={styles.sujetDesc}>{t(`subjects.${sub.key}.desc`)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zone de message */}
        <Text style={styles.sectionTitle}>{t('sections.messageTitle')}</Text>
        <View style={styles.textAreaCard}>
          <TextInput
            style={styles.textArea}
            placeholder={t('messagePlaceholder')}
            placeholderTextColor={colors.gray}
            multiline
            value={message}
            onChangeText={setMessage}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{t('charCount', { count: message.length })}</Text>
        </View>

        {/* Autres moyens */}
        <View style={styles.autresCard}>
          <View style={styles.autresIconCircle}>
            <Text style={{ fontSize: 22 }}>✉️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.autresTitre}>{t('otherWays.title')}</Text>
            <Text style={styles.autresText}>{t('otherWays.emailLabel')} <Text style={styles.autresLink}>support@stopklop.app</Text></Text>
            <Text style={styles.autresText}>{t('otherWays.responseTimeLabel')} <Text style={styles.autresLink}>{t('otherWays.responseTimeValue')}</Text></Text>
          </View>
        </View>

        {/* Bouton */}
        <TouchableOpacity style={styles.sendBtn} onPress={handleEnvoyer}>
          <Text style={styles.sendBtnText}>{t('send.button')}</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>{t('footer.note')}</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText:    { fontSize: 24, color: colors.black, fontWeight: '300' },
  headerTitle: { fontSize: font.md, fontWeight: '700', color: colors.black },

  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  heroIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: font.lg, fontWeight: '800', color: colors.black, marginBottom: 4 },
  heroSub:   { fontSize: 12, color: colors.gray, lineHeight: 18 },

  sectionTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },

  listCard: {
    backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sujetRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  sujetRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.grayBorder },
  sujetRowActive: { backgroundColor: colors.primaryLight },
  sujetIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  sujetTitre: { fontSize: font.sm, fontWeight: '600', color: colors.black },
  sujetDesc:  { fontSize: 11, color: colors.gray, marginTop: 1 },
  chevron:    { fontSize: 16, color: colors.gray },

  textAreaCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    minHeight: 120,
  },
  textArea:  { fontSize: font.sm, color: colors.black, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.gray, textAlign: 'right', marginTop: 4 },

  autresCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  autresIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  autresTitre: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: 4 },
  autresText:  { fontSize: 12, color: colors.gray, marginTop: 2 },
  autresLink:  { color: colors.primary, fontWeight: '600' },

  sendBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 16, alignItems: 'center', marginBottom: spacing.sm },
  sendBtnText: { color: colors.white, fontSize: font.md, fontWeight: '700' },
  footerNote: { textAlign: 'center', fontSize: 11, color: colors.gray },
});
