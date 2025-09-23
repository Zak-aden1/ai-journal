import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { ParticleEffect } from '@/components/ParticleEffect';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

interface TodaysFocusSectionProps {
  habits: Habit[];
  completedCount: number;
  onHabitToggle: (habitId: string) => Promise<void>;
  onHabitLongPress?: (habit: Habit) => void;
}

export const TodaysFocusSection = React.memo(function TodaysFocusSection({
  habits,
  completedCount,
  onHabitToggle,
  onHabitLongPress
}: TodaysFocusSectionProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [holdingHabit, setHoldingHabit] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef<Map<string, Animated.Value>>(new Map()).current;

  // Sort habits by time, priority, and completion status
  const sortedHabits = React.useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    return [...habits].sort((a, b) => {
      // Completed habits go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // If both have times, sort by proximity to current time
      if (a.time && b.time) {
        const parseTime = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        const aMinutes = parseTime(a.time);
        const bMinutes = parseTime(b.time);
        const currentMinutes = currentHour * 60 + now.getMinutes();
        
        const aDistance = Math.abs(aMinutes - currentMinutes);
        const bDistance = Math.abs(bMinutes - currentMinutes);
        
        return aDistance - bDistance;
      }
      
      // Habits with times come before habits without times
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      
      // Sort by difficulty (easier first)
      const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
  }, [habits]);

  const INITIAL_VISIBLE_HABITS = 5;
  const visibleHabits = showAllHabits ? sortedHabits : sortedHabits.slice(0, INITIAL_VISIBLE_HABITS);
  const remainingHabitsCount = Math.max(0, sortedHabits.length - INITIAL_VISIBLE_HABITS);
  
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
  const progressAnimValue = useRef(new Animated.Value(0)).current;

  // Initialize card animations for all habits
  useEffect(() => {
    habits.forEach((habit, index) => {
      if (!cardAnimations.has(habit.id)) {
        const animValue = new Animated.Value(0);
        cardAnimations.set(habit.id, animValue);

        // Staggered entrance animation
        Animated.timing(animValue, {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [habits, cardAnimations]);

  // Animate progress ring when completedCount changes
  useEffect(() => {
    Animated.spring(progressAnimValue, {
      toValue: progressPercent,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [progressPercent, progressAnimValue]);

  // Layout animation for show/hide more habits
  const toggleShowAllHabits = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setShowAllHabits(!showAllHabits);
  };

  const handleHoldStart = (habitId: string) => {
    if (habits.find(h => h.id === habitId)?.completed) return;
    
    setHoldingHabit(habitId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Start progress animation
    Animated.timing(progressRef, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
    
    // Set completion timer
    holdTimerRef.current = setTimeout(async () => {
      setCompletingHabitId(habitId);
      setShowParticles(true);
      
      // Enhanced completion feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      await onHabitToggle(habitId);
      handleHoldEnd();
    }, 3000);

    // Haptic feedback during hold
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
    }
    hapticIntervalRef.current = setInterval(() => {
      if (holdTimerRef.current) {
        Haptics.selectionAsync();
      } else if (hapticIntervalRef.current) {
        clearInterval(hapticIntervalRef.current);
        hapticIntervalRef.current = null;
      }
    }, 600);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
    setHoldingHabit(null);
    
    // Reset progress animation
    Animated.timing(progressRef, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return theme.colors.status?.success || '#22C55E';
      case 'medium': return theme.colors.status?.warning || '#FFA500';
      case 'hard': return theme.colors.status?.error || '#FF6B6B';
      default: return theme.colors.primary;
    }
  };

  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎯</Text>
        <Text style={styles.emptyTitle}>No habits scheduled for today</Text>
        <Text style={styles.emptySubtitle}>
          Tap the + button to add your first habit
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Today&apos;s Focus/habits</Text>
          <Text style={styles.subtitle}>
            {completedCount}/{totalHabits} completed • {progressPercent}%
          </Text>
        </View>
        
        {/* Enhanced Progress Ring */}
        <View style={styles.progressRing}>
          <View style={styles.progressCircle}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  transform: [{
                    rotate: progressAnimValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]}
            />
            <View style={styles.progressInner}>
              <Animated.Text style={[
                styles.progressText,
                {
                  transform: [{
                    scale: progressAnimValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: [0.8, 1.2],
                      extrapolate: 'clamp',
                    }),
                  }],
                }
              ]}>
                {progressPercent}%
              </Animated.Text>
            </View>
          </View>
        </View>
      </View>

      {/* Habits List */}
      <View style={styles.habitsList}>
        {visibleHabits.map((habit) => {
          const cardAnimation = cardAnimations.get(habit.id) || new Animated.Value(1);

          return (
            <Animated.View
              key={habit.id}
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
                  holdingHabit === habit.id && styles.habitCardHolding,
                ]}
                onPressIn={() => handleHoldStart(habit.id)}
                onPressOut={handleHoldEnd}
                onLongPress={() => onHabitLongPress?.(habit)}
                activeOpacity={0.7}
                disabled={habit.completed}
              >
            {/* Progress Overlay for Hold */}
            {holdingHabit === habit.id && (
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
        })}
        
        {/* Show More/Less Toggle */}
        {remainingHabitsCount > 0 && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleShowAllHabits}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {showAllHabits 
                ? 'Show Less' 
                : `Show ${remainingHabitsCount} More ${remainingHabitsCount === 1 ? 'Habit' : 'Habits'}`
              }
            </Text>
            <Text style={styles.toggleIcon}>
              {showAllHabits ? '↑' : '↓'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Particle Effect */}
      {completingHabitId && (
        <ParticleEffect
          trigger={showParticles}
          onComplete={() => {
            setShowParticles(false);
            setCompletingHabitId(null);
          }}
        />
      )}
    </View>
  );
});

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  progressRing: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderTopColor: theme.colors.primary,
    borderRightColor: theme.colors.primary,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  progressInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  habitsList: {
    gap: theme.spacing.sm,
  },
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
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  toggleIcon: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
