import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/app';
import { HabitCheckbox } from '@/components/HabitCheckbox';
import { HabitStreakStats } from '@/components/HabitStreakStats';
import { HabitStreakCalendar } from '@/components/HabitStreakCalendar';
import { HabitCreationModal } from '@/components/HabitCreationModal';
import { CreateGoalModal } from '@/components/CreateGoalModal';
import { GoalEnhancementCard } from '@/components/GoalEnhancementCard';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';
import { useGoalEnhancement } from '@/lib/goalEnhancement';
import { isHabitCompletedOnDate } from '@/lib/db';
import { AvatarStoryBadge } from '@/components/AvatarStoryBadge';
import { AvatarStoryModal } from '@/components/AvatarStoryModal';

interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  totalHabits: number;
  completedHabits: number;
  category: 'health' | 'learning' | 'career' | 'personal';
  isActive: boolean;
}

interface Habit {
  id: string;
  title: string;
  goalId: string;
  streak: number;
  completedToday: boolean;
  weeklyTarget: number;
  weeklyCompleted: number;
}

// Helper function to calculate goal progress
function calculateGoalProgress(completedHabits: number, totalHabits: number): number {
  if (totalHabits === 0) return 0;
  return Math.round((completedHabits / totalHabits) * 100);
}

// Helper function to determine goal category based on title (simple heuristic)
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

