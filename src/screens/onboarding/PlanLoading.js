import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import Klop from '../../components/Klop';

// Écran « Création de ton plan… » entre le niveau de motivation et le résumé :
// Klop au centre d'un anneau qui se remplit jusqu'à 100 %, puis on enchaîne.
const FILL_MS = 4400;
const HOLD_MS = 500;
const R = 70;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function PlanLoading({ onDone }) {
  const { t } = useTranslation('onboardingFlow');
  const progress = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let timer;
    let alive = true;
    const id = progress.addListener(({ value }) => setPct(Math.round(value * 100)));
    const float = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));

    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduce => {
      if (!alive) return;
      if (reduce) {
        progress.setValue(1);
        timer = setTimeout(() => doneRef.current?.(), 1500);
        return;
      }
      float.start();
      Animated.timing(progress, {
        toValue: 1, duration: FILL_MS, easing: Easing.bezier(0.4, 0.1, 0.3, 1), useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) timer = setTimeout(() => doneRef.current?.(), HOLD_MS);
      });
    });

    return () => {
      alive = false;
      clearTimeout(timer);
      progress.removeListener(id);
      progress.stopAnimation();
      float.stop();
    };
  }, []);

  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });
  const lift = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <View style={s.wrap} accessible accessibilityLiveRegion="polite" accessibilityLabel={t('planLoading.a11y', { pct })}>
      <View style={s.ring}>
        <Svg width={170} height={170} viewBox="0 0 160 160" style={s.ringSvg}>
          <Circle cx={80} cy={80} r={R} stroke="#DDF5E8" strokeWidth={11} fill="none" />
          <AnimatedCircle
            cx={80} cy={80} r={R} stroke="#0AA85B" strokeWidth={11} strokeLinecap="round" fill="none"
            strokeDasharray={`${CIRC} ${CIRC}`} strokeDashoffset={dashOffset}
          />
        </Svg>
        <View style={s.mid}>
          <Animated.View style={{ transform: [{ translateY: lift }] }}>
            <Klop width={74} />
          </Animated.View>
          <Text style={s.pct}>{pct} %</Text>
        </View>
      </View>
      <Text style={s.title}>{t('planLoading.title')}</Text>
      <Text style={s.subtitle}>{t('planLoading.subtitle')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 100 },
  ring: { width: 170, height: 170, marginBottom: 28 },
  ringSvg: { transform: [{ rotate: '-90deg' }] },
  mid: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pct: { fontFamily: 'DejaVuSans-Bold', fontSize: 15, color: '#0AA85B', marginTop: 2, fontVariant: ['tabular-nums'] },
  title: { fontFamily: 'DejaVuSans-Bold', fontSize: 25, color: '#0B5135', textAlign: 'center', lineHeight: 32 },
  subtitle: { fontFamily: 'DejaVuSans', fontSize: 15, color: '#4B6358', textAlign: 'center', lineHeight: 22, marginTop: 10 },
});
