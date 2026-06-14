import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

const AppTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#FFFFFF' },
};
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useUser } from '../context/UserContext';
import { colors } from '../theme';

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
import DashboardScreen  from '../screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { profile, loading } = useUser();

  // Pendant le chargement du profil AsyncStorage
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Si l'onboarding est déjà terminé → on envoie directement au Dashboard
  const initialRoute = profile?.onboardingComplete ? 'Dashboard' : 'Welcome';

  return (
    <NavigationContainer theme={AppTheme}>
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

        {/* ── App principale ── */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
