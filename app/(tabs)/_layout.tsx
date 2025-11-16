import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: isDarkMode ? '#999999' : '#666666',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          borderTopWidth: isDarkMode ? 0 : 1,
          borderTopColor: isDarkMode ? 'transparent' : '#E5E5E5',
          elevation: isDarkMode ? 0 : 8,
          shadowOpacity: isDarkMode ? 0.1 : 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -2 },
          shadowColor: isDarkMode ? '#000000' : '#000000',
          height: 90,
          paddingBottom: 25,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Fasting',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={28} 
              name={focused ? "time" : "time-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={28} 
              name={focused ? "bar-chart" : "bar-chart-outline"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              size={28} 
              name={focused ? "person" : "person-outline"} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
