import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ProgressCircle } from '@/components/ProgressCircle';
import { useAppStore } from '@/stores/app';

interface GoalProgressData {
  id: string;
  title: string;
  completed: number;
  total: number;
  streak: number;
  trend: number[]; // 7-day completion trend
}

interface ProgressDashboardProps {
  onGoalPress?: (goalId: string) => void;
  onAnalyticsPress?: () => void;
}

export function ProgressDashboard({ onGoalPress, onAnalyticsPress }: ProgressDashboardProps) {
  const { theme } = useTheme();
  const { 
    goalsWithIds, 
    habitsWithIds, 
    isHydrated, 
    getHabitStreak,
    getTodaysPendingHabits 
  } = useAppStore();
  
  const [goalProgressData, setGoalProgressData] = useState<GoalProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = createStyles(theme);

  // Calculate overall progress metrics
  const progressMetrics = useMemo(() => {
    const totalHabits = goalProgressData.reduce((sum, goal) => sum + goal.total, 0);
    const completedHabits = goalProgressData.reduce((sum, goal) => sum + goal.completed, 0);
    const totalStreaks = goalProgressData.reduce((sum, goal) => sum + goal.streak, 0);
    const goalsOnTrack = goalProgressData.filter(goal => goal.total > 0 && goal.completed / goal.total >= 0.7).length;
    
    return {
      overallCompletion: totalHabits > 0 ? completedHabits / totalHabits : 0,
      totalHabits,
      completedHabits,
      totalStreaks,
      goalsOnTrack,
      totalGoals: goalProgressData.length
    };
  }, [goalProgressData]);

  // Load goal progress data
  useEffect(() => {
    if (!isHydrated) return;
    
    const loadProgressData = async () => {
      setLoading(true);
      try {
        const progressData = await Promise.all(
          goalsWithIds.map(async (goal) => {
            const habits = habitsWithIds[goal.id] || [];
            const pendingCount = await getTodaysPendingHabits(goal.id);
            const completedToday = habits.length - pendingCount;
            
            // Calculate average streak for this goal
            const streaks = await Promise.all(
              habits.map(async (habit) => {
                const streak = await getHabitStreak(habit.id);
                return streak.current;
              })
            );
            const avgStreak = streaks.length > 0 ? Math.round(streaks.reduce((sum, s) => sum + s, 0) / streaks.length) : 0;
            
            // Generate mock 7-day trend (in real implementation, this would come from database)
            const trend = Array.from({ length: 7 }, () => Math.random() * 100);
            
            return {
              id: goal.id,
              title: goal.title,
              completed: completedToday,
              total: habits.length,
              streak: avgStreak,
              trend
            };
          })
        );
        
        setGoalProgressData(progressData);
      } catch (error) {
        console.error('Error loading progress data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProgressData();
  }, [isHydrated, goalsWithIds, habitsWithIds, getHabitStreak, getTodaysPendingHabits]);

  const getProgressColor = (completion: number): string => {
    if (completion >= 0.8) return theme.colors.success || '#4CAF50';
    if (completion >= 0.6) return theme.colors.warning || '#FF9800';
    return theme.colors.error || '#F44336';
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '🌟';
    if (streak >= 3) return '💪';
    return '🌱';
  };

  const renderWeeklyTrend = () => {
    // Generate a 7-day trend for overall completion (mock data for now)
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const trendData = Array.from({ length: 7 }, (_, i) => {
      // Generate mock completion percentages, with today being actual data
      if (i === 6) { // Today
        return progressMetrics.overallCompletion * 100;
      }
      return Math.random() * 100;
    });
    
    const maxValue = Math.max(...trendData, 100);
    
    return (
      <View style={styles.trendContainer}>
        <Text style={styles.trendTitle}>📈 7-Day Trend</Text>
        <View style={styles.trendChart}>
          {weekDays.map((day, index) => {
            const height = Math.max((trendData[index] / maxValue) * 40, 3);
            const isToday = index === 6;
            return (
              <View key={index} style={styles.trendBarContainer}>
                <View 
                  style={[
                    styles.trendBar, 
                    { 
                      height,
                      backgroundColor: isToday 
                        ? theme.colors.primary 
                        : theme.colors.background.tertiary + '80'
                    }
                  ]} 
                />
                <Text style={[
                  styles.trendDayLabel,
                  { color: isToday ? theme.colors.primary : theme.colors.text.secondary }
                ]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderQuickStats = () => (
    <View style={styles.quickStatsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{progressMetrics.completedHabits}</Text>
        <Text style={styles.statLabel}>Completed Today</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{progressMetrics.totalStreaks}</Text>
        <Text style={styles.statLabel}>Total Streak Days</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{progressMetrics.goalsOnTrack}/{progressMetrics.totalGoals}</Text>
        <Text style={styles.statLabel}>Goals On Track</Text>
      </View>
    </View>
  );

  const renderGoalProgressCards = () => (
    <View style={styles.goalsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Goal Progress</Text>
        <TouchableOpacity onPress={onAnalyticsPress} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View Analytics</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalsScrollContainer}>
        {goalProgressData.map((goal) => {
          const completionRate = goal.total > 0 ? goal.completed / goal.total : 0;
          const progressColor = getProgressColor(completionRate);
          
          return (
            <TouchableOpacity 
              key={goal.id} 
              style={styles.goalCard}
              onPress={() => onGoalPress?.(goal.id)}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle} numberOfLines={2}>
                  {goal.title}
                </Text>
                <Text style={styles.streakIndicator}>
                  {getStreakEmoji(goal.streak)} {goal.streak}
                </Text>
              </View>
              
              <View style={styles.goalProgress}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${Math.min(completionRate * 100, 100)}%`,
                        backgroundColor: progressColor
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {goal.completed}/{goal.total}
                </Text>
              </View>
              
              <Text style={styles.completionRate}>
                {Math.round(completionRate * 100)}% complete
              </Text>
            </TouchableOpacity>
          );
        })}
        
        {goalProgressData.length === 0 && !loading && (
          <View style={styles.emptyGoalsCard}>
            <Text style={styles.emptyGoalsEmoji}>🎯</Text>
            <Text style={styles.emptyGoalsText}>Create your first goal to see progress here!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  if (loading || !isHydrated) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Progress Circle */}
      <View style={styles.mainProgressContainer}>
        <ProgressCircle 
          progress={progressMetrics.overallCompletion} 
          size={100} 
          strokeWidth={8}
          animated={true}
        />
        <View style={styles.progressDetails}>
          <Text style={styles.progressTitle}>Today&apos;s Progress</Text>
          <Text style={styles.progressSubtitle}>
            {progressMetrics.completedHabits} of {progressMetrics.totalHabits} habits completed
          </Text>
          {progressMetrics.overallCompletion >= 0.8 && (
            <Text style={styles.motivationText}>🎉 Amazing work!</Text>
          )}
          {progressMetrics.overallCompletion >= 0.6 && progressMetrics.overallCompletion < 0.8 && (
            <Text style={styles.motivationText}>💪 Keep pushing!</Text>
          )}
          {progressMetrics.overallCompletion < 0.6 && progressMetrics.totalHabits > 0 && (
            <Text style={styles.motivationText}>🌱 Every step counts</Text>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      {renderQuickStats()}

      {/* Weekly Trend */}
      {renderWeeklyTrend()}

      {/* Goal Progress Cards */}
      {renderGoalProgressCards()}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing?.lg || 16,
  },
  loadingContainer: {
    padding: theme.spacing?.lg || 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  mainProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: theme.spacing?.lg || 16,
    marginBottom: theme.spacing?.lg || 16,
    ...theme.shadows?.sm || {},
  },
  progressDetails: {
    flex: 1,
    marginLeft: theme.spacing?.lg || 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: theme.spacing?.sm || 8,
    marginBottom: theme.spacing?.lg || 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing?.md || 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line || theme.colors.background.tertiary,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  goalsSection: {
    marginBottom: theme.spacing?.md || 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing?.md || 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  viewAllButton: {
    paddingHorizontal: theme.spacing?.sm || 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  goalsScrollContainer: {
    paddingHorizontal: 4,
    gap: theme.spacing?.md || 12,
  },
  goalCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing?.md || 12,
    width: 160,
    borderWidth: 1,
    borderColor: theme.colors.line || theme.colors.background.tertiary,
    ...theme.shadows?.sm || {},
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing?.sm || 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing?.xs || 4,
  },
  streakIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    flexShrink: 0,
  },
  goalProgress: {
    marginBottom: theme.spacing?.sm || 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  completionRate: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  emptyGoalsCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing?.lg || 16,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line || theme.colors.background.tertiary,
    borderStyle: 'dashed',
  },
  emptyGoalsEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing?.sm || 8,
  },
  emptyGoalsText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  trendContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing?.md || 12,
    marginBottom: theme.spacing?.lg || 16,
    borderWidth: 1,
    borderColor: theme.colors.line || theme.colors.background.tertiary,
    ...theme.shadows?.sm || {},
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing?.sm || 8,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 60,
    paddingHorizontal: theme.spacing?.xs || 4,
  },
  trendBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  trendBar: {
    width: 16,
    borderRadius: 8,
    marginBottom: 6,
    minHeight: 3,
  },
  trendDayLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});