import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Animated, TextInput,
} from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import StepHeader from '../../components/StepHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { saveProfile } from '../../store/onboardingStore';

const DESCRIPTIONS = [
  '', // 0 unused
  "Vous débutez ce chemin. Chaque pas compte.",
  "Vous y pensez. C'est déjà un début.",
  "La motivation grandit en vous.",
  "Vous commencez à y croire.",
  "Vous êtes prêt(e) à vous engager.",
  "Bonne détermination. Continuez !",
  "Vous êtes bien décidé(e).",
  "Votre volonté est forte.",
  "Vous êtes presque inarrêtable !",
  "Vous êtes totalement déterminé(e) ! 🏆",
];

const LEVEL_COLORS = ['','#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#10B981','#14B8A6','#06B6D4','#1B6B3A'];

export default function Step7Screen({ navigation, route }) {
  const [level, setLevel] = useState(5);
  const [freeValue, setFreeValue] = useState('');
  const animScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(animScale, { toValue: 1.12, duration: 150, useNativeDriver: false }),
      Animated.timing(animScale, { toValue: 1, duration: 150, useNativeDriver: false }),
    ]).start();
  }, [level]);

  async function handleFinish() {
    const finalLevel = freeValue ? parseInt(freeValue, 10) || level : level;
    const profile = { ...route.params, niveauMotivation: finalLevel, onboardingComplete: true, createdAt: new Date() };
    await saveProfile(profile);
    navigation.navigate('Paywall');
  }

  const color = LEVEL_COLORS[level];

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={7} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Quel est votre niveau{'\n'}de motivation ?</Text>
        <Text style={styles.subtitle}>Soyez honnête avec vous-même.</Text>

        <Animated.View style={[styles.circleWrap, { transform: [{ scale: animScale }] }]}>
          <View style={[styles.circle, { borderColor: color, shadowColor: color }]}>
            <Text style={[styles.circleNumber, { color }]}>{level}</Text>
            <Text style={styles.circleSub}>/ 10</Text>
          </View>
        </Animated.View>

        <Text style={[styles.description, { color }]}>{DESCRIPTIONS[level]}</Text>

        <View style={styles.selector}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.dot, { backgroundColor: n <= level ? color : colors.grayBorder }]}
              onPress={() => { setLevel(n); setFreeValue(''); }}
              activeOpacity={0.7}
            />
          ))}
        </View>
        <View style={styles.selectorLabels}>
          <Text style={styles.selectorLabel}>Faible</Text>
          <Text style={styles.selectorLabel}>Élevé</Text>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} /><Text style={styles.dividerText}>ou</Text><View style={styles.divider} />
        </View>

        <View style={styles.freeCard}>
          <View style={styles.freeIconCircle}><Text>✏️</Text></View>
          <View style={styles.freeTextBlock}>
            <Text style={styles.freeTitle}>Saisir manuellement</Text>
            <Text style={styles.freeDesc}>Entrez votre niveau de 1 à 10.</Text>
          </View>
          <TextInput
            style={styles.freeInput}
            placeholder="1-10"
            placeholderTextColor={colors.gray}
            value={freeValue}
            onChangeText={v => { setFreeValue(v); const n = parseInt(v, 10); if (n >= 1 && n <= 10) setLevel(n); }}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton title="Terminer →" onPress={handleFinish} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: '800', color: colors.black, textAlign: 'center', lineHeight: 34, marginBottom: spacing.sm },
  subtitle: { fontSize: font.sm, color: colors.gray, textAlign: 'center', marginBottom: spacing.xl },
  circleWrap: { alignItems: 'center', marginBottom: spacing.lg },
  circle: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 20, shadowOpacity: 0.3, elevation: 8,
  },
  circleNumber: { fontSize: 64, fontWeight: '900', lineHeight: 72 },
  circleSub: { fontSize: font.md, color: colors.gray, marginTop: -8 },
  description: { textAlign: 'center', fontSize: font.md, fontWeight: '600', marginBottom: spacing.lg, minHeight: 24 },
  selector: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm, marginBottom: spacing.xs },
  dot: { width: 26, height: 26, borderRadius: 13 },
  selectorLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
  selectorLabel: { fontSize: font.sm, color: colors.gray },
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
  freeDesc: { fontSize: 12, color: colors.gray },
  freeInput: {
    borderWidth: 1.5, borderColor: colors.grayBorder, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: font.lg, fontWeight: '700',
    color: colors.black, minWidth: 60, textAlign: 'center',
  },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.white },
});
