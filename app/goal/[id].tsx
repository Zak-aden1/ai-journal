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
} from 'react-native-reanimated';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import { AvatarRenderer } from '@/components/avatars';
import { AVATAR_PERSONALITIES } from '@/lib/avatarPersonality';
import { initializeChatAI } from '@/services/ai/chat';
import { getAIConfig } from '@/services/ai/config';
import { generateDailyThoughts, getTodaysThoughts, getTimeUntilNextGeneration, canGenerateDailyThoughts } from '@/services/ai/thoughts';
import type { GoalContext } from '@/services/ai/chat';
import { AIThoughtCard } from '@/components/ai/AIThoughtCard';
import { NextActionCard } from '@/components/goal/NextActionCard';
import { isHabitCompletedOnDate } from '@/lib/db';

interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  totalHabits: number;
  completedHabits: number;
  habits: {
    id: string;
    title: string;
    completed: boolean;
    streak: number;
  }[];
  why?: string;
  obstacles?: string[];
  category: 'health' | 'learning' | 'career' | 'personal';
  isActive: boolean;
}

// Helper functions
function calculateGoalProgress(completedHabits: number, totalHabits: number): number {
  if (totalHabits === 0) return 0;
  return Math.round((completedHabits / totalHabits) * 100);
}

function categorizeGoal(title: string): 'health' | 'learning' | 'career' | 'personal' {
  const lower = title.toLowerCase();
  if (/(fitness|health|run|exercise|workout|diet|sleep)/i.test(lower)) return 'health';
  if (/(learn|study|read|course|language|skill)/i.test(lower)) return 'learning';
  if (/(career|job|work|business|promotion)/i.test(lower)) return 'career';
  return 'personal';
}

const categoryEmojis = {
  health: '💪',
  learning: '📚',
  career: '💼',
  personal: '🌟'
};

