import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/app';
import { isHabitCompletedOnDate } from '@/lib/db';
import { getDummyPrimaryGoal, getDummyHabits, getDummySecondaryGoals } from '@/utils/demoData';

export const useHomeData = () => {
  const { 
    goalsWithIds, 
    habitsWithIds, 
    isHydrated, 
    getPrimaryGoal,
    selectSmartPrimaryGoal,
    getTodaysPendingHabits,
    getHabitStreak,
    updateAvatarVitality,
  } = useAppStore();

  const [primaryGoal, setPrimaryGoalState] = useState<{ id: string; title: string } | null>(null);
  const [primaryGoalHabits, setPrimaryGoalHabits] = useState<any[]>([]);
  const [secondaryGoals, setSecondaryGoals] = useState<{ id: string; title: string; habitCount: number; completedToday: number }[]>([]);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadRealData = useCallback(async (primaryGoalId: string) => {
    const goal = getPrimaryGoal();
    setPrimaryGoalState(goal);
    
    const habits = habitsWithIds[primaryGoalId] || [];
    const habitsWithStats = await Promise.all(
      habits.map(async (habit) => {
        try {
          const streak = await getHabitStreak(habit.id);
          const isCompleted = await isHabitCompletedOnDate(habit.id);
          return {
            id: habit.id,
            name: habit.title,
            completed: isCompleted,
            streak: streak.current,
            description: `Keep up your ${habit.title.toLowerCase()} routine`,
            time: '09:00',
            difficulty: 'medium' as const,
            emoji: '⭐',
          };
        } catch {
          return {
            id: habit.id,
            name: habit.title,
            completed: false,
            streak: 0,
            description: `Keep up your ${habit.title.toLowerCase()} routine`,
            time: '09:00',
            difficulty: 'medium' as const,
            emoji: '⭐',
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
    updateAvatarVitality(newVitality);
    
    // Load secondary goals
    const secondaryGoalsData = await Promise.all(
      goalsWithIds
        .filter(goal => goal.id !== primaryGoalId)
        .map(async (goal) => {
          const habits = habitsWithIds[goal.id] || [];
          const pendingCount = await getTodaysPendingHabits(goal.id);
          return {
            id: goal.id,
            title: goal.title,
            habitCount: habits.length,
            completedToday: habits.length - pendingCount,
          };
        })
    );
    setSecondaryGoals(secondaryGoalsData);
  }, [goalsWithIds, habitsWithIds, getPrimaryGoal, getHabitStreak, getTodaysPendingHabits, updateAvatarVitality]);

  const loadDummyData = useCallback(() => {
    const dummyPrimaryGoal = getDummyPrimaryGoal();
    setPrimaryGoalState(dummyPrimaryGoal);
    
    const dummyHabits = getDummyHabits();
    setPrimaryGoalHabits(dummyHabits);
    
    const completedCount = dummyHabits.filter(h => h.completed).length;
    setCompletedTodayCount(completedCount);
    
    // Set vitality based on completion rate
    const completionRate = completedCount / dummyHabits.length;
    const newVitality = Math.round(40 + (60 * completionRate));
    updateAvatarVitality(newVitality);
    
    const dummySecondaryGoals = getDummySecondaryGoals();
    setSecondaryGoals(dummySecondaryGoals);
  }, [updateAvatarVitality]);

  const loadData = useCallback(async () => {
    if (!isHydrated) return;
    
    setIsLoading(true);
    try {
      const primaryGoalId = await selectSmartPrimaryGoal();
      
      if (primaryGoalId && goalsWithIds.length > 0) {
        await loadRealData(primaryGoalId);
      } else {
        loadDummyData();
      }
    } catch (error) {
      console.warn('Error loading data:', error);
      loadDummyData();
    } finally {
      setIsLoading(false);
    }
  }, [isHydrated, goalsWithIds.length, selectSmartPrimaryGoal, loadRealData, loadDummyData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recommendedHabit = useMemo(() => {
    return primaryGoalHabits.find(h => !h.completed) || null;
  }, [primaryGoalHabits]);

  const hasRealData = useMemo(() => {
    return goalsWithIds.length > 0;
  }, [goalsWithIds.length]);

  return {
    primaryGoal,
    setPrimaryGoalState,
    primaryGoalHabits,
    setPrimaryGoalHabits,
    secondaryGoals,
    completedTodayCount,
    setCompletedTodayCount,
    recommendedHabit,
    hasRealData,
    isLoading,
    refetch: loadData,
  };
};