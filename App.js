import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n, { initI18n } from './src/i18n';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';
import {
  initialiserNotifications,
  nettoyerNotifications,
} from './src/services/notifications';
import { prechargerSons, libererSons } from './src/services/sounds';
import { colors } from './src/theme';

// ── Cadre "téléphone" sur web ────────────────────────────────────────────────
// Sur navigateur desktop, la fenêtre est bien plus large qu'un téléphone : sans
// contrainte, l'app s'étire sur toute la largeur et les tailles fixes (pensées
// pour ~375-430px) paraissent démesurées et se font couper à l'écran. On centre
// donc l'app dans une colonne de largeur mobile sur web uniquement — aucun effet
// sur les builds natifs iOS/Android.
function WebFrame({ children }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#E5E3D8' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430, backgroundColor: colors.cream }}>
        {children}
      </View>
    </View>
  );
}

export default function App() {
  const navigationRef = useRef(null);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    prechargerSons();
    initialiserNotifications(navigationRef);

    return () => {
      nettoyerNotifications();
      libererSons();
    };
  }, []);

  if (!i18nReady) {
    return (
      <WebFrame>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </WebFrame>
    );
  }

  return (
    <WebFrame>
      <I18nextProvider i18n={i18n}>
        <UserProvider>
          <AppNavigator navigationRef={navigationRef} />
        </UserProvider>
      </I18nextProvider>
    </WebFrame>
  );
}
