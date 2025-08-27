import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores/app';
import { track } from '@/utils/analytics';

export const useHabitCompletion = (
  onHabitComplete: (habitId: string) => void,
  disabled: boolean = false
) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [holdingHabit, setHoldingHabit] = useState<string | null>(null);
  const progressRef = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleHabitHoldStart = useCallback((habitId: string) => {
    if (disabled || isCompleting) return;
    
    setHoldingHabit(habitId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Start progress animation
    Animated.timing(progressRef, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
    
    // Set timer for completion
    holdTimerRef.current = setTimeout(() => {
      onHabitComplete(habitId);
    }, 3000);
    
    // Haptic feedback during hold
    const hapticInterval = setInterval(() => {
      if (holdTimerRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        clearInterval(hapticInterval);
      }
    }, 500);
  }, [disabled, isCompleting, onHabitComplete, progressRef]);

  const handleHabitHoldEnd = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldingHabit(null);
    
    // Reset progress animation
    Animated.timing(progressRef, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progressRef]);

  const completeHabit = useCallback(async (
    habitId: string,
    habit: any,
    goalsWithIds: any[],
    onSuccess?: (habit: any) => void
  ) => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      // For real habits, toggle in database
      if (goalsWithIds.length > 0 && !habit.id.startsWith('habit-')) {
        await useAppStore.getState().toggleHabitCompletion(habitId);
      }
      
      setHoldingHabit(null);
      progressRef.setValue(0);
      
      onSuccess?.(habit);
      track('habit_hold_completed', { habitId, habitName: habit.name });
    } catch (error) {
      console.warn('Error completing habit:', error);
      setIsCompleting(false);
    }
  }, [isCompleting, progressRef]);

  return {
    isCompleting,
    setIsCompleting,
    holdingHabit,
    progressRef,
    handleHabitHoldStart,
    handleHabitHoldEnd,
    completeHabit,
  };
};