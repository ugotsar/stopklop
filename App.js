import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <UserProvider>
        <AppNavigator navigationRef={navigationRef} />
      </UserProvider>
    </I18nextProvider>
  );
}
