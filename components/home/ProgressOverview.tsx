import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface SecondaryGoal {
  id: string;
  title: string;
  habitCount: number;
  completedToday: number;
}

interface ProgressOverviewProps {
  secondaryGoals: SecondaryGoal[];
  showSecondaryGoals: boolean;
  onToggleSecondaryGoals: () => void;
  onGoalPress: (goalId: string) => void;
}

export function ProgressOverview({ 
  secondaryGoals, 
  showSecondaryGoals, 
  onToggleSecondaryGoals,
  onGoalPress 
}: ProgressOverviewProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (secondaryGoals.length === 0) {
    return null;
  }

  return (
    <View style={styles.secondaryGoalsContainer}>
      <TouchableOpacity
        style={styles.secondaryGoalsHeader}
        onPress={onToggleSecondaryGoals}
        activeOpacity={0.7}
      >
        <Text style={styles.secondaryGoalsTitle}>
          📊 Other Goals ({secondaryGoals.length})
        </Text>
        <Text style={styles.expandIcon}>{showSecondaryGoals ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {showSecondaryGoals && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {secondaryGoals.map((goal) => (
            <TouchableOpacity 
              key={goal.id} 
              style={styles.secondaryGoalCard}
              onPress={() => onGoalPress(goal.id)}
            >
              <Text style={styles.secondaryGoalTitle}>📋 {goal.title}</Text>
              <Text style={styles.secondaryGoalStats}>
                {goal.completedToday}/{goal.habitCount} completed
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  secondaryGoalsContainer: {
    marginBottom: theme.spacing.lg,
  },
  secondaryGoalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  secondaryGoalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  expandIcon: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  secondaryGoalCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: 4,
    minWidth: 140,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  secondaryGoalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  secondaryGoalStats: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
});