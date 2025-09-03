import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FeaturedGoalCarousel } from '@/components/FeaturedGoalCarousel';
import { useTheme } from '@/hooks/useTheme';

interface Goal {
  id: string;
  title: string;
  completedHabits: number;
  totalHabits: number;
  avatar?: {
    type: 'plant' | 'pet' | 'robot' | 'base';
    name: string;
    vitality: number;
  };
}

interface PrimaryGoalSectionProps {
  goals: Goal[];
  primaryGoalId: string | null;
  onGoalPress: (goalId: string) => void;
  insights?: {
    bestTime?: string;
    streakRisk?: 'low' | 'medium' | 'high';
    tip?: string;
  } | null;
}

export function PrimaryGoalSection({ 
  goals, 
  primaryGoalId, 
  onGoalPress, 
  insights 
}: PrimaryGoalSectionProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (goals.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Goal Carousel */}
      <FeaturedGoalCarousel
        goals={goals}
        primaryGoalId={primaryGoalId}
        onGoalPress={onGoalPress}
      />

      {/* AI Insights Card */}
      {insights && (
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsIcon}>🧠</Text>
            <Text style={styles.insightsTitle}>Smart Insights</Text>
          </View>
          
          {insights.bestTime && (
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>🕒 Optimal time:</Text>
              <Text style={styles.insightValue}>{insights.bestTime}</Text>
            </View>
          )}
          
          {insights.streakRisk && (
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>
                {insights.streakRisk === 'high' ? '⚠️' : insights.streakRisk === 'medium' ? '⚡' : '✅'} Streak risk:
              </Text>
              <Text style={[
                styles.insightValue,
                { color: getRiskColor(insights.streakRisk, theme) }
              ]}>
                {insights.streakRisk}
              </Text>
            </View>
          )}
          
          {insights.tip && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>💡 {insights.tip}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const getRiskColor = (risk: string, theme: any) => {
  switch (risk) {
    case 'high': return theme.colors.status?.error || '#FF6B6B';
    case 'medium': return theme.colors.status?.warning || '#FFA500';
    case 'low': return theme.colors.status?.success || '#22C55E';
    default: return theme.colors.text.primary;
  }
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  insightsCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  insightsIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  insightLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
  },
  tipContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
});