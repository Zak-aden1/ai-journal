import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { Stack } from 'expo-router';
import { GoalShowcase } from '@/components/GoalShowcase';
import { useTheme } from '@/hooks/useTheme';

export default function TestGoalsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Enhanced Goal Cards",
          headerStyle: { backgroundColor: theme.colors.background.primary },
          headerTintColor: theme.colors.text.primary,
        }} 
      />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="default" />
        <GoalShowcase />
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});