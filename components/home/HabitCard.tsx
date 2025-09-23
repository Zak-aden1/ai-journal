import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface Habit {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  streak: number;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time?: string;
}

interface HabitCardProps {
  habit: Habit;
  isHolding: boolean;
  progressRef: Animated.Value;
  cardAnimation: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
  onLongPress?: () => void;
}

export const HabitCard = React.memo(function HabitCard({
  habit,
  isHolding,
  progressRef,
  cardAnimation,
  onPressIn,
  onPressOut,
  onLongPress
}: HabitCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return theme.colors.status?.success || '#22C55E';
      case 'medium': return theme.colors.status?.warning || '#FFA500';
      case 'hard': return theme.colors.status?.error || '#FF6B6B';
      default: return theme.colors.primary;
    }
  };

  return (
    <Animated.View
      style={{
        opacity: cardAnimation,
        transform: [
          {
            translateY: cardAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
          {
            scale: cardAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={[
          styles.habitCard,
          habit.completed && styles.habitCardCompleted,
          isHolding && styles.habitCardHolding,
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        disabled={habit.completed}
      >
        {/* Progress Overlay for Hold */}
        {isHolding && (
          <Animated.View
            style={[
              styles.holdProgressOverlay,
              {
                width: progressRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        )}

        <View style={styles.habitContent}>
          <View style={styles.habitMain}>
            <View style={styles.habitIcon}>
              <Text style={styles.habitEmoji}>{habit.emoji}</Text>
              {habit.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedCheck}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.habitInfo}>
              <Text style={[
                styles.habitName,
                habit.completed && styles.habitNameCompleted,
              ]}>
                {habit.name}
              </Text>
              {habit.description && (
                <Text style={styles.habitDescription}>
                  {habit.description}
                </Text>
              )}
              <View style={styles.habitMeta}>
                {habit.time && (
                  <Text style={styles.habitTime}>🕐 {habit.time}</Text>
                )}
                <View style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(habit.difficulty) + '20' }
                ]}>
                  <Text style={[
                    styles.difficultyText,
                    { color: getDifficultyColor(habit.difficulty) }
                  ]}>
                    {habit.difficulty}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.habitStats}>
            <Text style={styles.streakText}>
              🔥 {habit.streak}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const createStyles = (theme: any) => StyleSheet.create({
  habitCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 14,
    padding: theme.spacing.md,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  habitCardCompleted: {
    backgroundColor: theme.colors.status?.success + '10' || '#22C55E10',
    borderWidth: 1,
    borderColor: theme.colors.status?.success + '30' || '#22C55E30',
  },
  habitCardHolding: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  holdProgressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: theme.colors.primary + '20',
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  habitEmoji: {
    fontSize: 20,
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.status?.success || '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheck: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  habitNameCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  habitDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  habitTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  habitStats: {
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});