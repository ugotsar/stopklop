import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../theme';

const CONTACT_EMAIL = 'ugosimonmailpro34@gmail.com';

// ── Politique de confidentialité et Conditions d'utilisation, affichées
// directement dans l'app (plus besoin de sortir vers un navigateur) — même
// contenu que web/confidentialite.html et web/conditions.html.
export default function MentionsLegalesScreen({ navigation, route }) {
  const { t } = useTranslation('mentionsLegales');
  const type = route?.params?.type === 'terms' ? 'terms' : 'privacy';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t(`${type}.headerTitle`)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t(`${type}.title`)}</Text>
        <Text style={styles.updated}>{t(`${type}.updated`)}</Text>

        {type === 'privacy' ? <PrivacyBody t={t} /> : <TermsBody t={t} />}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact.title')}</Text>
          <Text style={styles.body}>{t('contact.body')}</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
            <Text style={styles.link}>{CONTACT_EMAIL}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyBody({ t }) {
  const rows = t('privacy.dataRows', { returnObjects: true });
  return (
    <>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          <Text style={styles.noticeStrong}>{t('privacy.summaryLabel')} </Text>
          {t('privacy.summaryBody')}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>{t('privacy.dataTitle')}</Text>
      {Array.isArray(rows) && rows.map((row, i) => (
        <View key={i} style={styles.dataRow}>
          <Text style={styles.dataLabel}>{row.label}</Text>
          <Text style={styles.dataReason}>{row.reason}</Text>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('privacy.storageTitle')}</Text>
        <Text style={styles.body}>{t('privacy.storageBody')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('privacy.notDoTitle')}</Text>
        <Text style={styles.body}>{t('privacy.notDoBody')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('privacy.rightsTitle')}</Text>
        <Text style={styles.body}>{t('privacy.rightsBody')}</Text>
      </View>
    </>
  );
}

function TermsBody({ t }) {
  const items = t('terms.subscriptionItems', { returnObjects: true });
  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('terms.purposeTitle')}</Text>
        <Text style={styles.body}>{t('terms.purposeBody')}</Text>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          <Text style={styles.noticeStrong}>{t('terms.healthLabel')} </Text>
          {t('terms.healthBody')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('terms.accountTitle')}</Text>
        <Text style={styles.body}>{t('terms.accountBody')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('terms.subscriptionTitle')}</Text>
        {Array.isArray(items) && items.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={[styles.body, i === items.length - 1 && styles.danger]}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('terms.useTitle')}</Text>
        <Text style={styles.body}>{t('terms.useBody')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('terms.terminationTitle')}</Text>
        <Text style={styles.body}>{t('terms.terminationBody')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('terms.changesTitle')}</Text>
        <Text style={styles.body}>{t('terms.changesBody')}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.cream },
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

  title:   { fontSize: font.lg, fontWeight: '800', color: colors.black, marginTop: spacing.sm },
  updated: { fontSize: 12, color: colors.gray, marginTop: 2, marginBottom: spacing.md },

  notice: {
    backgroundColor: colors.primaryLight, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  noticeText:   { fontSize: 13, color: colors.black, lineHeight: 19 },
  noticeStrong: { fontWeight: '700', color: colors.primaryDeep },

  section:     { marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDeep, marginBottom: 6 },
  body:        { fontSize: 13, color: colors.gray, lineHeight: 19 },
  danger:      { color: '#B42318', fontWeight: '600' },

  dataRow: {
    backgroundColor: colors.white, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: 6,
    borderWidth: 1, borderColor: colors.grayBorder,
  },
  dataLabel:  { fontSize: 13, fontWeight: '700', color: colors.black },
  dataReason: { fontSize: 12, color: colors.gray, marginTop: 2 },

  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bullet:    { fontSize: 13, color: colors.primary, lineHeight: 19 },

  link: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 4 },
});
