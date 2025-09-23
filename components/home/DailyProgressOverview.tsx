import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

interface DailyProgressOverviewProps {
  completedHabits: number;
  totalHabits: number;
  currentStreak: number;
  todayGoalProgress: number;
  motivationalMessage?: string;
}

export const DailyProgressOverview = React.memo(function DailyProgressOverview({
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
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create a more sophisticated animation sequence
    Animated.sequence([
      // Initial scale up
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      // Progress fill with rotation
      Animated.parallel([
        Animated.timing(progressAnimation, {
          toValue: progressPercent,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse animation for high progress
    if (progressPercent >= 80) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
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

  const renderProgressRing = () => {
    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
      <View style={styles.progressRing}>
        <Svg width={size} height={size} style={styles.progressSvg}>
          <Defs>
            <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={getProgressColor()} stopOpacity="1" />
              <Stop offset="100%" stopColor={getProgressColor()} stopOpacity="0.7" />
            </LinearGradient>
          </Defs>

          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.background.tertiary}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <Animated.View>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progressAnimation.interpolate({
                inputRange: [0, 100],
                outputRange: [circumference, 0],
              })}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Animated.View>
        </Svg>

        <Animated.View style={[styles.progressInner, { transform: [{ scale: pulseAnimation }] }]}>
          <Text style={[styles.progressPercent, { color: getProgressColor() }]}>
            {progressPercent}%
          </Text>
          <Text style={styles.progressLabel}>complete</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnimation }] }]}>
      {/* Progress Ring */}
      <View style={styles.progressSection}>
        {renderProgressRing()}

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
});

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
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressInner: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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