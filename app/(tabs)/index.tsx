import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MicroReflectionSheet } from '@/components/MicroReflectionSheet';
import { HabitCelebrationModal } from '@/components/HabitCelebrationModal';
import { MotivationalToast } from '@/components/MotivationalToast';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { HabitCreationWizard } from '@/components/habit-creation/HabitCreationWizard';
import { CreateGoalModal } from '@/components/CreateGoalModal';
import { HabitManagementScreen } from '@/components/HabitManagementScreen';
import { FeaturedGoalCarousel } from '@/components/FeaturedGoalCarousel';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HabitsSection } from '@/components/home/HabitsSection';
import { ProgressOverview } from '@/components/home/ProgressOverview';
import { ProgressDashboard } from '@/components/home/ProgressDashboard';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/useToast';
import { useAppStore } from '@/stores/app';
import { track } from '@/utils/analytics';
import { isHabitCompletedOnDate } from '@/lib/db';

// Helper function to get appropriate emoji for habit
const getHabitEmoji = (habitTitle: string) => {
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
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const { 
    goalsWithIds, 
    standaloneHabits, 
    habitsWithIds, 
    isHydrated, 
    getPrimaryGoal,
    selectSmartPrimaryGoal,
    setPrimaryGoal,
    getTodaysPendingHabits,
    toggleHabitCompletion,
    getHabitStreak,
    getAllTodaysScheduledHabits,
    getTodaysScheduledHabits
  } = useAppStore();
  const { 
    notification, 
    showStreakToast, 
    showAchievementToast, 
    showEncouragementToast, 
    hideToast, 
    isVisible: toastVisible 
  } = useToast();
  const { updateAvatarVitality, avatar } = useAppStore();
  const [sheet, setSheet] = useState(false);
  const [celebrationModal, setCelebrationModal] = useState(false);
  const [showHabitCreation, setShowHabitCreation] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showHabitManagement, setShowHabitManagement] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [holdingHabit, setHoldingHabit] = useState<string | null>(null);
  const [primaryGoal, setPrimaryGoalState] = useState<{ id: string; title: string } | null>(null);
  const [primaryGoalHabits, setPrimaryGoalHabits] = useState<any[]>([]);
  const [secondaryGoals, setSecondaryGoals] = useState<{ id: string; title: string; habitCount: number; completedToday: number }[]>([]);
  const progressValue = useSharedValue(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styles = createStyles(theme);
  
  // Load data (real + dummy for demonstration)
  useEffect(() => {
    if (!isHydrated) return;
    
    const loadData = async () => {
      try {
        // First try to load real data
        const primaryGoalId = await selectSmartPrimaryGoal();
        
        if (primaryGoalId && goalsWithIds.length > 0) {
          // Use real data if available
          const goal = getPrimaryGoal();
          setPrimaryGoalState(goal);
          
          // Get today's scheduled habits for the primary goal
          const goalScheduledHabits = await getTodaysScheduledHabits(primaryGoalId);
          
          // Also include today's scheduled standalone habits
          const allTodaysHabits = await getAllTodaysScheduledHabits();
          const standaloneScheduledHabits = allTodaysHabits.filter(h => !h.goalId);
          
          // Combine goal habits and standalone habits
          const allScheduledHabits = [...goalScheduledHabits, ...standaloneScheduledHabits];
          
          const habitsWithStats = await Promise.all(
            allScheduledHabits.map(async (habit) => {
              try {
                const streak = await getHabitStreak(habit.id);
                const isCompleted = await isHabitCompletedOnDate(habit.id);
                return {
                  id: habit.id,
                  name: habit.title,
                  completed: isCompleted,
                  streak: streak.current,
                  description: `Keep up your ${habit.title.toLowerCase()} routine`,
                  time: habit.schedule?.specificTime || 'Anytime',
                  difficulty: 'medium' as const,
                  emoji: getHabitEmoji(habit.title),
                };
              } catch {
                return {
                  id: habit.id,
                  name: habit.title,
                  completed: false,
                  streak: 0,
                  description: `Keep up your ${habit.title.toLowerCase()} routine`,
                  time: habit.schedule?.specificTime || 'Anytime',
                  difficulty: 'medium' as const,
                  emoji: getHabitEmoji(habit.title),
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
        } else {
          // Use dummy data for demonstration
          const dummyPrimaryGoal = {
            id: 'demo-fitness',
            title: 'Run a 5K Marathon'
          };
          setPrimaryGoalState(dummyPrimaryGoal);
          
          const dummyHabits = [
            {
              id: 'habit-1',
              name: 'Morning Run',
              description: '30 minutes of outdoor running',
              time: '07:00',
              completed: false,
              streak: 12,
              difficulty: 'hard' as const,
              emoji: '🏃‍♀️',
            },
            {
              id: 'habit-2', 
              name: 'Stretching',
              description: '10 minutes of post-workout stretching',
              time: '19:00',
              completed: true,
              streak: 8,
              difficulty: 'easy' as const,
              emoji: '🧘‍♀️',
            },
            {
              id: 'habit-3',
              name: 'Hydration Check',
              description: 'Drink 2 liters of water throughout the day',
              time: '12:00',
              completed: false,
              streak: 5,
              difficulty: 'medium' as const,
              emoji: '💧',
            }
          ];
          setPrimaryGoalHabits(dummyHabits);
          
          const completedCount = dummyHabits.filter(h => h.completed).length;
          setCompletedTodayCount(completedCount);
          
          // Set vitality based on completion rate
          const completionRate = completedCount / dummyHabits.length;
          const newVitality = Math.round(40 + (60 * completionRate));
          updateAvatarVitality(newVitality);
          
          // Dummy secondary goals
          const dummySecondaryGoals = [
            {
              id: 'demo-mindfulness',
              title: 'Daily Mindfulness',
              habitCount: 2,
              completedToday: 1,
            },
            {
              id: 'demo-learning',
              title: 'Learn Spanish',
              habitCount: 3,
              completedToday: 0,
            },
            {
              id: 'demo-creativity',
              title: 'Creative Writing',
              habitCount: 1,
              completedToday: 1,
            }
          ];
          setSecondaryGoals(dummySecondaryGoals);
        }
      } catch (error) {
        console.warn('Error loading data:', error);
      }
    };
    
    loadData();
  }, [isHydrated, goalsWithIds, habitsWithIds, selectSmartPrimaryGoal, getPrimaryGoal, getHabitStreak, getTodaysPendingHabits, updateAvatarVitality, getAllTodaysScheduledHabits, getTodaysScheduledHabits]);
  
  const [completedHabit, setCompletedHabit] = useState<any>(null);
  const [pendingHabit, setPendingHabit] = useState<any>(null);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);

  const [showSecondaryGoals, setShowSecondaryGoals] = useState(false);
  const getContextualGreeting = () => {
    const hour = new Date().getHours();
    const totalHabits = primaryGoalHabits.length;
    const progress = totalHabits > 0 ? completedTodayCount / totalHabits : 0;
    const nextHabit = recommendedHabit;
    
    if (hour < 12) {
      if (progress === 0 && nextHabit) {
        return `Good morning! Ready for ${nextHabit.name}? 🌅`;
      } else if (progress > 0 && nextHabit) {
        return `Great start! Next: ${nextHabit.name} 💪`;
      } else if (progress === 1) {
        return `Morning champion! All habits completed! 🎆`;
      } else {
        return `Good morning! Ready to build great habits? 🌱`;
      }
    } else if (hour < 17) {
      if (nextHabit) {
        return `Afternoon ${nextHabit.name} time? 🚀`;
      } else if (progress === 1) {
        return `Afternoon excellence! All habits done! 🔥`;
      } else {
        return `Afternoon energy boost time! 🚀`;
      }
    } else {
      if (progress === 1) {
        return `Perfect day! All habits completed! 🌟`;
      } else if (nextHabit) {
        return `Evening ${nextHabit.name} session? 🌙`;
      } else {
        return `Winding down peacefully 🌙✨`;
      }
    }
  };
  

  // Get AI-recommended habit (first incomplete habit)
  const getRecommendedHabit = () => {
    return primaryGoalHabits.find(h => !h.completed) || null;
  };
  const recommendedHabit = getRecommendedHabit();
  
  // Smart toast notifications based on real progress
  useEffect(() => {
    if (!primaryGoal || primaryGoalHabits.length === 0) return;
    
    const showContextualToasts = () => {
      const currentHour = new Date().getHours();
      const totalHabits = primaryGoalHabits.length;
      const progressPercent = totalHabits > 0 ? (completedTodayCount / totalHabits) * 100 : 0;
      
      // Morning motivation (7-10 AM) - if no habits completed yet
      if (currentHour >= 7 && currentHour <= 10 && completedTodayCount === 0) {
        setTimeout(() => {
          showEncouragementToast(`Ready to grow! Let's start with your priority habit 🌱`);
        }, 3000);
      }
      
      // Evening celebration (6-9 PM) - if 80%+ completed
      else if (currentHour >= 18 && currentHour <= 21 && progressPercent >= 80) {
        setTimeout(() => {
          showAchievementToast(
            `Amazing progress! 🎉`,
            `${completedTodayCount}/${totalHabits} habits completed today! 🌟`
          );
        }, 2000);
      }
    };
    
    // Only show contextual toasts if no toast is currently visible
    if (!toastVisible) {
      showContextualToasts();
    }
  }, [completedTodayCount, toastVisible, showEncouragementToast, showAchievementToast, primaryGoal, primaryGoalHabits.length]);
  
  const handleHabitHoldStart = (habitId: string) => {
    if (isCompleting || celebrationModal || sheet) return;
    setHoldingHabit(habitId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
               // Start progress animation
           progressValue.value = withTiming(1, { duration: 3000 });
    
    // Set timer for completion
    holdTimerRef.current = setTimeout(() => {
      handleHabitComplete(habitId);
    }, 3000);
    
    // Haptic feedback during hold
    const hapticInterval = setInterval(() => {
      if (holdTimerRef.current) {
        Haptics.selectionAsync();
      } else {
        clearInterval(hapticInterval);
      }
    }, 750);
  };

  const handleHabitHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldingHabit(null);
    
               // Reset progress animation
           progressValue.value = withTiming(0, { duration: 200 });
  };

  const handleHabitComplete = async (habitId: string) => {
    if (isCompleting) return;
    setIsCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const habit = primaryGoalHabits.find(h => h.id === habitId);
    if (habit) {
      // For real habits, toggle in database
      if (goalsWithIds.length > 0 && habit.id.startsWith('habit-')) {
        try {
          await toggleHabitCompletion(habitId);
        } catch (error) {
          console.warn('Error toggling habit completion:', error);
        }
      }
      
                   setPendingHabit({ ...habit, id: habitId });
             setSheet(true);
             setHoldingHabit(null);
             progressValue.value = 0;
      
      // Update local state to show completion
      setPrimaryGoalHabits(prev => 
        prev.map(h => h.id === habitId ? { ...h, completed: true } : h)
      );
    }
  };

  const handleMicroReflection = async (text: string, mood: string) => {
    try {
      // For real habits, save to database
      if (goalsWithIds.length > 0 && pendingHabit?.id && !pendingHabit.id.startsWith('habit-')) {
        await useAppStore.getState().submitEntry(text, mood as any, pendingHabit.id);
      }
      
      track('entry_submitted', { mood, length: text.length });
      setSheet(false);

      if (pendingHabit) {
        let streakValue = pendingHabit.streak || 0;
        
        // For real habits, get actual streak
        if (goalsWithIds.length > 0 && !pendingHabit.id.startsWith('habit-')) {
          try {
            const updatedStreak = await getHabitStreak(pendingHabit.id);
            streakValue = updatedStreak.current;
          } catch (error) {
            console.warn('Could not get habit streak:', error);
          }
        } else {
          // For dummy habits, increment streak
          streakValue = pendingHabit.streak + 1;
          setPrimaryGoalHabits(prev => 
            prev.map(h => h.id === pendingHabit.id ? { ...h, streak: streakValue } : h)
          );
        }
        
        // Simulate vitality changes for celebration
        const oldVitality = avatar.vitality;
        const vitalityIncrease = 15;
        const newVitality = Math.min(100, oldVitality + vitalityIncrease);

        // Trigger celebration modal
        setCompletedHabit({ 
          ...pendingHabit, 
          currentVitality: oldVitality, 
          vitalityIncrease,
          streak: streakValue,
          goalTheme: 'fitness' as const,
          avatar: { type: 'plant' as const, name: 'Sage' }
        });
        setCelebrationModal(true);

        // Update completion count and vitality
        setCompletedTodayCount(prev => {
          const newCount = prev + 1;
          const totalHabits = primaryGoalHabits.length;
          const completionRate = totalHabits > 0 ? newCount / totalHabits : 0;
          const newVitality = Math.round(40 + (60 * completionRate));
          updateAvatarVitality(newVitality);
          return newCount;
        });

        // Queue toasts to show after modal
        if (streakValue >= 7 && streakValue % 7 === 0) {
          setTimeout(() => {
            showStreakToast(streakValue);
          }, 6000);
        }
        if (streakValue === 30) {
          setTimeout(() => {
            showAchievementToast(
              '30-Day Milestone! 🏆',
              `${pendingHabit.name} is now a solid habit! Your dedication is incredible! 🌟`
            );
          }, 8000);
        } else if (streakValue === 100) {
          setTimeout(() => {
            showAchievementToast(
              '100 Days Strong! 🎊',
              `${pendingHabit.name} is legendary! You've achieved mastery level! 👑`
            );
          }, 8000);
        }

        track('habit_completed', { habit: pendingHabit.name, streak: streakValue, oldVitality, newVitality });
        setPendingHabit(null);
      }
    } catch (error) {
      console.error('Error saving micro reflection:', error);
      setSheet(false);
      setPendingHabit(null);
      setIsCompleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <HomeHeader 
          userName="Zak" 
          contextualGreeting={getContextualGreeting()}
          onCreateGoal={() => setShowCreateGoal(true)}
        />
        
        {/* Progress Dashboard */}
        <ProgressDashboard 
          onGoalPress={(goalId) => {
            setPrimaryGoal(goalId);
            // Refresh the primary goal state
            const newPrimaryGoal = goalsWithIds.find(g => g.id === goalId);
            if (newPrimaryGoal) {
              setPrimaryGoalState(newPrimaryGoal);
            }
          }}
          onAnalyticsPress={() => {
            // Navigate to analytics tab - would need navigation context in real implementation
            console.log('Navigate to analytics');
          }}
        />
        
        {/* Goal Carousel Section */}
        {isHydrated && (goalsWithIds.length > 0 || primaryGoal) && (
          <FeaturedGoalCarousel
            goals={goalsWithIds.length > 0 ? 
              [...goalsWithIds, ...secondaryGoals].reduce((uniqueGoals, goal) => {
                if (!uniqueGoals.find(g => g.id === goal.id)) {
                  uniqueGoals.push({
                    id: goal.id,
                    title: goal.title,
                    completedHabits: goal.id === primaryGoal?.id ? completedTodayCount : ('completedToday' in goal ? goal.completedToday : 0),
                    totalHabits: goal.id === primaryGoal?.id ? primaryGoalHabits.length : ('habitCount' in goal ? goal.habitCount : (habitsWithIds[goal.id] || []).length),
                    avatar: {
                      type: avatar.type,
                      name: avatar.name,
                      vitality: avatar.vitality,
                    },
                  });
                }
                return uniqueGoals;
              }, [] as any[])
              : primaryGoal ? [{
                id: primaryGoal.id,
                title: primaryGoal.title,
                completedHabits: completedTodayCount,
                totalHabits: primaryGoalHabits.length,
                avatar: {
                  type: avatar.type,
                  name: avatar.name,
                  vitality: avatar.vitality,
                },
              }] : []
            }
            primaryGoalId={primaryGoal?.id || null}
            onGoalPress={(goalId) => {
              setPrimaryGoal(goalId);
              // Refresh the primary goal state
              const newPrimaryGoal = goalsWithIds.find(g => g.id === goalId);
              if (newPrimaryGoal) {
                setPrimaryGoalState(newPrimaryGoal);
              }
            }}
          />
        )}



        {/* Daily Habits - Simplified */}
        <HabitsSection 
          habits={primaryGoalHabits}
          completedTodayCount={completedTodayCount}
          recommendedHabitId={recommendedHabit?.id}
          holdingHabitId={holdingHabit}
          progressValue={progressValue}
          onHabitHoldStart={handleHabitHoldStart}
          onHabitHoldEnd={handleHabitHoldEnd}
        />

        {/* Secondary Goals - Collapsible */}
        <ProgressOverview 
          secondaryGoals={secondaryGoals}
          showSecondaryGoals={showSecondaryGoals}
          onToggleSecondaryGoals={() => setShowSecondaryGoals(!showSecondaryGoals)}
          onGoalPress={setPrimaryGoal}
        />

        {/* Standalone Habits Section - Only show if user has real standalone habits */}
        {isHydrated && standaloneHabits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLeft}>
                <View style={styles.focusIndicator} />
                <Text style={styles.sectionTitle}>Independent Habits</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHabitManagement(true)}>
                <Text style={styles.manageLink}>Manage →</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dataSubtitle}>
              {standaloneHabits.length} habits not tied to specific goals
            </Text>
          </View>
        )}
        
        {/* Empty State - Only show when truly empty */}
        {isHydrated && goalsWithIds.length === 0 && standaloneHabits.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.dataLabel}>Ready to start your journey?</Text>
            <Text style={styles.dataSubtitle}>
              Tap the + button below to create your first habit!
            </Text>
          </View>
        )}
        
        {/* Loading State */}
        {!isHydrated && (
          <View style={styles.section}>
            <Text style={styles.dataLabel}>Setting up your personalized experience...</Text>
          </View>
        )}
      </ScrollView>

      {/* Micro Reflection Sheet */}
      <MicroReflectionSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        onSave={handleMicroReflection}
      />

      {/* Habit Celebration Modal */}
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
          setCompletedHabit(null);
          setIsCompleting(false);
        }}
      />

      {/* Motivational Toast */}
      <MotivationalToast
        visible={toastVisible}
        notification={notification}
        onDismiss={hideToast}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => setShowHabitCreation(true)}
        icon="+"
        showPulse={false}
      />

      {/* Enhanced Habit Creation Wizard */}
      <HabitCreationWizard
        visible={showHabitCreation}
        onClose={() => setShowHabitCreation(false)}
      />
      
      {/* Create Goal Modal */}
      <CreateGoalModal
        visible={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
        onGoalCreated={() => {
          // Data will refresh automatically via useEffect
          console.log('Goal created from home screen');
        }}
      />

      {/* Habit Management Screen */}
      <HabitManagementScreen
        visible={showHabitManagement}
        onClose={() => setShowHabitManagement(false)}
      />


    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl || theme.spacing.xl * 1.5,
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginTop: theme.spacing.xs,
    maxWidth: '90%',
  },
  avatarInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  avatarVitalityText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  avatarMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  greeting: {
    ...theme.type.hero,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.type.body,
    color: theme.colors.text.secondary,
  },
  // Primary Goal Card Styles
  primaryGoalCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  primaryGoalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  primaryGoalInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  primaryGoalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  primaryGoalBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeGoalLink: {
    fontSize: 12,
    color: theme.colors.interactive.primary,
    fontWeight: '500',
  },
  primaryGoalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  primaryGoalSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  primaryGoalAvatar: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarVitality: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: theme.colors.primary,
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Secondary Goals Styles
  secondaryGoalsContainer: {
    marginBottom: theme.spacing.lg,
  },
  secondaryGoalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  secondaryGoalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  secondaryGoalCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: 4,
    minWidth: 140,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  secondaryGoalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  secondaryGoalStats: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  
  // Habit completion styles
  focusCardCompleted: {
    opacity: 0.7,
    backgroundColor: theme.colors.background.tertiary,
  },
  focusCardRecommended: {
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: theme.colors.background.secondary,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  // Simplified Habits Styles
  habitsSection: {
    marginBottom: theme.spacing.xl,
  },
  habitsSectionHeader: {
    marginBottom: theme.spacing.lg,
  },
  habitsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    letterSpacing: -0.5,
  },
  dailyProgressContainer: {
    marginBottom: theme.spacing.sm,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextActionHint: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  nextActionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  nextActionHabit: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  habitCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: theme.spacing.md,
  },
  habitCardCompleted: {
    opacity: 0.8,
    backgroundColor: theme.colors.status.success + '15',
    borderWidth: 1,
    borderColor: theme.colors.status.success + '30',
  },
  habitCardRecommended: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  habitContent: {
    flex: 1,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  habitName: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: -0.3,
    flex: 1,
  },
  habitTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  habitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitStatus: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  habitCheckButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  habitCheckIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  completedText: {
    color: theme.colors.status.success,
    opacity: 0.8,
  },
  completedButton: {
    backgroundColor: theme.colors.success || '#22c55e',
  },
  completedCheckmark: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  habitsList: {
    gap: theme.spacing.md,
  },
  focusCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  focusCardContent: {
    flex: 1,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  focusHabitName: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  focusDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  focusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: 4,
  },
  streakText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  difficultyContainer: {
    alignItems: 'flex-end',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'lowercase',
    marginBottom: 2,
  },
  difficulty_easy: {
    color: '#22c55e',
  },
  difficulty_medium: {
    color: '#3b82f6',
  },
  difficulty_hard: {
    color: '#ef4444',
  },
  tapToComplete: {
    fontSize: 11,
    color: theme.colors.text.muted,
  },
  focusCheckButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  focusCheckIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  progressRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: 'white',
  },
  holdIndicator: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  holdIndicatorText: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 16,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  expandButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginRight: theme.spacing.sm,
  },
  expandIcon: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  focusSubtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontWeight: '500',
    lineHeight: 22,
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  dataSubtitle: {
    fontSize: 13,
    color: theme.colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  manageLink: {
    fontSize: 14,
    color: theme.colors.interactive.primary,
    fontWeight: '500',
  },

  // Compact Progress Styles
  compactProgressContainer: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  compactStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  compactStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  compactProgressBarContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  compactProgressBar: {
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  compactNextActionCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.md,
    shadowColor: theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#10b981' + '30',
  },
  compactNextActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactNextActionEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  compactNextActionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  compactNextActionIcon: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
});