import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { HabitCheckbox } from '@/components/HabitCheckbox';
import { HabitStreakStats } from '@/components/HabitStreakStats';
import { HabitStreakCalendar } from '@/components/HabitStreakCalendar';
import { HabitCreationModal } from '@/components/HabitCreationModal';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  habits: string[];
  why: string;
  obstacles: string[];
  category: 'health' | 'learning' | 'career' | 'personal';
  isActive: boolean;
  avatar: {
    type: 'plant' | 'pet' | 'robot' | 'base';
    personality: string;
    name: string;
  };
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

// Dummy goals data
const dummyGoals: Goal[] = [
  {
    id: '1',
    title: 'Read 12 books this year',
    description: 'Expand my knowledge and improve focus through regular reading',
    targetDate: 'December 2024',
    progress: 75,
    habits: ['Read 30 minutes daily', 'Take reading notes'],
    why: 'I want to become more knowledgeable and improve my ability to focus deeply on complex topics.',
    obstacles: ['Limited time', 'Digital distractions', 'Finding good books'],
    category: 'learning',
    isActive: true,
    avatar: {
      type: 'plant',
      personality: 'wise and growing',
      name: 'Sage'
    }
  },
  {
    id: '2',
    title: 'Run a 5K race',
    description: 'Build cardiovascular fitness and complete my first 5K',
    targetDate: 'March 2024',
    progress: 60,
    habits: ['Morning jog 3x/week', 'Strength training'],
    why: 'I want to improve my health and prove to myself that I can achieve athletic goals.',
    obstacles: ['Weather conditions', 'Motivation', 'Knee pain'],
    category: 'health',
    isActive: true,
    avatar: {
      type: 'pet',
      personality: 'energetic and loyal',
      name: 'Runner'
    }
  },
  {
    id: '3',
    title: 'Learn Spanish conversationally',
    description: 'Achieve conversational fluency for travel and career',
    targetDate: 'June 2024',
    progress: 45,
    habits: ['Daily Duolingo', 'Spanish podcast', 'Practice with native speakers'],
    why: 'I want to connect with Spanish-speaking communities and advance my career opportunities.',
    obstacles: ['Grammar complexity', 'Speaking confidence', 'Finding practice partners'],
    category: 'learning',
    isActive: true,
    avatar: {
      type: 'robot',
      personality: 'analytical and persistent',
      name: 'Linguabot'
    }
  }
];

// Dummy habits data
const dummyHabits: Habit[] = [
  {
    id: '1',
    title: 'Read 30 minutes daily',
    goalId: '1',
    streak: 12,
    completedToday: true,
    weeklyTarget: 7,
    weeklyCompleted: 5
  },
  {
    id: '2',
    title: 'Morning jog 3x/week',
    goalId: '2',
    streak: 8,
    completedToday: false,
    weeklyTarget: 3,
    weeklyCompleted: 2
  },
  {
    id: '3',
    title: 'Daily Duolingo',
    goalId: '3',
    streak: 15,
    completedToday: true,
    weeklyTarget: 7,
    weeklyCompleted: 6
  }
];

const categoryEmojis = {
  health: '💪',
  learning: '📚',
  career: '💼',
  personal: '🌟'
};

export default function GoalsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const categoryColors = {
    health: theme.colors.category.health,
    learning: theme.colors.category.learning,
    career: theme.colors.category.career,
    personal: theme.colors.category.personal
  };
  const [goals] = useState<Goal[]>(dummyGoals);
  const [habits] = useState<Habit[]>(dummyHabits);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const styles = createStyles(theme);

  const activeGoals = goals.filter(g => g.isActive);
  const completedGoals = goals.filter(g => !g.isActive);

  const getGoalHabits = (goalId: string) => {
    return habits.filter(h => h.goalId === goalId);
  };

  const renderAvatar = (goal: Goal, size: number = 80) => {
    const vitality = goal.progress; // Use progress as vitality level
    const props = {
      vitality,
      size,
      animated: true,
      style: { marginBottom: 4 }
    };

    switch (goal.avatar.type) {
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

  const handleCompleteHabit = (habitId: string) => {
    // In real app, would update habit completion
    console.log('Complete habit:', habitId);
    Alert.alert('Great job! 🎉', 'Habit marked as complete for today.');
  };

  const handleSaveNewGoal = () => {
    if (newGoalTitle.trim()) {
      // In real app, would save to store
      console.log('New goal:', { title: newGoalTitle, description: newGoalDescription });
      setNewGoalTitle('');
      setNewGoalDescription('');
      setShowNewGoal(false);
    }
  };

  const renderGoalCard = (goal: Goal) => {
    const goalHabits = getGoalHabits(goal.id);
    const categoryColor = categoryColors[goal.category];
    const vitality = goal.progress;
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
            {goal.description}
          </Text>
        </View>

        {/* Avatar Companion Section */}
        <View style={styles.avatarCompanion}>
          <View style={styles.avatarDisplay}>
            {renderAvatar(goal, 60)}
          </View>
          <View style={styles.companionInfo}>
            <View style={styles.companionHeader}>
              <Text style={styles.avatarName}>{goal.avatar.name}</Text>
              <View style={styles.vitalityBadge}>
                <Text style={styles.vitalityEmoji}>{vitalityEmoji}</Text>
                <Text style={styles.vitalityText}>{vitalityStatus}</Text>
              </View>
            </View>
            <Text style={styles.personalityText} numberOfLines={1}>
              &quot;{goal.avatar.personality}&quot;
            </Text>
          </View>
        </View>

        {/* Habits Summary */}
        <View style={styles.habitsFooter}>
          <View style={styles.habitsInfo}>
            <Text style={styles.habitsCount}>
              {goalHabits.filter(h => h.completedToday).length}/{goalHabits.length} completed today
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
              {goalHabits.length > 4 && (
                <Text style={styles.moreHabits}>+{goalHabits.length - 4}</Text>
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
        <TouchableOpacity 
          style={styles.newGoalButton}
          onPress={() => setShowNewGoal(true)}
        >
          <Text style={styles.newGoalButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Test Enhanced Goals Button */}
      <View style={styles.testButtonContainer}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/test-goals')}
        >
          <Text style={styles.testButtonText}>🎯 Test Enhanced Goal Cards</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.primaryStat]}>
          <View style={styles.statIcon}>
            <Text style={styles.statEmoji}>📈</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Avg Progress</Text>
            <Text style={styles.statTrend}>+5% this week</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Text style={styles.statEmoji}>🎯</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>23</Text>
            <Text style={styles.statLabel}>Total Habits</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Text style={styles.statEmoji}>🔥</Text>
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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


      {/* New Goal Modal */}
      <Modal
        visible={showNewGoal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewGoal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNewGoal(false)}>
                <Text style={styles.modalClose}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Goal</Text>
              <TouchableOpacity 
                onPress={handleSaveNewGoal}
                style={[
                  styles.modalSave,
                  !newGoalTitle.trim() && styles.modalSaveDisabled
                ]}
                disabled={!newGoalTitle.trim()}
              >
                <Text style={[
                  styles.modalSaveText,
                  !newGoalTitle.trim() && styles.modalSaveTextDisabled
                ]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.newGoalForm}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Goal Title</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="What do you want to achieve?"
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                  autoFocus
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Add more details about your goal..."
                  value={newGoalDescription}
                  onChangeText={setNewGoalDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Habit Creation Modal */}
      <HabitCreationModal
        visible={showNewHabit}
        onClose={() => setShowNewHabit(false)}
      />
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
    textAlignVertical: 'top',
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
});