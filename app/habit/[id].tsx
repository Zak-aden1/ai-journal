import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import { HabitStreakCalendar } from '@/components/HabitStreakCalendar';
import { HabitEditModal } from '@/components/HabitEditModal';
import { isHabitCompletedOnDate, getHabitCompletions, listScheduledHabitsForGoal, listScheduledStandaloneHabits } from '@/lib/db';

interface HabitData {
  id: string;
  title: string;
  goalId?: string | null;
  goalTitle?: string;
  streak: number;
  completedToday: boolean;
  category: 'health' | 'learning' | 'career' | 'personal';
  isStandalone: boolean;
}

interface HabitStats {
  totalCompletions: number;
  longestStreak: number;
  currentStreak: number;
  successRate: number;
  weeklyCompletions: number;
  monthlyCompletions: number;
}

function categorizeHabit(title: string): 'health' | 'learning' | 'career' | 'personal' {
  const lower = title.toLowerCase();
  if (/(fitness|health|run|exercise|workout|diet|sleep|meditat)/i.test(lower)) return 'health';
  if (/(learn|study|read|course|language|skill|book)/i.test(lower)) return 'learning';
  if (/(career|job|work|business|network|meeting)/i.test(lower)) return 'career';
  return 'personal';
}

const categoryEmojis = {
  health: '💪',
  learning: '📚',
  career: '💼',
  personal: '🌟'
};

