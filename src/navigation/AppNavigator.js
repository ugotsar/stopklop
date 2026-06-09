import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import RegisterScreen from '../screens/onboarding/RegisterScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';
import Step1Screen from '../screens/onboarding/Step1Screen';
import Step2Screen from '../screens/onboarding/Step2Screen';
import Step3Screen from '../screens/onboarding/Step3Screen';
import Step4Screen from '../screens/onboarding/Step4Screen';
import Step5Screen from '../screens/onboarding/Step5Screen';
import Step6Screen from '../screens/onboarding/Step6Screen';
import Step7Screen from '../screens/onboarding/Step7Screen';
import PaywallScreen from '../screens/onboarding/PaywallScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Step1" component={Step1Screen} />
        <Stack.Screen name="Step2" component={Step2Screen} />
        <Stack.Screen name="Step3" component={Step3Screen} />
        <Stack.Screen name="Step4" component={Step4Screen} />
        <Stack.Screen name="Step5" component={Step5Screen} />
        <Stack.Screen name="Step6" component={Step6Screen} />
        <Stack.Screen name="Step7" component={Step7Screen} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