export default function GoalDetailPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Get data from store
  const { 
    goalsWithIds, 
    habitsWithIds, 
    goalMeta,
    avatar,
    isHydrated,
    getHabitStreak,
    toggleHabitCompletion,
  } = useAppStore();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [thoughtLoading, setThoughtLoading] = useState(false);
  const [thoughtError, setThoughtError] = useState<string | null>(null);
  const [avatarThought, setAvatarThought] = useState<{ text: string; updatedAt: number } | null>(null);
  const [canGenerateThought, setCanGenerateThought] = useState(true);
  const [nextAvailableIn, setNextAvailableIn] = useState<string | null>(null);
  // Next Action state (must be before any early returns)
  const [snoozed, setSnoozed] = useState<Set<string>>(new Set());
  const styles = createStyles(theme);
  
  // Animation values
  const progressWidth = useSharedValue(0);
  const avatarScale = useSharedValue(0.8);
  const vitalityOpacity = useSharedValue(0);
  
  // Helper to load goal data from store (re-usable)
  const loadGoalData = useCallback(async () => {
      setLoading(true);
      try {
        // Find the goal in store
        const storeGoal = goalsWithIds.find(g => g.id === id);
        if (!storeGoal) {
          setGoal(null);
          setLoading(false);
          return;
        }

        // Get goal's habits
        const goalHabits = habitsWithIds[id] || [];
        
        // Process habits with completion status
        let completedToday = 0;
        const processedHabits = await Promise.all(
          goalHabits.map(async (habit) => {
            try {
              const streak = await getHabitStreak(habit.id);
              const completed = await isHabitCompletedOnDate(habit.id);
              if (completed) completedToday++;
              
              return {
                id: habit.id,
                title: habit.title,
                completed,
                streak: streak.current,
              };
            } catch (error) {
              console.warn(`Error processing habit ${habit.id}:`, error);
              return {
                id: habit.id,
                title: habit.title,
                completed: false,
                streak: 0,
              };
            }
          })
        );

        // Get goal metadata
        const meta = goalMeta[id] || {};
        
        // Build complete goal object
        const completeGoal: Goal = {
          id: storeGoal.id,
          title: storeGoal.title,
          description: meta.why_text,
          progress: calculateGoalProgress(completedToday, goalHabits.length),
          totalHabits: goalHabits.length,
          completedHabits: completedToday,
          habits: processedHabits,
          why: meta.why_text,
          obstacles: meta.obstacles || [],
          category: categorizeGoal(storeGoal.title),
          isActive: true,
        };

        setGoal(completeGoal);
      } catch (error) {
        console.error('Error loading goal data:', error);
        setGoal(null);
      } finally {
        setLoading(false);
      }
  }, [id, goalsWithIds, habitsWithIds, goalMeta, getHabitStreak]);

  // Initial load
  useEffect(() => {
    if (!isHydrated || !id) return;
    loadGoalData();
  }, [isHydrated, id, loadGoalData]);

  // Animation effects - must be called before any conditional returns
  useEffect(() => {
    if (!goal || loading) return;
    
    // Animate avatar entrance
    avatarScale.value = withSpring(1, { damping: 15 });
    
    // Animate vitality badge
    vitalityOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    
    // Animate progress bar
    progressWidth.value = withDelay(400, withTiming(goal.progress, { duration: 1000 }));
  }, [goal?.progress, avatarScale, vitalityOpacity, progressWidth, goal, loading]);

  // Load today's thoughts availability and cached value
  useEffect(() => {
    const run = async () => {
      if (!goal) return;
      try {
        // Ensure AI is configured
        initializeChatAI(getAIConfig());

        const todays = await getTodaysThoughts(goal.id);
        if (todays) {
          setAvatarThought({ text: todays.thoughts, updatedAt: new Date(todays.generated_at).getTime() });
          setCanGenerateThought(false);
          setNextAvailableIn(await getTimeUntilNextGeneration(goal.id));
        } else {
          setAvatarThought(null);
          const allowed = await canGenerateDailyThoughts(goal.id);
          setCanGenerateThought(allowed);
          if (!allowed) setNextAvailableIn(await getTimeUntilNextGeneration(goal.id));
        }
      } catch (e) {
        console.warn('Thoughts init error', e);
      }
    };
    run();
  }, [goal?.id]);

  const buildGoalContext = (): GoalContext | null => {
    if (!goal) return null;
    // Map habits for AI context (id/title only)
    const mappedHabits = goal.habits.map(h => ({ id: h.id, title: h.title } as any));
    const personality = AVATAR_PERSONALITIES[avatar.type].traits;
    return {
      id: goal.id,
      title: goal.title,
      why: goal.why,
      obstacles: goal.obstacles || [],
      habits: mappedHabits as any,
      completedHabitsToday: goal.completedHabits,
      totalHabits: goal.totalHabits,
      avatar: {
        type: avatar.type,
        name: avatar.name,
        vitality: avatar.vitality,
        personality,
      },
      userProgress: {
        streaks: Object.fromEntries(goal.habits.map(h => [h.id, h.streak])),
        recentCompletions: goal.completedHabits,
        overallProgress: goal.progress,
      },
    };
  };

  const handleGenerateThoughts = async () => {
    if (!goal) return;
    setThoughtError(null);
    setThoughtLoading(true);
    try {
      const context = buildGoalContext();
      if (!context) throw new Error('Missing goal context');
      const result = await generateDailyThoughts(context);
      setAvatarThought({ text: result.thoughts, updatedAt: new Date(result.generated_at).getTime() });
      setCanGenerateThought(false);
      setNextAvailableIn(await getTimeUntilNextGeneration(goal.id));
    } catch (e: any) {
      setThoughtError(e?.message || 'Failed to generate thoughts');
    } finally {
      setThoughtLoading(false);
    }
  };

  // Animated styles - must be called before any conditional returns
  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const animatedVitalityStyle = useAnimatedStyle(() => ({
    opacity: vitalityOpacity.value,
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
            <Text style={styles.loadingText}>Loading goal details...</Text>
          </View>
        </View>
      </>
    );
  }
  
  // Goal not found state
  if (!goal) {
    return (
      <>
        <Stack.Screen options={{ title: 'Goal Not Found' }} />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Goal Not Found</Text>
            <Text style={styles.errorText}>
              This goal might have been deleted or the link is incorrect.
            </Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => router.push('/(tabs)/goals')}
            >
              <Text style={styles.errorButtonText}>View All Goals</Text>
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

  const categoryColor = categoryColors[goal.category];

  const renderAvatar = () => (
    <AvatarRenderer type={avatar.type} vitality={avatar.vitality} size={120} animated />
  );

  const getVitalityLevel = (vitality: number) => {
    if (vitality >= 80) return { label: 'Thriving', color: '#22C55E', emoji: '🌟' };
    if (vitality >= 60) return { label: 'Growing', color: '#3B82F6', emoji: '🌱' };
    if (vitality >= 40) return { label: 'Developing', color: '#F59E0B', emoji: '🌿' };
    return { label: 'Starting', color: '#EF4444', emoji: '🌱' };
  };

  const vitalityInfo = getVitalityLevel(avatar.vitality);

  // Next Action heuristics
  const nextHabit = goal?.habits.find(h => !h.completed && !snoozed.has(h.id));

  const handleCompleteNext = async () => {
    try {
      if (!nextHabit) return;
      await toggleHabitCompletion(nextHabit.id);
      await loadGoalData();
    } catch (e) {
      console.warn('Failed to toggle habit', e);
    }
  };

  const handleSnooze = () => {
    if (!nextHabit) return;
    setSnoozed(prev => new Set([...prev, nextHabit.id]));
  };

  const handleReschedule = () => {
    Alert.alert('Reschedule', 'Scheduling editor coming soon.');
  };

  // Action handlers with feedback
  const handleChatWithAvatar = () => {
    if (!goal) return;
    router.push(`/chat/${goal.id}`);
  };

  const handleEditGoal = () => {
    Alert.alert(
      "✏️ Edit Goal",
      "Goal editing feature coming soon! You'll be able to modify your goal details, timeline, and avatar settings.",
      [{ text: "Got it!", style: "default" }]
    );
  };

  const handleQuickJournal = () => {
    Alert.alert(
      "📝 Quick Journal",
      "Quick journaling about this goal is coming soon! You'll be able to quickly reflect on your progress and thoughts.",
      [{ text: "Got it!", style: "default" }]
    );
  };

  const handleProgressTap = () => {
    Alert.alert(
      "📊 Progress Details",
      `You're ${goal.progress}% complete with your goal "${goal.title}"!\n\nCompleted: ${goal.completedHabits}/${goal.totalHabits} habits today\nAvatar Vitality: ${avatar.vitality}%`,
      [{ text: "Keep going!", style: "default" }]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: goal.title,
          headerBackTitle: "Back",
          headerTintColor: "#22C55E",
          headerTitleStyle: {
            color: '#FFFFFF',
          },
          headerRight: () => (
            <TouchableOpacity style={styles.headerEditButton} onPress={handleEditGoal}>
              <Text style={styles.headerEditButtonText}>Edit</Text>
            </TouchableOpacity>
          ),
        }} 
      />
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Hero Section */}
        <View style={styles.avatarHero}>
          <TouchableOpacity onPress={handleChatWithAvatar} activeOpacity={0.8}>
            <Animated.View style={[styles.avatarContainer, animatedAvatarStyle]}>
              {renderAvatar()}
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{avatar.name}</Text>
            <Text style={styles.avatarPersonality}>Your {avatar.type} companion</Text>
            <Animated.View style={[styles.vitalityContainer, animatedVitalityStyle]}>
              <TouchableOpacity
                onPress={() => Alert.alert(
                  `${vitalityInfo.emoji} ${vitalityInfo.label}`,
                  `Your avatar's vitality is at ${avatar.vitality}%. This reflects your progress and engagement with the goal. Keep up the great work!`,
                  [{ text: "Thanks!", style: "default" }]
                )}
                activeOpacity={0.7}
              >
                <View style={[styles.vitalityBadge, { backgroundColor: vitalityInfo.color + '20' }]}>
                  <Text style={styles.vitalityEmoji}>{vitalityInfo.emoji}</Text>
                  <Text style={[styles.vitalityLabel, { color: vitalityInfo.color }]}>
                    {vitalityInfo.label}
                  </Text>
                  <Text style={[styles.vitalityPercent, { color: vitalityInfo.color }]}>
                    {avatar.vitality}%
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Goal Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.goalDescription}>
            {goal.description || `Working towards ${goal.title} with ${goal.totalHabits} supporting habits.`}
          </Text>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
              <Text style={styles.categoryEmoji}>{categoryEmojis[goal.category]}</Text>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {goal.category}
              </Text>
            </View>
          </View>
        </View>
        {/* Next Action */}
        {nextHabit && (
          <View style={styles.section}>
            <NextActionCard
              title={nextHabit.title}
              subtitle={'Suggested now'}
              accentColor={categoryColor}
              estimatedMinutes={5}
              onComplete={handleCompleteNext}
              onSnooze={handleSnooze}
              onReschedule={handleReschedule}
            />
          </View>
        )}

        {/* My Why Section */}
        {goal.why && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionEmoji}>❤️</Text>
              </View>
              <Text style={styles.sectionTitle}>My Why</Text>
            </View>
            <View style={[styles.card, styles.whyCard]}>
              <Text style={styles.whyText}>{goal.why}</Text>
            </View>
          </View>
        )}

        {/* Avatar's Thoughts */}
        <View style={styles.section}>
          <AIThoughtCard
            avatarName={avatar.name}
            text={avatarThought?.text}
            updatedAt={avatarThought?.updatedAt}
            loading={thoughtLoading}
            error={thoughtError || undefined}
            canGenerate={canGenerateThought}
            nextAvailableIn={nextAvailableIn || undefined}
            accentColor={categoryColor}
            provenance={[`Streak ${Math.max(...goal.habits.map(h => h.streak), 0)}`, `${goal.completedHabits}/${goal.totalHabits} today`]}
            onGenerate={handleGenerateThoughts}
          />
        </View>

        {/* Avatar Companion Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionEmoji}>🤖</Text>
            </View>
            <Text style={styles.sectionTitle}>Avatar Companion</Text>
          </View>
          <View style={[styles.card, styles.companionCard]}>
            <Text style={styles.companionName}>{avatar.name}</Text>
            <Text style={styles.companionType}>{avatar.type.charAt(0).toUpperCase() + avatar.type.slice(1)} Avatar</Text>
            <Text style={styles.companionPersonality}>&quot;Your {avatar.type} companion&quot;</Text>
            <Text style={styles.companionSpecialty}>Specializes in {goal.category} goals</Text>
            <View style={styles.companionBadge}>
              <Text style={styles.companionBadgeText}>Growing Together 🌱</Text>
            </View>
          </View>
        </View>
        
        {/* Progress Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionEmoji}>📊</Text>
            </View>
            <Text style={styles.sectionTitle}>Progress & Timeline</Text>
          </View>
          <TouchableOpacity 
            style={[styles.card, styles.progressCard]}
            onPress={handleProgressTap}
            activeOpacity={0.9}
          >
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{goal.progress}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{goal.completedHabits}/{goal.totalHabits}</Text>
                <Text style={styles.statLabel}>Habits Today</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    animatedProgressStyle,
                    { 
                      backgroundColor: categoryColor
                    }
                  ]} 
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Milestones Section */}
        <View style={styles.milestonesSection}>
          <View style={styles.milestonesSectionHeader}>
            <Text style={styles.milestonesIcon}>⭐</Text>
            <Text style={styles.milestonesSectionTitle}>Milestones</Text>
          </View>
          <View style={styles.milestonesCard}>
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneCheckCompleted}>
                <Text style={styles.milestoneCheckText}>✓</Text>
              </View>
              <Text style={styles.milestoneText}>Started daily habit routine</Text>
            </View>
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneCheckCompleted}>
                <Text style={styles.milestoneCheckText}>✓</Text>
              </View>
              <Text style={styles.milestoneText}>Completed first month</Text>
            </View>
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneCheck}>
                <Text style={styles.milestoneNumber}>3</Text>
              </View>
              <Text style={styles.milestoneTextPending}>Reach 80% completion</Text>
            </View>
          </View>
        </View>
        
        {/* Habits Section */}
        {goal.habits.length > 0 && (
          <View style={styles.habitsSection}>
            <View style={styles.habitsSectionHeader}>
              <Text style={styles.habitsIcon}>🔄</Text>
              <Text style={styles.habitsSectionTitle}>Supporting Habits</Text>
            </View>
            <View style={styles.habitsCard}>
              {goal.habits.map((habit) => (
                <View key={habit.id} style={styles.habitItem}>
                  <View style={[
                    styles.habitDot,
                    { backgroundColor: habit.completed ? '#22C55E' : '#6B7280' }
                  ]} />
                  <Text style={[
                    styles.habitText,
                    habit.completed && styles.habitTextCompleted
                  ]}>
                    {habit.title}
                  </Text>
                  {habit.streak > 0 && (
                    <Text style={styles.habitStreak}>🔥{habit.streak}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Obstacles Section */}
        {goal.obstacles && goal.obstacles.length > 0 && (
          <View style={styles.obstaclesSection}>
            <View style={styles.obstaclesSectionHeader}>
              <Text style={styles.obstaclesIcon}>⚠️</Text>
              <Text style={styles.obstaclesSectionTitle}>Potential Obstacles</Text>
            </View>
            <View style={styles.obstaclesCard}>
              {goal.obstacles.map((obstacle, index) => (
                <View key={index} style={styles.obstacleItem}>
                  <View style={styles.obstacleDot} />
                  <Text style={styles.obstacleText}>{obstacle}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleChatWithAvatar}
          >
            <Text style={styles.primaryActionText}>💬 Chat with {avatar.name}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={handleQuickJournal}
          >
            <Text style={styles.secondaryActionText}>📝 Quick Journal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.tertiaryAction]}
            onPress={handleEditGoal}
          >
            <Text style={styles.tertiaryActionText}>✏️ Edit Goal</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
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
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  avatarHero: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInfo: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  avatarPersonality: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  vitalityContainer: {
    alignItems: 'center',
  },
  vitalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    gap: theme.spacing.xs,
  },
  vitalityEmoji: {
    fontSize: 16,
  },
  vitalityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  vitalityPercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Loading state
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

  // Error state
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
  descriptionSection: {
    marginBottom: theme.spacing.xl,
  },
  categoryContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    gap: theme.spacing.xs,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  goalDescription: {
    fontSize: 18,
    color: theme.colors.text.secondary,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },

  // Enhanced section styles
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    ...theme.shadows?.sm,
  },
  whyCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  whyText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  companionCard: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  companionName: {
    fontSize: 20,
    color: theme.colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  companionType: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  companionPersonality: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: theme.spacing.sm,
  },
  companionSpecialty: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  companionBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
  },
  companionBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressCard: {
    gap: theme.spacing.lg,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.background.tertiary,
  },
  progressBarContainer: {
    alignItems: 'center',
  },

  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    minWidth: '2%',
  },

  milestonesSection: {
    marginBottom: theme.spacing.xl,
  },
  milestonesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  milestonesIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  milestonesSectionTitle: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  milestonesCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneCheckCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.success || '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  milestoneCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  milestoneCheckText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneNumber: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  milestoneTextPending: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    flex: 1,
  },

  habitsSection: {
    marginBottom: theme.spacing.xl,
  },
  habitsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  habitsIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  habitsSectionTitle: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  habitsCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success || '#22C55E',
    marginRight: theme.spacing.md,
  },
  habitText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  habitTextCompleted: {
    color: theme.colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  habitStreak: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  obstaclesSection: {
    marginBottom: theme.spacing.xl,
  },
  obstaclesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  obstaclesIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  obstaclesSectionTitle: {
    fontSize: 18,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  obstaclesCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  obstacleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  obstacleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.warning || '#F59E0B',
    marginRight: theme.spacing.md,
  },
  obstacleText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },

  actions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: theme.colors.primary,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  secondaryActionText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  tertiaryActionText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
