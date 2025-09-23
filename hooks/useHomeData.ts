import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { isHabitCompletedOnDate } from '@/lib/db';
import { habitAnalytics } from '@/services/analytics/HabitAnalyticsService';
import { streakPredictor } from '@/services/analytics/StreakPredictionEngine';
import { smartInsightsEngine, type SmartInsights, type EnhancedInsight } from '@/services/ai/smartInsights';

interface HomeHabit {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  streak: number;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time?: string;
}

interface HomeGoal {
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

interface HomeInsights {
  bestTime?: string;
  streakRisk?: 'low' | 'medium' | 'high';
  tip?: string;
  enhanced?: SmartInsights;
}

export const useHomeData = () => {
  const { 
    goalsWithIds, 
    habitsWithIds, 
    isHydrated, 
    getPrimaryGoal,
    selectSmartPrimaryGoal,
    getTodaysScheduledHabits,
    getAllTodaysScheduledHabits,
    getHabitStreak,
    updateAvatarVitality,
  } = useAppStore();

  const [primaryGoal, setPrimaryGoalState] = useState<{ id: string; title: string } | null>(null);
  const [primaryGoalHabits, setPrimaryGoalHabits] = useState<HomeHabit[]>([]);
  const [allGoals, setAllGoals] = useState<HomeGoal[]>([]);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [insights, setInsights] = useState<HomeInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get appropriate emoji for habit
  const getHabitEmoji = useCallback((habitTitle: string) => {
    const title = habitTitle.toLowerCase();
    if (title.includes('run') || title.includes('jog')) return '🏃‍♀️';
    if (title.includes('read')) return '📚';
    if (title.includes('meditat') || title.includes('mindful')) return '🧘‍♀️';
    if (title.includes('water') || title.includes('hydrat')) return '💧';
    if (title.includes('stretch') || title.includes('yoga')) return '🧘‍♀️';
    if (title.includes('workout') || title.includes('exercise')) return '💪';
    if (title.includes('write') || title.includes('journal')) return '✍️';
    if (title.includes('sleep')) return '😴';
    if (title.includes('eat') || title.includes('nutrition')) return '🥗';
    if (title.includes('walk')) return '🚶‍♀️';
    return '⭐';
  }, []);

  // Helper function to determine habit difficulty
  const getHabitDifficulty = useCallback((habitTitle: string): 'easy' | 'medium' | 'hard' => {
    const title = habitTitle.toLowerCase();
    if (title.includes('drink') || title.includes('water') || title.includes('stretch')) return 'easy';
    if (title.includes('run') || title.includes('workout') || title.includes('exercise')) return 'hard';
    return 'medium';
  }, []);

  const loadRealData = useCallback(async (primaryGoalId: string) => {
    const goal = getPrimaryGoal();
    setPrimaryGoalState(goal);
    
    // Get today's scheduled habits for the primary goal + standalone
    const goalScheduledHabits = await getTodaysScheduledHabits(primaryGoalId);
    const allTodaysHabits = await getAllTodaysScheduledHabits();
    const standaloneScheduledHabits = allTodaysHabits.filter(h => !h.goalId);
    const allScheduledHabits = [...goalScheduledHabits, ...standaloneScheduledHabits];

    const habitsWithStats = await Promise.all(
      allScheduledHabits.map(async (habit) => {
        try {
          const streak = await getHabitStreak(habit.id);
          const isCompleted = await isHabitCompletedOnDate(habit.id);
          return {
            id: habit.id,
            name: habit.title,
            description: `Keep up your ${habit.title.toLowerCase()} routine`,
            completed: isCompleted,
            streak: streak.current,
            emoji: getHabitEmoji(habit.title),
            difficulty: getHabitDifficulty(habit.title),
            time: habit.specificTime || undefined,
          };
        } catch {
          return {
            id: habit.id,
            name: habit.title,
            description: `Keep up your ${habit.title.toLowerCase()} routine`,
            completed: false,
            streak: 0,
            emoji: getHabitEmoji(habit.title),
            difficulty: getHabitDifficulty(habit.title) as 'easy' | 'medium' | 'hard',
            time: undefined,
          };
        }
      })
    );
    setPrimaryGoalHabits(habitsWithStats);
    
    const completedCount = habitsWithStats.filter(h => h.completed).length;
    setCompletedTodayCount(completedCount);
    
    const totalHabits = habitsWithStats.length;
    const completionRate = totalHabits > 0 ? completedCount / totalHabits : 0;
    const newVitality = Math.round(40 + (60 * completionRate));
    // Avoid update loops: only update if value actually changes
    try {
      const currentVitality = useAppStore.getState().avatar.vitality;
      if (currentVitality !== newVitality) {
        updateAvatarVitality(newVitality);
      }
    } catch {}
    
    // Build all goals data for carousel
    const goalsData = await Promise.all(
      goalsWithIds.map(async (goalWithId) => {
        const goalHabits = habitsWithIds[goalWithId.id] || [];
        const goalScheduledHabits = await getTodaysScheduledHabits(goalWithId.id);
        const completedGoalHabits = await Promise.all(
          goalScheduledHabits.map(async (h) => await isHabitCompletedOnDate(h.id))
        );
        const completedCount = completedGoalHabits.filter(Boolean).length;
        // Read latest avatar snapshot only when building data to avoid hook deps
        const avatarSnapshot = useAppStore.getState().avatar;
        return {
          id: goalWithId.id,
          title: goalWithId.title,
          completedHabits: completedCount,
          totalHabits: goalScheduledHabits.length,
          avatar: {
            type: avatarSnapshot.type,
            name: avatarSnapshot.name,
            vitality: newVitality,
          },
        };
      })
    );
    setAllGoals(goalsData);

    // Load insights for primary goal habits
    if (habitsWithStats.length > 0) {
      await loadInsights(habitsWithStats[0]);
    }
  }, [
    goalsWithIds, 
    habitsWithIds, 
    getPrimaryGoal, 
    getTodaysScheduledHabits,
    getAllTodaysScheduledHabits,
    getHabitStreak, 
    updateAvatarVitality, 
    getHabitEmoji,
    getHabitDifficulty,
  ]);

  const loadInsights = useCallback(async (targetHabit: HomeHabit) => {
    try {
      // Legacy insights for backward compatibility
      const [pattern, forecast] = await Promise.all([
        habitAnalytics.analyzeHabitTiming(targetHabit.id),
        streakPredictor.generateStreakForecast(targetHabit.id),
      ]);

      const bestTime = pattern?.optimalHours?.length > 0
        ? `${pattern.optimalHours[0]}:00-${pattern.optimalHours[pattern.optimalHours.length - 1]}:00`
        : undefined;

      let tip = '';
      if (forecast?.riskProfile === 'high') {
        tip = 'Consider breaking this habit into smaller steps';
      } else if (pattern?.difficultDays?.length > 0) {
        tip = `Focus extra attention on ${pattern.difficultDays[0]}s`;
      }

      // Enhanced insights
      const userContext = {
        currentHour: new Date().getHours(),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        completionRate: primaryGoalHabits.length > 0 ? completedTodayCount / primaryGoalHabits.length : 0,
        totalHabits: primaryGoalHabits.length,
        completedHabits: completedTodayCount,
      };

      const enhanced = await smartInsightsEngine.generateInsights(
        targetHabit,
        userContext,
        primaryGoalHabits
      );

      setInsights({
        bestTime,
        streakRisk: forecast?.riskProfile,
        tip: tip || undefined,
        enhanced,
      });
    } catch (error) {
      console.warn('Failed to load insights:', error);
      setInsights(null);
    }
  }, [primaryGoalHabits, completedTodayCount]);

  const loadData = useCallback(async () => {
    if (!isHydrated) return;
    
    setIsLoading(true);
    try {
      const primaryGoalId = await selectSmartPrimaryGoal();
      
      if (primaryGoalId && goalsWithIds.length > 0) {
        await loadRealData(primaryGoalId);
      } else {
        // Empty state
        setPrimaryGoalState(null);
        setPrimaryGoalHabits([]);
        setAllGoals([]);
        setCompletedTodayCount(0);
        setInsights(null);
      }
    } catch (error) {
      console.warn('Error loading home data:', error);
      // Set empty state on error
      setPrimaryGoalState(null);
      setPrimaryGoalHabits([]);
      setAllGoals([]);
      setCompletedTodayCount(0);
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [isHydrated, goalsWithIds.length, selectSmartPrimaryGoal, loadRealData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recommendedHabit = useMemo(() => {
    return primaryGoalHabits.find(h => !h.completed) || null;
  }, [primaryGoalHabits]);

  const hasData = useMemo(() => {
    return goalsWithIds.length > 0;
  }, [goalsWithIds.length]);

  const contextualGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const progressPercent = primaryGoalHabits.length > 0
      ? Math.round((completedTodayCount / primaryGoalHabits.length) * 100)
      : 0;

    if (hour < 12) {
      return progressPercent > 0
        ? `Great start! ${progressPercent}% complete`
        : "Ready to start your day strong?";
    } else if (hour < 17) {
      return progressPercent > 50
        ? `Awesome progress! ${progressPercent}% done`
        : "Keep the momentum going!";
    } else {
      return progressPercent === 100
        ? "Perfect day! All habits complete 🎉"
        : "How did your day go?";
    }
  }, [completedTodayCount, primaryGoalHabits.length]);

  // Memoized refetch function
  const memoizedRefetch = useCallback(() => {
    return loadData();
  }, [loadData]);

  return {
    // State
    primaryGoal,
    primaryGoalHabits,
    allGoals,
    completedTodayCount,
    insights,
    isLoading,
    hasData,
    recommendedHabit,
    contextualGreeting,
    
    // Actions
    refetch: memoizedRefetch,
  };
};
