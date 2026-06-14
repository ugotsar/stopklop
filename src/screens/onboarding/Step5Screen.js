import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput,
} from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import { jouerSon } from '../../services/sounds';
import StepHeader from '../../components/StepHeader';
import PrimaryButton from '../../components/PrimaryButton';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_FR = ['L','M','M','J','V','S','D'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  let d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

export default function Step5Screen({ navigation, route }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [freeDate, setFreeDate] = useState('');

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleContinue() {
    jouerSon('onboarding_step');
    let date = selectedDate;
    if (freeDate && freeDate.length === 10) {
      const parts = freeDate.split('/');
      if (parts.length === 3) date = new Date(parts[2], parts[1] - 1, parts[0]);
    }
    navigation.navigate('Step6', { ...route.params, dateArretSouhaitee: date?.toISOString() });
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={5} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Quelle est votre date{"\n"}d'arrêt souhaitée ?</Text>
        <Text style={styles.subtitle}>Choisissez le jour où vous voulez{"\n"}arrêter de fumer.</Text>

        <View style={styles.calendar}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.calArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calMonth}>{MONTHS_FR[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.calArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calDayNames}>
            {DAYS_FR.map((d, i) => (
              <Text key={i} style={styles.calDayName}>{d}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {cells.map((day, i) => {
              if (!day) return <View key={i} style={styles.calCell} />;
              const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getFullYear() === viewYear;
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.calCell}
                  onPress={() => { setSelectedDate(new Date(viewYear, viewMonth, day)); setFreeDate(''); }}
                  activeOpacity={0.7}
                >
                  <View style={isSelected ? styles.calDaySelectedCircle : null}>
                    <Text style={[styles.calDay, isSelected && styles.calDaySelected]}>{day}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} /><Text style={styles.dividerText}>ou</Text><View style={styles.divider} />
        </View>

        <View style={styles.freeCard}>
          <View style={styles.freeIconCircle}><Text>✏️</Text></View>
          <View style={styles.freeTextBlock}>
            <Text style={styles.freeTitle}>Écrire ma propre date</Text>
            <Text style={styles.freeDesc}>Saisissez la date à laquelle vous souhaitez arrêter.</Text>
          </View>
          <View style={styles.dateInputWrap}>
            <TextInput
              style={styles.dateInput}
              placeholder="JJ / MM / AAAA"
              placeholderTextColor={colors.gray}
              value={freeDate}
              onChangeText={setFreeDate}
              keyboardType="number-pad"
              maxLength={10}
            />
            <Text style={styles.calIcon}>📅</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton title="Continuer  →" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: '800', color: colors.black, textAlign: 'center', lineHeight: 34, marginBottom: spacing.sm },
  subtitle: { fontSize: font.sm, color: colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  calendar: { borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.lg, padding: spacing.md },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  calArrow: { fontSize: 26, color: colors.primary, fontWeight: '600', paddingHorizontal: 4 },
  calMonth: { fontSize: font.md, fontWeight: '700', color: colors.black },
  calDayNames: { flexDirection: 'row', marginBottom: spacing.sm },
  calDayName: { flex: 1, textAlign: 'center', fontSize: font.sm, color: colors.gray, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' },
  calCellSelected: { },
  calDaySelectedCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  calDay: { fontSize: font.md, color: colors.black },
  calDaySelected: { color: colors.white, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  divider: { flex: 1, height: 1, backgroundColor: colors.grayBorder },
  dividerText: { marginHorizontal: spacing.md, color: colors.gray, fontSize: font.sm },
  freeCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
  },
  freeIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  freeTextBlock: { flex: 1 },
  freeTitle: { fontSize: font.sm, fontWeight: '700', color: colors.black, marginBottom: 2 },
  freeDesc: { fontSize: 12, color: colors.gray, lineHeight: 16 },
  dateInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8,
    minWidth: 130,
  },
  dateInput: { fontSize: 13, color: colors.black, flex: 1 },
  calIcon: { fontSize: 16 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.white },
});

