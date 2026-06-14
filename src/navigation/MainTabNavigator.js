import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

import { colors } from '../theme';
import DashboardScreen  from '../screens/DashboardScreen';
import StatistiquesScreen from '../screens/StatistiquesScreen';
import PlanScreen       from '../screens/PlanScreen';
import ProfilScreen      from '../screens/ProfilScreen';

const Tab = createBottomTabNavigator();

// ── Icônes SVG inline ────────────────────────────────────────────────────────

function IconAccueil({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function IconStatistiques({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={12} width={4} height={9} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={10} y={7} width={4} height={14} rx={1} stroke={color} strokeWidth={1.8} />
      <Rect x={17} y={3} width={4} height={18} rx={1} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function IconPlan({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M8 2v4M16 2v4M3 10h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8 14l2.5 2.5L16 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconProfil({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
      <Path
        d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
        stroke={color} strokeWidth={1.8} strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Label personnalisé ────────────────────────────────────────────────────────

function TabLabel({ label, focused }) {
  return (
    <Text style={[styles.label, focused && styles.labelActive]}>
      {label}
    </Text>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <IconAccueil color={color} />,
          tabBarLabel: ({ focused, color }) => <TabLabel label="Accueil" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Statistiques"
        component={StatistiquesScreen}
        options={{
          tabBarIcon: ({ color }) => <IconStatistiques color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Statistiques" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{
          tabBarIcon: ({ color }) => <IconPlan color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Plan" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{
          tabBarIcon: ({ color }) => <IconProfil color={color} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Profil" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#F0F0F0',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9E9E9E',
    marginTop: 2,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
