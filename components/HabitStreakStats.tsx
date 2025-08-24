import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface HabitStreakStatsProps {
  currentStreak: number;
  longestStreak: number;
  completionRate?: number; // percentage
  totalCompletions?: number;
}

export function HabitStreakStats({ 
  currentStreak, 
  longestStreak, 
  completionRate,
  totalCompletions 
}: HabitStreakStatsProps) {
  const { theme } = useTheme();
  
  const StatItem = ({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) => (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: theme.colors.primary }]}>
        {value}{suffix}
      </Text>
      <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
        {label}
      </Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card || theme.colors.background.secondary }]}>
      <View style={styles.statsRow}>
        <StatItem label="Current Streak" value={currentStreak} suffix="🔥" />
        <StatItem label="Best Streak" value={longestStreak} suffix="⭐" />
        {completionRate !== undefined && (
          <StatItem label="Completion Rate" value={Math.round(completionRate)} suffix="%" />
        )}
        {totalCompletions !== undefined && (
          <StatItem label="Total Days" value={totalCompletions} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});