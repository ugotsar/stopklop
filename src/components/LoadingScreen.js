import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Klop from './Klop';
import { colors } from '../theme';

// Écran d'attente au lancement : Klop, la marque, et trois points qui
// rebondissent. Remplace la roue grise sur fond blanc, qui donnait
// l'impression que l'app était plantée.
function Dot({ delay }) {
  const saut = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const boucle = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(saut, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(saut, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay(450 - delay),
    ]));
    boucle.start();
    return () => boucle.stop();
  }, [delay, saut]);

  return (
    <Animated.View
      style={[
        s.dot,
        {
          opacity: saut.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
          transform: [{ translateY: saut.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
        },
      ]}
    />
  );
}

export default function LoadingScreen() {
  return (
    <View style={s.wrap}>
      <Klop width={96} />
      <Text style={s.brand}>stopklop</Text>
      <View style={s.dots}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  brand: { fontSize: 22, fontWeight: '900', color: '#0B5135', letterSpacing: -0.4, marginTop: 14 },
  dots: { flexDirection: 'row', gap: 7, marginTop: 20 },
  dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#0AA85B' },
});
