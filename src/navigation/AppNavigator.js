import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useUser } from '../context/UserContext';
import { colors } from '../theme';

import AuthScreen            from '../screens/AuthScreen';
import PaywallProScreen      from '../screens/PaywallScreen';
import OnboardingPaywall     from '../screens/onboarding/PaywallScreen';
import OnboardingFlow        from '../screens/onboarding/OnboardingFlow';

// ── App principale (tabs) ──────────────────────────────────────────────────
import MainTabNavigator from './MainTabNavigator';
import JaiFumeScreen           from '../screens/JaiFumeScreen';
import ModifierObjectifScreen  from '../screens/ModifierObjectifScreen';
import UniteMonnaieScreen      from '../screens/UniteMonnaieScreen';
import NousContacterScreen     from '../screens/NousContacterScreen';
import CentreAideScreen        from '../screens/CentreAideScreen';
import JournalEnviesScreen     from '../screens/JournalEnviesScreen';
import NotificationsScreen          from '../screens/NotificationsScreen';
import PersonnaliserHorairesScreen  from '../screens/PersonnaliserHorairesScreen';
import MentionsLegalesScreen        from '../screens/MentionsLegalesScreen';
import { isPaywallBypassEnabled } from '../services/purchases';
import { IS_DEMO_BUILD } from '../config/demoMode';

const AppTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#FFFFFF' },
};

const Stack = createNativeStackNavigator();

export default function AppNavigator({ navigationRef }) {
  const { profile, loading, firebaseUser, subscription } = useUser();
  const paywallBypassEnabled = isPaywallBypassEnabled();

  // Spinner pendant la vérification de l'état de connexion.
  if (loading || firebaseUser === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Aucun compte actif : l'utilisateur choisit explicitement Google, Apple ou
  // le mode invité. Cela évite la recréation silencieuse d'un compte anonyme
  // après la suppression d'un compte.
  // En mode démo, il n'y a jamais de compte réel : on saute directement
  // à l'app (le profil type est déjà chargé localement, voir UserContext).
  if (firebaseUser === null && !IS_DEMO_BUILD) {
    return (
      <NavigationContainer theme={AppTheme} ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Tant que l'onboarding n'est pas fini, seul son propre parcours est
  // accessible. Le paywall peut ouvrir les mentions légales, mais pas les tabs.
  if (!profile?.onboardingComplete) {
    return (
      <NavigationContainer theme={AppTheme} ref={navigationRef}>
        <Stack.Navigator key="onboarding" initialRouteName="Onboarding" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Onboarding" component={OnboardingFlow} />
          <Stack.Screen name="Paywall" component={OnboardingPaywall} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="MentionsLegales" component={MentionsLegalesScreen} options={{ animation: 'slide_from_right' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // L'entitlement est interrogé avant d'afficher l'app : un abonnement ne peut
  // plus être contourné par un simple navigation.navigate('MainTabs').
  if (subscription.loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!subscription.isPro && !paywallBypassEnabled) {
    return (
      <NavigationContainer theme={AppTheme} ref={navigationRef}>
        <Stack.Navigator key="subscription-required" initialRouteName="Paywall" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Paywall" component={OnboardingPaywall} />
          <Stack.Screen name="MentionsLegales" component={MentionsLegalesScreen} options={{ animation: 'slide_from_right' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={AppTheme} ref={navigationRef}>
      <Stack.Navigator
        key="pro-app"
        initialRouteName="MainTabs"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {/* ── App principale (Bottom Tabs) ── */}
        <Stack.Screen name="MainTabs"  component={MainTabNavigator} />

        {/* ── Écrans modaux / stack au-dessus des tabs ── */}
        <Stack.Screen name="JaiFume"          component={JaiFumeScreen}          options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ModifierObjectif" component={ModifierObjectifScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="UniteMonnaie"     component={UniteMonnaieScreen}     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="NousContacter"    component={NousContacterScreen}    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="CentreAide"       component={CentreAideScreen}       options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="JournalEnvies"    component={JournalEnviesScreen}    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Notifications"          component={NotificationsScreen}         options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="PersonnaliserHoraires"  component={PersonnaliserHorairesScreen}  options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="PaywallPro"       component={PaywallProScreen}       options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="MentionsLegales"  component={MentionsLegalesScreen}  options={{ animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
