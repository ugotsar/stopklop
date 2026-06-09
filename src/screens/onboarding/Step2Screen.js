import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, PanResponder, Dimensions,
} from 'react-native';
import { colors, spacing, font, radius } from '../../theme';
import StepHeader from '../../components/StepHeader';
import PrimaryButton from '../../components/PrimaryButton';
import FreeTextCard from '../../components/FreeTextCard';

const TRACK_PADDING = 16; // padding horizontal inside the slider track area

function NativeSlider({ min, max, value, onValueChange }) {
  const trackWidth = useRef(0);
  const pct = (value - min) / (max - min);

  const clampedPct = Math.min(Math.max(pct, 0), 1);

  function computeValue(locationX) {
    if (trackWidth.current === 0) return;
    const ratio = Math.min(Math.max(locationX / trackWidth.current, 0), 1);
    const raw = min + ratio * (max - min);
    const rounded = Math.round(raw * 2) / 2;
    onValueChange(Math.min(Math.max(rounded, min), max));
  }

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => computeValue(e.nativeEvent.locationX),
    onPanResponderMove: (e) => computeValue(e.nativeEvent.locationX),
  })).current;

  return (
    <View
      style={sliderStyles.trackArea}
      onLayout={e => { trackWidth.current = e.nativeEvent.layout.width; }}
      {...responder.panHandlers}
    >
      {/* Background track */}
      <View style={sliderStyles.trackBg} pointerEvents="none">
        <View style={[sliderStyles.trackFill, { width: `${clampedPct * 100}%` }]} />
      </View>
      {/* Thumb */}
      <View
        style={[sliderStyles.thumb, { left: `${clampedPct * 100}%` }]}
        pointerEvents="none"
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  trackArea: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    height: 6,
    backgroundColor: colors.grayBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginLeft: -12,
    top: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

const PRESETS = [8, 10, 11.5, 13];

export default function Step2Screen({ navigation, route }) {
  const [selected, setSelected] = useState(11.5);
  const [sliderVal, setSliderVal] = useState(11.5);
  const [freeValue, setFreeValue] = useState('');

  const displayPrice = freeValue ? parseFloat(freeValue.replace(',', '.')) || selected : selected;

  function handleContinue() {
    navigation.navigate('Step3', { ...route.params, prixPaquet: displayPrice });
  }

  function formatPrice(p) {
    const str = Number.isInteger(p) ? `${p},00` : String(p).replace('.', ',');
    return `${str} €`;
  }

  function onSliderChange(val) {
    setSliderVal(val);
    setSelected(val);
    setFreeValue('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StepHeader step={2} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Quel est le prix{'\n'}de votre paquet ?</Text>
        <Text style={styles.subtitle}>Entrez le prix que vous payez habituellement.</Text>

        <View style={styles.priceDisplay}>
          <Text style={styles.priceText}>{formatPrice(displayPrice)}</Text>
          <Text style={styles.cigaretteEmoji}>🚬</Text>
        </View>

        <View style={styles.grid}>
          {PRESETS.map(p => {
            const isSelected = p === selected && !freeValue;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                onPress={() => { setSelected(p); setSliderVal(p); setFreeValue(''); }}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View style={styles.checkBadge}><Text style={styles.checkMark}>✓</Text></View>
                )}
                <Text style={[styles.gridText, isSelected && styles.gridTextSelected]}>{formatPrice(p)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slider with labels outside the track */}
        <View style={styles.sliderWrapper}>
          <NativeSlider min={5} max={20} value={sliderVal} onValueChange={onSliderChange} />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>5 €</Text>
            <Text style={styles.sliderLabel}>20 €</Text>
          </View>
        </View>

        <FreeTextCard
          title="Écrire mon propre prix"
          description="Saisissez le prix de votre paquet."
          placeholder="11,50"
          value={freeValue}
          onChangeText={setFreeValue}
          suffix="€"
          keyboardType="decimal-pad"
        />
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
  priceDisplay: { alignItems: 'center', marginBottom: spacing.lg },
  priceText: { fontSize: 52, fontWeight: '800', color: colors.primary, lineHeight: 60 },
  cigaretteEmoji: { fontSize: 28, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  gridCard: {
    width: '47.5%', borderWidth: 1.5, borderColor: colors.grayBorder,
    borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center',
    backgroundColor: colors.white, position: 'relative',
  },
  gridCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  gridText: { fontSize: font.md, fontWeight: '600', color: colors.black },
  gridTextSelected: { color: colors.primary, fontWeight: '800' },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: colors.white, fontSize: 12, fontWeight: '800' },
  sliderWrapper: { marginBottom: spacing.lg },
  sliderLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 6, paddingHorizontal: 4,
  },
  sliderLabel: { fontSize: font.sm, color: colors.gray, fontWeight: '500' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.white },
});
