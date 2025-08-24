import React, { useEffect } from 'react';
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
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AvatarRenderer } from '@/components/avatars';

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
  vitality: number;
}

// Dummy goals data - In real app, this would come from the store
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
    },
    vitality: 85
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
    },
    vitality: 72
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
    },
    vitality: 45
  }
];

const categoryEmojis = {
  health: '💪',
  learning: '📚',
  career: '💼',
  personal: '🌟'
};

export default function GoalDetailPage() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const styles = createStyles(theme);
  
  // Animation values
  const progressWidth = useSharedValue(0);
  const avatarScale = useSharedValue(0.8);
  const vitalityOpacity = useSharedValue(0);
  
  // Find the goal by ID (in real app, this would come from store)
  const goal = dummyGoals.find(g => g.id === id);

  // Animation effects - must be called before any conditional returns
  useEffect(() => {
    if (!goal) return;
    
    // Animate avatar entrance
    avatarScale.value = withSpring(1, { damping: 15 });
    
    // Animate vitality badge
    vitalityOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    
    // Animate progress bar
    progressWidth.value = withDelay(400, withTiming(goal.progress, { duration: 1000 }));
  }, [goal?.progress, goal?.vitality, avatarScale, vitalityOpacity, progressWidth, goal]);

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
  
  if (!goal) {
    return (
      <>
        <Stack.Screen options={{ title: 'Goal Not Found' }} />
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Goal not found</Text>
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
    <AvatarRenderer type={goal.avatar.type as any} vitality={goal.vitality} size={120} animated />
  );

  const getVitalityLevel = (vitality: number) => {
    if (vitality >= 80) return { label: 'Thriving', color: '#22C55E', emoji: '🌟' };
    if (vitality >= 60) return { label: 'Growing', color: '#3B82F6', emoji: '🌱' };
    if (vitality >= 40) return { label: 'Developing', color: '#F59E0B', emoji: '🌿' };
    return { label: 'Starting', color: '#EF4444', emoji: '🌱' };
  };

  const vitalityInfo = getVitalityLevel(goal.vitality);

  // Action handlers with feedback
  const handleChatWithAvatar = () => {
    // For now, show a coming soon alert since routes don't exist yet
    Alert.alert(
      `💬 Chat with ${goal.avatar.name}`,
      "Coming soon! You'll be able to have conversations with your avatar companion about your progress and goals.",
      [{ text: "Got it!", style: "default" }]
    );
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
      `You're ${goal.progress}% complete with your goal "${goal.title}"!\n\nTarget: ${goal.targetDate}\nVitality: ${goal.vitality}%`,
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
            <Text style={styles.avatarName}>{goal.avatar.name}</Text>
            <Text style={styles.avatarPersonality}>{goal.avatar.personality}</Text>
            <Animated.View style={[styles.vitalityContainer, animatedVitalityStyle]}>
              <TouchableOpacity
                onPress={() => Alert.alert(
                  `${vitalityInfo.emoji} ${vitalityInfo.label}`,
                  `Your avatar's vitality is at ${goal.vitality}%. This reflects your progress and engagement with the goal. Keep up the great work!`,
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
                    {goal.vitality}%
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Goal Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.goalDescription}>{goal.description}</Text>
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
              <Text style={styles.categoryEmoji}>{categoryEmojis[goal.category]}</Text>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {goal.category}
              </Text>
            </View>
          </View>
        </View>
        
        {/* My Why Section */}
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

        {/* Avatar Companion Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionEmoji}>🤖</Text>
            </View>
            <Text style={styles.sectionTitle}>Avatar Companion</Text>
          </View>
          <View style={[styles.card, styles.companionCard]}>
            <Text style={styles.companionName}>{goal.avatar.name}</Text>
            <Text style={styles.companionType}>{goal.avatar.type.charAt(0).toUpperCase() + goal.avatar.type.slice(1)} Avatar</Text>
            <Text style={styles.companionPersonality}>&quot;{goal.avatar.personality}&quot;</Text>
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
                <Text style={styles.statValue}>{goal.targetDate}</Text>
                <Text style={styles.statLabel}>Target Date</Text>
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
              {goal.habits.map((habit, index) => (
                <View key={index} style={styles.habitItem}>
                  <View style={styles.habitDot} />
                  <Text style={styles.habitText}>{habit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Obstacles Section */}
        {goal.obstacles.length > 0 && (
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
            <Text style={styles.primaryActionText}>💬 Chat with {goal.avatar.name}</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
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