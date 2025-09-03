import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

export interface Habit {
  id: string;
  name: string;
  description: string;
  time: string;
  completed: boolean;
  streak: number;
  difficulty: 'easy' | 'medium' | 'hard';
  emoji: string;
}

interface HabitsSectionProps {
  habits: Habit[];
  completedTodayCount: number;
  recommendedHabitId?: string;
  holdingHabitId?: string | null;
  progressValue: SharedValue<number>;
  onHabitHoldStart: (habitId: string) => void;
  onHabitHoldEnd: () => void;
}

export function HabitsSection({
  habits,
  completedTodayCount,
  recommendedHabitId,
  holdingHabitId,
  progressValue,
  onHabitHoldStart,
  onHabitHoldEnd
}: HabitsSectionProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const recommendedHabit = habits.find(h => h.id === recommendedHabitId && !h.completed);

  // Recommend-first sorting: incomplete recommended → other incomplete → completed
  const sortedHabits = React.useMemo(() => {
    const copy = [...habits];
    return copy.sort((a, b) => {
      const aRecommended = !a.completed && a.id === recommendedHabitId ? 1 : 0;
      const bRecommended = !b.completed && b.id === recommendedHabitId ? 1 : 0;
      if (aRecommended !== bRecommended) return bRecommended - aRecommended;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Then by time if available ("HH:MM" or "Anytime")
      const timeVal = (t: string) => (t && /^\d{2}:\d{2}$/.test(t) ? parseInt(t.slice(0,2)) * 60 + parseInt(t.slice(3)) : 24*60);
      return timeVal(a.time) - timeVal(b.time);
    });
  }, [habits, recommendedHabitId]);

  // Animated ring style driven by shared progress value
  const ringStyle = useAnimatedStyle(() => {
    const deg = interpolate(progressValue.value, [0, 1], [0, 360]);
    return {
      transform: [{ rotate: `${deg}deg` }],
    };
  }, [progressValue]);

  return (
    <View style={styles.habitsSection}>
      <View style={styles.habitsSectionHeader}>
        <Text style={styles.habitsTitle}>Today&apos;s Habits</Text>
        <View style={styles.dailyProgressContainer}>
          <Text style={styles.progressText}>
            {completedTodayCount} of {habits.length} completed
          </Text>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  width: `${habits.length > 0 ? (completedTodayCount / habits.length) * 100 : 0}%`,
                  backgroundColor: completedTodayCount === habits.length && habits.length > 0 
                    ? theme.colors.status.success 
                    : theme.colors.primary
                }
              ]} 
            />
          </View>
        </View>
      </View>
      
      {/* Next Action Hint */}
      {recommendedHabit && (
        <View style={styles.nextActionHint}>
          <Text style={styles.nextActionText}>
            💫 Up next: <Text style={styles.nextActionHabit}>{recommendedHabit.name}</Text>
          </Text>
        </View>
      )}
      
      <View style={styles.habitsList}>
        {sortedHabits.map((habit) => (
          <TouchableOpacity
            key={habit.id}
            style={[
              styles.habitCard,
              habit.completed && styles.habitCardCompleted,
              recommendedHabitId === habit.id && !habit.completed && styles.habitCardRecommended
            ]}
            onPressIn={() => {
              if (!habit.completed) {
                onHabitHoldStart(habit.id);
                Haptics.selectionAsync();
              }
            }}
            onPressOut={onHabitHoldEnd}
            activeOpacity={habit.completed ? 0.8 : 0.9}
            disabled={habit.completed}
          >
            <View style={styles.habitContent}>
              <View style={styles.habitHeader}>
                <Text style={[styles.habitName, habit.completed && styles.completedText]}>
                  {habit.name}
                </Text>
                <View style={styles.habitTime}>
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={styles.timeText}>{habit.time}</Text>
                </View>
              </View>

              <Text style={[styles.habitDescription, habit.completed && styles.completedText]}>
                {habit.description}
              </Text>

              <View style={styles.habitFooter}>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakNumber}>{habit.streak}</Text>
                </View>
                <Text style={styles.habitStatus}>
                  {habit.completed ? '✓ Done' : 'Hold to complete'}
                </Text>
              </View>
            </View>

            {habit.completed ? (
              <View style={[styles.habitCheckButton, styles.completedButton]}>
                <Text style={styles.completedCheckmark}>✓</Text>
              </View>
            ) : (
              <Animated.View style={styles.habitCheckButton}>
                {holdingHabitId === habit.id ? (
                  <>
                    <Animated.View style={[styles.progressRing, ringStyle]} />
                    <View style={styles.habitCheckIcon} />
                  </>
                ) : (
                  <View style={styles.habitCheckIcon} />
                )}
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  habitsSection: {
    marginBottom: theme.spacing.xl,
  },
  habitsSectionHeader: {
    marginBottom: theme.spacing.lg,
  },
  habitsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.5,
  },
  dailyProgressContainer: {
    marginBottom: theme.spacing.sm,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextActionHint: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  nextActionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  nextActionHabit: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  habitsList: {
    gap: theme.spacing.md,
  },
  habitCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: theme.spacing.md,
  },
  habitCardCompleted: {
    opacity: 0.8,
    backgroundColor: theme.colors.status.success + '15',
    borderWidth: 1,
    borderColor: theme.colors.status.success + '30',
  },
  habitCardRecommended: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  habitContent: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  habitName: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: -0.3,
    flex: 1,
  },
  habitTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  habitDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  habitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: 4,
  },
  habitStatus: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  habitCheckButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  habitCheckIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  completedText: {
    color: theme.colors.status.success,
    opacity: 0.8,
  },
  completedButton: {
    backgroundColor: theme.colors.success || '#22c55e',
  },
  completedCheckmark: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  progressRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: 'white',
  },
});