export default function HabitDetailPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Get data from store
  const { 
    goalsWithIds, 
    habitsWithIds, 
    standaloneHabits,
    isHydrated,
    getHabitStreak,
    toggleHabitCompletion,
  } = useAppStore();

  const [habit, setHabit] = useState<HabitData | null>(null);
  const [habitStats, setHabitStats] = useState<HabitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [completionData, setCompletionData] = useState<Array<{date: string, completed: boolean, planned?: boolean}>>([]);
  const [weeklyScore, setWeeklyScore] = useState<{completed: number; planned: number}>({ completed: 0, planned: 0 });
  
  const styles = createStyles(theme);
  
  // Animation values
  const progressWidth = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const streakScale = useSharedValue(0.8);
  
  // Helper to load habit data from store
  const loadHabitData = useCallback(async () => {
    setLoading(true);
    try {
      if (!id) {
        setHabit(null);
        setLoading(false);
        return;
      }

      // Find habit in standalone habits first
      let foundHabit = standaloneHabits.find(h => h.id === id);
      let goalId = null;
      let goalTitle = undefined;

      // If not found, search in goal habits
      if (!foundHabit) {
        for (const gId of Object.keys(habitsWithIds)) {
          const goalHabits = habitsWithIds[gId] || [];
          foundHabit = goalHabits.find(h => h.id === id);
          if (foundHabit) {
            goalId = gId;
            const goal = goalsWithIds.find(g => g.id === gId);
            goalTitle = goal?.title;
            break;
          }
        }
      }

      if (!foundHabit) {
        setHabit(null);
        setLoading(false);
        return;
      }

      // Get habit streak and completion data
      const streakData = await getHabitStreak(foundHabit.id);
      const completedToday = await isHabitCompletedOnDate(foundHabit.id);
      
      // Build habit data object
      const habitData: HabitData = {
        id: foundHabit.id,
        title: foundHabit.title,
        goalId,
        goalTitle,
        streak: streakData.current,
        completedToday,
        category: categorizeHabit(foundHabit.title),
        isStandalone: goalId === null,
      };

      setHabit(habitData);

      // Calculate stats (simplified for now)
      const stats: HabitStats = {
        totalCompletions: streakData.total || 0,
        longestStreak: streakData.longest || 0,
        currentStreak: streakData.current,
        successRate: 85, // TODO: Calculate from actual data
        weeklyCompletions: Math.min(streakData.current, 7),
        monthlyCompletions: Math.min(streakData.current, 30),
      };

      setHabitStats(stats);

      // Load schedule for planned days
      let scheduleDays: string[] = [];
      let isDaily = false;
      try {
        if (goalId) {
          const list = await listScheduledHabitsForGoal(goalId);
          const s = list.find(h => h.id === foundHabit!.id);
          if (s) { scheduleDays = s.daysOfWeek || []; isDaily = s.isDaily; }
        } else {
          const list = await listScheduledStandaloneHabits();
          const s = list.find(h => h.id === foundHabit!.id);
          if (s) { scheduleDays = s.daysOfWeek || []; isDaily = s.isDaily; }
        }
      } catch {}

      // Build completion calendar data (last 35 days) from DB
      const completions = await getHabitCompletions(foundHabit.id, 35);
      const plannedFor = (d: Date) => {
        if (isDaily) return true;
        const dow = ['sun','mon','tue','wed','thu','fri','sat'][d.getDay()];
        return scheduleDays.includes(dow);
      };
      const calendarData = completions.map(c => {
        const d = new Date(c.date);
        return { date: c.date, completed: c.completed, planned: plannedFor(d) };
      });
      setCompletionData(calendarData);

      // Weekly score (last 7 days)
      const last7 = calendarData.slice(-7);
      const planned7 = last7.filter(d => d.planned).length || (isDaily ? 7 : scheduleDays.length);
      const done7 = last7.filter(d => d.completed).length;
      setWeeklyScore({ completed: done7, planned: planned7 });

    } catch (error) {
      console.error('Error loading habit data:', error);
      setHabit(null);
    } finally {
      setLoading(false);
    }
  }, [id, standaloneHabits, habitsWithIds, goalsWithIds, getHabitStreak]);

  // Initial load
  useEffect(() => {
    if (!isHydrated || !id) return;
    loadHabitData();
  }, [isHydrated, id, loadHabitData]);

  // Animation effects
  useEffect(() => {
    if (!habit || !habitStats || loading) return;
    
    // Animate streak entrance
    streakScale.value = withSpring(1, { damping: 15 });
    
    // Animate stats
    statsOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    
    // Animate progress bar
    progressWidth.value = withDelay(400, withTiming(habitStats.successRate, { duration: 1000 }));
  }, [habit, habitStats, loading, streakScale, statsOpacity, progressWidth]);

  const handleToggleCompletion = async () => {
    if (!habit) return;
    try {
      await toggleHabitCompletion(habit.id);
      await loadHabitData(); // Refresh data
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      Alert.alert('Error', 'Could not update habit. Please try again.');
    }
  };

  const handleDayPress = async (dateStr: string) => {
    try {
      if (!habit) return;
      const pressedDate = new Date(dateStr);
      // Prevent future toggles
      const today = new Date();
      today.setHours(0,0,0,0);
      if (pressedDate > today) return;
      await toggleHabitCompletion(habit.id, pressedDate);
      await loadHabitData();
    } catch (e) {
      console.error('Error toggling on date', e);
    }
  };

  const handleEditHabit = () => {
    setShowEditModal(true);
  };

  const handleViewGoal = () => {
    if (habit?.goalId) {
      router.push(`/goal/${habit.goalId}`);
    }
  };

  // Animated styles
  const animatedStreakStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
  }));

  const animatedStatsStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading habit details...</Text>
          </View>
        </View>
      </>
    );
  }
  
  // Habit not found state
  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: 'Habit Not Found' }} />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Habit Not Found</Text>
            <Text style={styles.errorText}>
              This habit might have been deleted or the link is incorrect.
            </Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => router.push('/(tabs)/goals')}
            >
              <Text style={styles.errorButtonText}>Back to Goals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  const categoryColors = {
    health: theme.colors.category?.health || '#EF4444',
    learning: theme.colors.category?.learning || '#3B82F6',
    career: theme.colors.category?.career || '#8B5CF6',
    personal: theme.colors.category?.personal || '#F59E0B'
  };

  const categoryColor = categoryColors[habit.category];

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: habit.title,
          headerBackTitle: "Back",
          headerTintColor: categoryColor,
          headerTitleStyle: {
            color: theme.colors.text.primary,
          },
          headerRight: () => (
            <TouchableOpacity style={styles.headerEditButton} onPress={handleEditHabit}>
              <Text style={[styles.headerEditButtonText, { color: categoryColor }]}>Edit</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
                <Text style={styles.categoryEmoji}>{categoryEmojis[habit.category]}</Text>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {habit.category}
                </Text>
              </View>
            </View>
            
            <Text style={styles.habitTitle}>{habit.title}</Text>
            
            {habit.goalTitle && (
              <TouchableOpacity style={styles.goalConnection} onPress={handleViewGoal}>
                <Text style={styles.goalConnectionText}>
                  Part of goal: {habit.goalTitle}
                </Text>
                <Text style={styles.goalConnectionArrow}>→</Text>
              </TouchableOpacity>
            )}
            
            {habit.isStandalone && (
              <Text style={styles.standaloneText}>Standalone habit</Text>
            )}
          </View>

          {/* Current Streak */}
          <View style={styles.section}>
            <Animated.View style={[styles.streakCard, animatedStreakStyle]}>
              <View style={styles.streakIcon}>
                <Text style={styles.streakEmoji}>🔥</Text>
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakNumber}>{habit.streak}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.completionButton,
                  habit.completedToday && styles.completionButtonCompleted,
                  { borderColor: categoryColor }
                ]}
                onPress={handleToggleCompletion}
              >
                <Text style={[
                  styles.completionButtonText,
                  habit.completedToday && styles.completionButtonTextCompleted,
                  { color: habit.completedToday ? '#FFFFFF' : categoryColor }
                ]}>
                  {habit.completedToday ? '✓ Done Today' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Statistics */}
          {habitStats && (
            <Animated.View style={[styles.section, animatedStatsStyle]}>
              <Text style={styles.sectionTitle}>Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{habitStats.totalCompletions}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{habitStats.longestStreak}</Text>
                  <Text style={styles.statLabel}>Best Streak</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{habitStats.successRate}%</Text>
                  <Text style={styles.statLabel}>Success Rate</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>Success Rate</Text>
                <View style={styles.progressBar}>
                  <Animated.View 
                    style={[
                      styles.progressFill, 
                      animatedProgressStyle,
                      { backgroundColor: categoryColor }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{habitStats.successRate}%</Text>
              </View>
            </Animated.View>
          )}

          {/* Completion Calendar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completion History</Text>
            <HabitStreakCalendar
              title={habit.title}
              completions={completionData}
              onDatePress={handleDayPress}
            />
            <Text style={styles.weeklyScore}>{weeklyScore.completed}/{weeklyScore.planned} this week</Text>
          </View>

        </ScrollView>
      </View>

      {/* Edit Modal */}
      <HabitEditModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          loadHabitData(); // Refresh data after edit
        }}
        habitId={habit.id}
      />
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerEditButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  headerEditButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: theme.colors.interactive.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 24,
  },
  errorButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  categoryContainer: {
    marginBottom: theme.spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    gap: theme.spacing.xs,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  habitTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    lineHeight: 34,
  },
  goalConnection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
    gap: theme.spacing.xs,
  },
  goalConnectionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  goalConnectionArrow: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  standaloneText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },

  // Sections
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },

  // Streak Card
  streakCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows?.md,
  },
  streakIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  completionButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  completionButtonCompleted: {
    backgroundColor: theme.colors.success || '#22C55E',
    borderColor: theme.colors.success || '#22C55E',
  },
  completionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completionButtonTextCompleted: {
    color: '#FFFFFF',
  },

  // Statistics
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows?.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Progress Section
  progressSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    ...theme.shadows?.sm,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: '2%',
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textAlign: 'right',
  },
  weeklyScore: {
    marginTop: theme.spacing.sm,
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
