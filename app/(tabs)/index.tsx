import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores/app';
import { useToast } from '@/hooks/useToast';
import { useHomeData } from '@/hooks/useHomeData';

// New modular components
import { HomeContainer } from '@/components/home/HomeContainer';
import { HomeHeader } from '@/components/home/HomeHeader';
import { DailyProgressOverview } from '@/components/home/DailyProgressOverview';
import { PrimaryGoalSection } from '@/components/home/PrimaryGoalSection';
import { TodaysFocusSection } from '@/components/home/TodaysFocusSection';
import { QuickActionsSection } from '@/components/home/QuickActionsSection';

// Modals and overlays
import { MicroReflectionSheet } from '@/components/MicroReflectionSheet';
import { HabitCelebrationModal } from '@/components/HabitCelebrationModal';
import { MotivationalToast } from '@/components/MotivationalToast';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { HabitCreationWizard } from '@/components/habit-creation/HabitCreationWizard';
import { CreateGoalModal } from '@/components/CreateGoalModal';
import { LoadingState } from '@/components/LoadingState';
import { EnhancedEmptyState } from '@/components/EnhancedEmptyState';
import { QuickActionsModal } from '@/components/QuickActionsModal';

export default function HomeScreen() {
  const { toggleHabitCompletion, avatar } = useAppStore();
  const { 
    notification, 
    showStreakToast, 
    showAchievementToast, 
    hideToast, 
    isVisible: toastVisible 
  } = useToast();

  // Use our consolidated hook
  const {
    primaryGoal,
    primaryGoalHabits,
    allGoals,
    completedTodayCount,
    insights,
    isLoading,
    hasData,
    contextualGreeting,
    refetch,
  } = useHomeData();

  // Modal states
  const [sheet, setSheet] = useState(false);
  const [celebrationModal, setCelebrationModal] = useState(false);
  const [showHabitCreation, setShowHabitCreation] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [completedHabit, setCompletedHabit] = useState<any>(null);
  // Optimistic completion overrides: habitId -> completed?
  const [optimisticCompleted, setOptimisticCompleted] = useState<Record<string, boolean>>({});
  // Guard against duplicate toggles while a request is inflight
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});
  // Timer refs to avoid state updates after unmount
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Defer refetch until celebration modal closes (prevents flicker/unmount)
  const [pendingRefetchHabit, setPendingRefetchHabit] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    };
  }, []);

  // Merge optimistic overrides into visible habits and counts
  const visibleHabits = useMemo(() => {
    if (!primaryGoalHabits || Object.keys(optimisticCompleted).length === 0) return primaryGoalHabits;
    return primaryGoalHabits.map(h => (
      h.id in optimisticCompleted ? { ...h, completed: optimisticCompleted[h.id] } : h
    ));
  }, [primaryGoalHabits, optimisticCompleted]);

  const visibleCompletedCount = useMemo(() => {
    const source = visibleHabits ?? [];
    return source.reduce((acc, h) => acc + (h.completed ? 1 : 0), 0);
  }, [visibleHabits]);

  // Lightweight theme guess based on habit title keywords
  const deriveGoalTheme = (title: string): 'fitness' | 'wellness' | 'learning' | 'creativity' => {
    const t = title.toLowerCase();
    if (/(run|jog|workout|exercise|gym|yoga|walk)/.test(t)) return 'fitness';
    if (/(meditat|mindful|sleep|hydrate|water|stretch)/.test(t)) return 'wellness';
    if (/(read|study|learn|course|practice|language)/.test(t)) return 'learning';
    if (/(draw|write|journal|paint|music|create)/.test(t)) return 'creativity';
    return 'wellness';
  };

  const handleHabitToggle = async (habitId: string) => {
    try {
      // Find the habit BEFORE toggling to check its current state
      const habit = primaryGoalHabits.find(h => h.id === habitId);
      if (!habit) return;
      // Prevent spamming the same habit or opening multiple celebrations
      if (pendingToggles[habitId]) return;

      // Only celebrate if the habit is currently not completed (about to be completed)
      const willComplete = !habit.completed;
      // Optimistically update UI immediately
      setOptimisticCompleted((prev) => ({ ...prev, [habitId]: willComplete }));
      setPendingToggles((prev) => ({ ...prev, [habitId]: true }));
      
      await toggleHabitCompletion(habitId);
      
      if (willComplete) {
        // Prepare and show celebration modal
        setCompletedHabit({
          name: habit.name,
          emoji: habit.emoji || '🌟',
          goalTheme: deriveGoalTheme(habit.name),
          avatar: { type: avatar.type, name: avatar.name },
          currentVitality: avatar.vitality,
          vitalityIncrease: 10,
        });
        // Defer opening slightly to avoid useInsertionEffect warnings
        if (!celebrationModal) {
          if (openTimerRef.current) clearTimeout(openTimerRef.current);
          openTimerRef.current = setTimeout(() => setCelebrationModal(true), 50);
        }
        // Defer refetch until modal closes to keep it open reliably
        setPendingRefetchHabit(habitId);
      }
      
      // Haptic feedback: success only on completion, subtle on un-complete
      if (willComplete) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.selectionAsync();
      }
      
      // Refresh now only if not celebrating (i.e., un-complete path)
      if (!willComplete) {
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
        refetchTimerRef.current = setTimeout(() => {
          try {
            const maybePromise = refetch();
            Promise.resolve(maybePromise).finally(() => {
              setOptimisticCompleted((prev) => {
                const { [habitId]: _ignored, ...rest } = prev;
                return rest;
              });
              setPendingToggles((prev) => {
                const { [habitId]: _ignored2, ...rest } = prev;
                return rest;
              });
            });
          } catch (e) {
            console.warn('Refetch failed:', e);
            setTimeout(() => setOptimisticCompleted((prev) => {
              const { [habitId]: _ignored, ...rest } = prev;
              return rest;
            }), 600);
            setTimeout(() => setPendingToggles((prev) => {
              const { [habitId]: _ignored2, ...rest } = prev;
              return rest;
            }), 600);
          }
        }, 250);
      }
    } catch (error) {
      console.error('Failed to toggle habit:', error);
      // Roll back optimistic update on error
      setOptimisticCompleted((prev) => {
        const { [habitId]: _ignored, ...rest } = prev;
        return rest;
      });
      setPendingToggles((prev) => {
        const { [habitId]: _ignored2, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleMicroReflection = async (text: string, mood?: string) => {
    // Handle micro reflection submission
    setSheet(false);
  };

  const handleGoalPress = (goalId: string) => {
    // Handle goal selection
    console.log('Selected goal:', goalId);
  };

  // Quick actions configuration
  const quickActions = [
    {
      id: 'journal',
      title: 'Journal Entry',
      subtitle: 'Reflect on your day',
      icon: '📝',
      color: '#4F46E5',
      onPress: () => setSheet(true),
    },
    {
      id: 'habit',
      title: 'Add Habit',
      subtitle: 'Build a new routine',
      icon: '⚡',
      color: '#059669',
      onPress: () => setShowHabitCreation(true),
    },
    {
      id: 'goal',
      title: 'New Goal',
      subtitle: 'Set your next target',
      icon: '🎯',
      color: '#DC2626',
      onPress: () => setShowCreateGoal(true),
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <HomeContainer
        overlayElements={
          <FloatingActionButton
          onPress={() => setShowQuickActions(true)}
          accessibilityLabel="Show quick actions"
        />
        }
      >
        <LoadingState
          message="Loading your progress"
          size="large"
        />

        {/* Modals for loading state */}
        <HabitCreationWizard
          visible={showHabitCreation}
          onClose={() => {
            setShowHabitCreation(false);
            refetch();
          }}
        />
      </HomeContainer>
    );
  }

  // Show empty state if no data
  if (!hasData) {
    return (
      <HomeContainer
        overlayElements={
          <FloatingActionButton
          onPress={() => setShowQuickActions(true)}
          accessibilityLabel="Show quick actions"
        />
        }
      >
        <EnhancedEmptyState
          icon="🎯"
          title="Ready to Start Your Journey?"
          subtitle="Create your first goal and begin building positive habits that stick."
          actions={[
            {
              label: "Create Goal",
              onPress: () => setShowCreateGoal(true),
              style: 'primary',
            },
          ]}
          size="large"
        />

        {/* Still show modals for empty state */}
        <CreateGoalModal
          visible={showCreateGoal}
          onClose={() => setShowCreateGoal(false)}
          onGoalCreated={() => {
            setShowCreateGoal(false);
            refetch();
          }}
        />

        <HabitCreationWizard
          visible={showHabitCreation}
          onClose={() => {
            setShowHabitCreation(false);
            refetch();
          }}
        />
      </HomeContainer>
    );
  }

  return (
    <HomeContainer
      overlayElements={
        <FloatingActionButton
          onPress={() => setShowQuickActions(true)}
          accessibilityLabel="Show quick actions"
        />
      }
    >
      {/* Header */}
      <HomeHeader
        userName="Friend" // You might want to get this from user profile
        contextualGreeting={contextualGreeting}
        onCreateGoal={() => setShowCreateGoal(true)}
      />

      {/* Daily Progress Overview */}
      {hasData && visibleHabits && (
        <DailyProgressOverview
          completedHabits={visibleCompletedCount}
          totalHabits={visibleHabits.length}
          currentStreak={primaryGoal?.streak || 0}
          todayGoalProgress={primaryGoal ? Math.round((primaryGoal.completedHabits / Math.max(primaryGoal.totalHabits, 1)) * 100) : 0}
          motivationalMessage={contextualGreeting}
        />
      )}

      {/* Primary Goal Section */}
      {hasData && (
        <PrimaryGoalSection
          goals={allGoals}
          primaryGoalId={primaryGoal?.id || null}
          onGoalPress={handleGoalPress}
          insights={insights}
        />
      )}

      {/* Quick Actions */}
      <QuickActionsSection actions={quickActions} />

      {/* Today's Focus Section */}
      <TodaysFocusSection
        habits={visibleHabits}
        completedCount={visibleCompletedCount}
        onHabitToggle={handleHabitToggle}
      />

      {/* Modals and Overlays */}
      <MicroReflectionSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onSave={handleMicroReflection}
      />

      <HabitCelebrationModal
        visible={celebrationModal}
        habitName={completedHabit?.name || ''}
        habitEmoji={completedHabit?.emoji || '🌟'}
        goalTheme={completedHabit?.goalTheme || 'wellness'}
        avatar={completedHabit?.avatar || { type: 'plant', name: 'Sage' }}
        oldVitality={completedHabit?.currentVitality || 50}
        newVitality={Math.min(100, (completedHabit?.currentVitality || 50) + (completedHabit?.vitalityIncrease || 15))}
        vitalityIncrease={completedHabit?.vitalityIncrease || 15}
        onClose={() => {
          setCelebrationModal(false);
          const habitId = pendingRefetchHabit;
          setPendingRefetchHabit(null);
          // Kick refetch after modal close to keep it stable
          const doClearFlags = (id?: string | null) => {
            if (!id) return;
            setOptimisticCompleted((prev) => {
              const { [id]: _ignored, ...rest } = prev;
              return rest;
            });
            setPendingToggles((prev) => {
              const { [id]: _ignored2, ...rest } = prev;
              return rest;
            });
          };
          try {
            const maybe = refetch();
            Promise.resolve(maybe).finally(() => doClearFlags(habitId));
          } catch {
            doClearFlags(habitId);
          }
          setCompletedHabit(null);
        }}
      />

      <MotivationalToast
        visible={toastVisible}
        notification={notification}
        onDismiss={hideToast}
      />

      <HabitCreationWizard
        visible={showHabitCreation}
        onClose={() => {
          setShowHabitCreation(false);
          refetch();
        }}
      />

      <CreateGoalModal
        visible={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onGoalCreated={() => {
          setShowCreateGoal(false);
          refetch();
        }}
      />

      <QuickActionsModal
        visible={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        actions={[
          {
            id: 'journal',
            title: 'Journal Entry',
            subtitle: 'Reflect on your day',
            icon: '📖',
            color: '#4F46E5',
            onPress: () => setSheet(true),
          },
          {
            id: 'habit',
            title: 'Add Habit',
            subtitle: 'Build a new routine',
            icon: '⚡',
            color: '#059669',
            onPress: () => setShowHabitCreation(true),
          },
          {
            id: 'goal',
            title: 'New Goal',
            subtitle: 'Set your next target',
            icon: '🎯',
            color: '#DC2626',
            onPress: () => setShowCreateGoal(true),
          },
        ]}
      />
    </HomeContainer>
  );
}