export default function GoalsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Get data from Zustand store
  const { 
    goalsWithIds, 
    habitsWithIds, 
    standaloneHabits,
    isHydrated, 
    avatar,
    getHabitStreak,
    toggleHabitCompletion,
    getGoalStories,
    getStoryProgress,
    checkStoryUnlocks
  } = useAppStore();

  const categoryColors = {
    health: theme.colors.category.health,
    learning: theme.colors.category.learning,
    career: theme.colors.category.career,
    personal: theme.colors.category.personal
  };

  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [selectedGoalForStories, setSelectedGoalForStories] = useState<Goal | null>(null);
  const styles = createStyles(theme);

  // Load and process real data from store
  useEffect(() => {
    if (!isHydrated) return;

    const loadGoalsAndHabits = async () => {
      setLoading(true);
      try {
        // Process goals with their habits
        const processedGoals = await Promise.all(
          goalsWithIds.map(async (goal) => {
            const goalHabits = habitsWithIds[goal.id] || [];
            
            // Calculate completed habits today
            let completedToday = 0;
            for (const habit of goalHabits) {
              try {
                const isCompleted = await isHabitCompletedOnDate(habit.id);
                if (isCompleted) completedToday++;
              } catch (error) {
                console.warn(`Could not check completion for habit ${habit.id}:`, error);
              }
            }

            const progress = calculateGoalProgress(completedToday, goalHabits.length);

            return {
              id: goal.id,
              title: goal.title,
              progress,
              totalHabits: goalHabits.length,
              completedHabits: completedToday,
              category: categorizeGoal(goal.title),
              isActive: true, // All goals from store are considered active
            };
          })
        );

        // Process habits with streak data
        const allHabits = Object.values(habitsWithIds).flat();
        const processedHabits = await Promise.all(
          allHabits.map(async (habit) => {
            try {
              const streak = await getHabitStreak(habit.id);
              const completedToday = await isHabitCompletedOnDate(habit.id);
              
              return {
                id: habit.id,
                title: habit.title,
                goalId: habit.goalId || '',
                streak: streak.current,
                completedToday,
                weeklyTarget: 7, // Default, could be made configurable
                weeklyCompleted: Math.min(streak.current, 7), // Approximate
              };
            } catch (error) {
              console.warn(`Error processing habit ${habit.id}:`, error);
              return {
                id: habit.id,
                title: habit.title,
                goalId: habit.goalId || '',
                streak: 0,
                completedToday: false,
                weeklyTarget: 7,
                weeklyCompleted: 0,
              };
            }
          })
        );

        setGoals(processedGoals);
        setHabits(processedHabits);
      } catch (error) {
        console.error('Error loading goals and habits:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoalsAndHabits();
  }, [isHydrated, goalsWithIds, habitsWithIds, getHabitStreak]);
  
  // Check for story unlocks when goals are loaded
  useEffect(() => {
    if (!isHydrated || goals.length === 0) return;
    
    // Check story unlocks for all goals
    goals.forEach(goal => {
      checkStoryUnlocks(goal.id);
    });
  }, [isHydrated, goals, checkStoryUnlocks]);

  const activeGoals = goals.filter(g => g.isActive);
  const completedGoals = goals.filter(g => !g.isActive);

  // Component to use hook correctly
  const GoalEnhancementWrapper = ({ goal }: { goal: Goal }) => {
    const enhancement = useGoalEnhancement(goal.id);
    
    if (!enhancement || enhancement.suggestions.length === 0) {
      return null;
    }
    
    return (
      <GoalEnhancementCard
        goalId={goal.id}
        goalTitle={goal.title}
        completenessScore={enhancement.completenessScore}
        suggestions={enhancement.suggestions}
      />
    );
  };

  const getGoalHabits = (goalId: string) => {
    return habits.filter(h => h.goalId === goalId);
  };

  const renderAvatar = (avatarType: 'plant' | 'pet' | 'robot' | 'base', size: number = 80) => {
    const props = {
      vitality: avatar.vitality,
      size,
      animated: true,
      style: { marginBottom: 4 }
    };

    switch (avatarType) {
      case 'plant':
        return <PlantAvatar {...props} />;
      case 'pet':
        return <PetAvatar {...props} />;
      case 'robot':
        return <RobotAvatar {...props} />;
      default:
        return <BaseAvatar {...props} />;
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    try {
      await toggleHabitCompletion(habitId);
      
      // Refresh the habits data to show updated completion status
      const updatedHabits = await Promise.all(
        habits.map(async (habit) => {
          if (habit.id === habitId) {
            const completedToday = await isHabitCompletedOnDate(habit.id);
            return { ...habit, completedToday };
          }
          return habit;
        })
      );
      
      setHabits(updatedHabits);
      Alert.alert('Great job! 🎉', 'Habit completion updated!');
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      Alert.alert('Error', 'Could not update habit. Please try again.');
    }
  };

  const handleGoalCreated = (goalId: string) => {
    // The useEffect will automatically refresh the goals list
    console.log('Goal created with ID:', goalId);
  };

  const renderGoalCard = (goal: Goal) => {
    const goalHabits = getGoalHabits(goal.id);
    const categoryColor = categoryColors[goal.category];
    const vitality = avatar.vitality; // Use global avatar vitality
    const vitalityStatus = vitality >= 70 ? 'thriving' : vitality >= 40 ? 'growing' : 'needs care';
    const vitalityEmoji = vitality >= 70 ? '🌟' : vitality >= 40 ? '🌱' : '💚';
    
    return (
      <TouchableOpacity 
        key={goal.id} 
        style={[styles.goalCard, { borderLeftColor: categoryColor }]}
        onPress={() => router.push(`/goal/${goal.id}`)}
        activeOpacity={0.95}
      >
        {/* Header with Category and Progress */}
        <View style={styles.cardHeader}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryIcon, { backgroundColor: `${categoryColor}15` }]}>
              <Text style={styles.categoryEmoji}>{categoryEmojis[goal.category]}</Text>
            </View>
            <View style={styles.categoryDetails}>
              <Text style={[styles.categoryLabel, { color: categoryColor }]}>
                {goal.category.toUpperCase()}
              </Text>
              <Text style={styles.targetDate}>{goal.targetDate}</Text>
            </View>
          </View>
          
          <View style={styles.progressCircle}>
            <View style={[styles.progressRing, { borderColor: `${categoryColor}20` }]}>
              <View 
                style={[
                  styles.progressRingFill, 
                  { 
                    borderColor: categoryColor,
                    transform: [{ rotate: `${(goal.progress / 100) * 360}deg` }]
                  }
                ]} 
              />
              <View style={styles.progressCenter}>
                <Text style={[styles.progressPercent, { color: categoryColor }]}>
                  {goal.progress}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalDescription} numberOfLines={2}>
            {goal.description || `${goal.totalHabits} habits • ${goal.completedHabits} completed today`}
          </Text>
        </View>

        {/* Avatar Companion Section */}
        <View style={styles.avatarCompanion}>
          <View style={styles.avatarDisplay}>
            {renderAvatar(avatar.type, 60)}
          </View>
          <View style={styles.companionInfo}>
            <View style={styles.companionHeader}>
              <Text style={styles.avatarName}>{avatar.name}</Text>
              <View style={styles.vitalityBadge}>
                <Text style={styles.vitalityEmoji}>{vitalityEmoji}</Text>
                <Text style={styles.vitalityText}>{vitalityStatus}</Text>
              </View>
            </View>
            <Text style={styles.personalityText} numberOfLines={1}>
              &quot;Your {avatar.type} companion&quot;
            </Text>
            
            {/* Story Badge */}
            <View style={styles.storyBadgeContainer}>
              <AvatarStoryBadge
                goalId={goal.id}
                stories={getGoalStories(goal.id)}
                progress={getStoryProgress(goal.id)}
                size="medium"
                onPress={() => setSelectedGoalForStories(goal)}
              />
            </View>
          </View>
        </View>

        {/* Habits Summary */}
        <View style={styles.habitsFooter}>
          <View style={styles.habitsInfo}>
            <Text style={styles.habitsCount}>
              {goal.completedHabits}/{goal.totalHabits} completed today
            </Text>
            <View style={styles.habitsDots}>
              {goalHabits.slice(0, 4).map((habit, index) => (
                <View 
                  key={habit.id}
                  style={[
                    styles.habitDot,
                    { 
                      backgroundColor: habit.completedToday ? categoryColor : theme.colors.background.tertiary,
                      borderColor: habit.completedToday ? categoryColor : theme.colors.line
                    }
                  ]}
                />
              ))}
              {goal.totalHabits > 4 && (
                <Text style={styles.moreHabits}>+{goal.totalHabits - 4}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: `${categoryColor}10` }]}
            onPress={() => router.push(`/goal/${goal.id}`)}
          >
            <Text style={[styles.quickActionText, { color: categoryColor }]}>View</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>{activeGoals.length} active • {completedGoals.length} completed</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.analyticsButton}
            onPress={() => router.push('/(tabs)/analytics')}
          >
            <Text style={styles.analyticsButtonText}>📊 Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.newGoalButton}
            onPress={() => setShowNewGoal(true)}
          >
            <Text style={styles.newGoalButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your goals...</Text>
        </View>
      )}

      {/* Empty State */}
      {!loading && activeGoals.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>No Goals Yet</Text>
          <Text style={styles.emptyDescription}>
            Start your journey by creating your first goal!
          </Text>
          <TouchableOpacity 
            style={styles.emptyActionButton}
            onPress={() => setShowNewGoal(true)}
          >
            <Text style={styles.emptyActionText}>Create Your First Goal</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Overview */}
      {!loading && activeGoals.length > 0 && (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.primaryStat]}>
          <View style={styles.statIcon}>
            <Text style={styles.statEmoji}>📈</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>
              {goals.length > 0 ? Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length) : 0}%
            </Text>
            <Text style={styles.statLabel}>Avg Progress</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Text style={styles.statEmoji}>🎯</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{habits.length}</Text>
            <Text style={styles.statLabel}>Total Habits</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Text style={styles.statEmoji}>🔥</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>
              {habits.length > 0 ? Math.round(habits.reduce((acc, habit) => acc + habit.streak, 0) / habits.length) : 0}
            </Text>
            <Text style={styles.statLabel}>Avg Streak</Text>
          </View>
        </View>
      </View>
      )}

      {!loading && activeGoals.length > 0 && (

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Goal Enhancement Suggestions */}
        {activeGoals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Boost Your Success</Text>
            {activeGoals.slice(0, 2).map((goal) => (
              <GoalEnhancementWrapper key={goal.id} goal={goal} />
            ))}
          </>
        )}

        {/* Active Goals */}
        <Text style={styles.sectionTitle}>Active Goals</Text>
        <View style={styles.goalsGrid}>
          {activeGoals.map(renderGoalCard)}
        </View>

        {/* Today's Habits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Habits</Text>
          <TouchableOpacity 
            style={styles.addHabitButton}
            onPress={() => setShowNewHabit(true)}
          >
            <Text style={styles.addHabitButtonText}>+ Add Habit</Text>
          </TouchableOpacity>
        </View>
        
        {/* Habit Streak Stats */}
        <HabitStreakStats
          currentStreak={12}
          longestStreak={28}
          completionRate={85}
          totalCompletions={156}
        />
        
        {/* Habit Checkboxes */}
        <View style={styles.habitsContainer}>
          {habits.filter(h => activeGoals.some(g => g.id === h.goalId)).map((habit) => (
            <HabitCheckbox
              key={habit.id}
              title={habit.title}
              completed={habit.completedToday}
              currentStreak={habit.streak}
              onToggle={() => handleCompleteHabit(habit.id)}
            />
          ))}
        </View>

        {/* Habit Progress Example */}
        <Text style={styles.sectionTitle}>Reading Habit Progress</Text>
        <HabitStreakCalendar
          title="Read 30 minutes daily"
          completions={[
            { date: '2024-01-08', completed: true },
            { date: '2024-01-09', completed: true },
            { date: '2024-01-10', completed: false },
            { date: '2024-01-11', completed: true },
            { date: '2024-01-12', completed: true },
            { date: '2024-01-13', completed: true },
            { date: '2024-01-14', completed: true },
            { date: '2024-01-15', completed: false },
            { date: '2024-01-16', completed: true },
            { date: '2024-01-17', completed: true },
            { date: '2024-01-18', completed: true },
            { date: '2024-01-19', completed: true },
            { date: '2024-01-20', completed: true },
            { date: '2024-01-21', completed: true },
          ]}
          onDatePress={(date) => console.log('Date pressed:', date)}
        />

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed Goals</Text>
            <View style={styles.goalsGrid}>
              {completedGoals.map(renderGoalCard)}
            </View>
          </>
        )}
      </ScrollView>
      )}


      {/* Create Goal Modal */}
      <CreateGoalModal
        visible={showNewGoal}
        onClose={() => setShowNewGoal(false)}
        onGoalCreated={handleGoalCreated}
      />

      {/* Habit Creation Modal */}
      <HabitCreationModal
        visible={showNewHabit}
        onClose={() => setShowNewHabit(false)}
      />
      
      {/* Avatar Story Modal */}
      {selectedGoalForStories && (
        <AvatarStoryModal
          visible={!!selectedGoalForStories}
          onClose={() => setSelectedGoalForStories(null)}
          goalId={selectedGoalForStories.id}
          goalTitle={selectedGoalForStories.title}
          stories={getGoalStories(selectedGoalForStories.id)}
          progress={getStoryProgress(selectedGoalForStories.id)}
          avatarType={avatar.type}
          avatarName={avatar.name}
          avatarVitality={avatar.vitality}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.type.hero,
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  analyticsButton: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  analyticsButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  newGoalButton: {
    backgroundColor: theme.colors.interactive.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    ...theme.shadows.sm,
  },
  newGoalButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 16,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  primaryStat: {
    backgroundColor: theme.colors.interactive.primary + '10',
    borderWidth: 1,
    borderColor: theme.colors.interactive.primary + '20',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  statEmoji: {
    fontSize: 16,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  statTrend: {
    fontSize: 10,
    color: theme.colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.type.section,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  addHabitButton: {
    backgroundColor: theme.colors.interactive.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
  },
  addHabitButtonText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  goalsGrid: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  goalCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: 0,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  targetDate: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  progressCircle: {
    marginLeft: theme.spacing.md,
  },
  progressRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressRingFill: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: 'currentColor',
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: 24,
  },
  goalDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  avatarCompanion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary + '40',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.line + '30',
  },
  avatarDisplay: {
    marginRight: theme.spacing.md,
  },
  companionInfo: {
    flex: 1,
  },
  companionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  vitalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  vitalityEmoji: {
    fontSize: 12,
  },
  vitalityText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  personalityText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  storyBadgeContainer: {
    marginTop: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  habitsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  habitsInfo: {
    flex: 1,
  },
  habitsCount: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  habitsDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  habitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  moreHabits: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  quickActionButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
    marginLeft: theme.spacing.md,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  habitsContainer: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  habitCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    ...theme.type.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitGoal: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  habitStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  habitStreak: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  habitWeekly: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  habitCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitCheckCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  checkMark: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Modal styles
  // Modal styles (for new goal modal only)
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  modalClose: {
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  modalTitle: {
    ...theme.type.section,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  modalSave: {
    // Base styles for save button
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    color: theme.colors.interactive.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    color: theme.colors.interactive.disabledText,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  newGoalForm: {
    flex: 1,
  },
  formSection: {
    marginBottom: theme.spacing.xl,
  },
  formLabel: {
    ...theme.type.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  formInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
  },
  formTextArea: {
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  
  // Test button styles
  testButtonContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  testButton: {
    backgroundColor: theme.colors.interactive.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  testButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  emptyActionButton: {
    backgroundColor: theme.colors.interactive.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 24,
    shadowColor: theme.colors.interactive.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyActionText: {
    color: theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});