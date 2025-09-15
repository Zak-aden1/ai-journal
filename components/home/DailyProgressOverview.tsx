import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface DailyProgressOverviewProps {
  completedHabits: number;
  totalHabits: number;
  currentStreak: number;
  todayGoalProgress: number;
  motivationalMessage?: string;
}

export function DailyProgressOverview({
  completedHabits,
  totalHabits,
  currentStreak,
  todayGoalProgress,
  motivationalMessage = "Keep the momentum going!"
}: DailyProgressOverviewProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const progressPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(progressAnimation, {
        toValue: progressPercent,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      })
    ]).start();
  }, [progressPercent]);

  const getProgressColor = () => {
    if (progressPercent >= 80) return theme.colors.status?.success || '#22C55E';
    if (progressPercent >= 50) return theme.colors.status?.warning || '#FFA500';
    return theme.colors.primary;
  };

  const getMotivationalIcon = () => {
    if (progressPercent >= 80) return '🔥';
    if (progressPercent >= 50) return '⚡';
    if (progressPercent > 0) return '💪';
    return '🌅';
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnimation }] }]}>
      {/* Progress Ring */}
      <View style={styles.progressSection}>
        <View style={styles.progressRing}>
          <View style={[styles.progressCircle, { borderColor: theme.colors.background.tertiary }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  borderTopColor: getProgressColor(),
                  borderRightColor: getProgressColor(),
                  transform: [{
                    rotate: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]}
            />
            <View style={styles.progressInner}>
              <Text style={[styles.progressPercent, { color: getProgressColor() }]}>
                {progressPercent}%
              </Text>
              <Text style={styles.progressLabel}>complete</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedHabits}</Text>
            <Text style={styles.statLabel}>completed</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalHabits - completedHabits}</Text>
            <Text style={styles.statLabel}>remaining</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.streakNumber]}>
              {currentStreak}
            </Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
        </View>
      </View>

      {/* Motivational Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.motivationIcon}>{getMotivationalIcon()}</Text>
        <Text style={styles.motivationText}>{motivationalMessage}</Text>
      </View>
    </Animated.View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressRing: {
    marginRight: theme.spacing.lg,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  progressInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  progressLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    lineHeight: 12,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  streakNumber: {
    color: theme.colors.status?.warning || '#FFA500',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.background.tertiary,
    marginHorizontal: theme.spacing.sm,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: theme.spacing.md,
  },
  motivationIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});