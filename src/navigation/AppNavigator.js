import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useUser } from '../context/UserContext';
import { colors } from '../theme';

import AuthScreen       from '../screens/AuthScreen';
import PaywallScreen    from '../screens/PaywallScreen';
import WelcomeScreen    from '../screens/onboarding/WelcomeScreen';
import RegisterScreen   from '../screens/onboarding/RegisterScreen';
import LoginScreen      from '../screens/onboarding/LoginScreen';
import Step1Screen      from '../screens/onboarding/Step1Screen';
import Step2Screen      from '../screens/onboarding/Step2Screen';
import Step3Screen      from '../screens/onboarding/Step3Screen';
import Step4Screen      from '../screens/onboarding/Step4Screen';
import Step5Screen      from '../screens/onboarding/Step5Screen';
import Step6Screen      from '../screens/onboarding/Step6Screen';
import Step7Screen      from '../screens/onboarding/Step7Screen';
import PaywallScreen    from '../screens/onboarding/PaywallScreen';

// ── App principale (tabs) ──────────────────────────────────────────────────
import MainTabNavigator from './MainTabNavigator';
import JaiFumeScreen          from '../screens/JaiFumeScreen';
import ModifierObjectifScreen from '../screens/ModifierObjectifScreen';
import UniteMonnaieScreen     from '../screens/UniteMonnaieScreen';
import NousContacterScreen    from '../screens/NousContacterScreen';

const AppTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#FFFFFF' },
};

const Stack = createNativeStackNavigator();

export default function AppNavigator({ navigationRef }) {
  const { profile, loading, firebaseUser } = useUser();

  // Spinner pendant la vérification auth + chargement profil
  if (loading || firebaseUser === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Non connecté → écran d'auth Firebase
  if (!firebaseUser) {
    return (
      <NavigationContainer theme={AppTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  const initialRoute = profile?.onboardingComplete ? 'MainTabs' : 'Welcome';

  return (
    <NavigationContainer theme={AppTheme} ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {/* ── Onboarding ── */}
        <Stack.Screen name="Welcome"   component={WelcomeScreen} />
        <Stack.Screen name="Register"  component={RegisterScreen} />
        <Stack.Screen name="Login"     component={LoginScreen} />
        <Stack.Screen name="Step1"     component={Step1Screen} />
        <Stack.Screen name="Step2"     component={Step2Screen} />
        <Stack.Screen name="Step3"     component={Step3Screen} />
        <Stack.Screen name="Step4"     component={Step4Screen} />
        <Stack.Screen name="Step5"     component={Step5Screen} />
        <Stack.Screen name="Step6"     component={Step6Screen} />
        <Stack.Screen name="Step7"     component={Step7Screen} />
        <Stack.Screen name="Paywall"   component={PaywallScreen} />

        {/* ── App principale (Bottom Tabs) ── */}
        <Stack.Screen name="MainTabs"  component={MainTabNavigator} />

        {/* ── Écrans modaux / stack au-dessus des tabs ── */}
        <Stack.Screen name="JaiFume"          component={JaiFumeScreen}          options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ModifierObjectif" component={ModifierObjectifScreen} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="UniteMonnaie"     component={UniteMonnaieScreen}     options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="NousContacter"    component={NousContacterScreen}    options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Paywall"           component={PaywallScreen}           options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
