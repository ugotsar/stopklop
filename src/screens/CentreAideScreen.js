import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius } from '../theme';

const FAQ_KEYS = [
  'reductionPlan',
  'cravingButton',
  'lifeGained',
  'moneySaved',
  'exceededGoal',
  'dataSaved',
  'editGoal',
];

export default function CentreAideScreen({ navigation }) {
  const { t } = useTranslation('centreAide');
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('header.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{t('intro')}</Text>

        {FAQ_KEYS.map((key, i) => (
          <TouchableOpacity
            key={key}
            style={styles.faqCard}
            activeOpacity={0.8}
            onPress={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <View style={styles.faqRow}>
              <Text style={styles.faqQ}>{t(`faq.${key}.question`)}</Text>
              <Text style={styles.faqChevron}>{openIdx === i ? '−' : '+'}</Text>
            </View>
            {openIdx === i && <Text style={styles.faqR}>{t(`faq.${key}.answer`)}</Text>}
          </TouchableOpacity>
        ))}

        <View style={styles.contactCard}>
          <Text style={{ fontSize: 22, marginBottom: 4 }}>💬</Text>
          <Text style={styles.contactTitle}>{t('contact.title')}</Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => navigation.navigate('NousContacter')}
          >
            <Text style={styles.contactBtnText}>{t('contact.button')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
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

  intro: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: spacing.sm },

  faqCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  faqRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  faqQ:       { flex: 1, fontSize: 13, fontWeight: '600', color: colors.black, lineHeight: 18 },
  faqChevron: { fontSize: 20, color: colors.primary, fontWeight: '400' },
  faqR:       { fontSize: 12, color: colors.gray, lineHeight: 18, marginTop: spacing.sm },

  contactCard: {
    backgroundColor: colors.primaryLight, borderRadius: radius.xl,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  contactTitle: { fontSize: 13, fontWeight: '600', color: colors.black, marginBottom: spacing.sm, textAlign: 'center' },
  contactBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  contactBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
});
