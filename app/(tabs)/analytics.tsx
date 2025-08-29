import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { useTheme } from '@/hooks/useTheme';

/**
 * Analytics Tab Screen
 * Provides users with comprehensive insights into their habit patterns and AI-powered analytics
 */

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AnalyticsDashboard />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});