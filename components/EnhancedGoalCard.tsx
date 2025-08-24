import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Pressable 
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PlantAvatar, PetAvatar, RobotAvatar, BaseAvatar } from '@/components/avatars';
import { useTheme } from '@/hooks/useTheme';

export interface GoalData {
  id: string;
  title: string;
  progress: number; // 0-100
  completedToday: number;
  totalToday: number;
  nextAction?: string;
  category: 'fitness' | 'wellness' | 'learning' | 'creativity';
  avatar: {
    type: 'plant' | 'pet' | 'robot' | 'base';
    name: string;
  };
  streak?: number;
}

interface Props {
  goal: GoalData;
  layout?: 'detailed' | 'compact';
  onPress?: () => void;
  onComplete?: () => void;
  style?: any;
}

export function EnhancedGoalCard({ 
  goal, 
  layout = 'detailed', 
  onPress, 
  onComplete,
  style 
}: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Animation values
  const pressAnimation = useSharedValue(1);
  const progressAnimation = useSharedValue(0);
  
  React.useEffect(() => {
    progressAnimation.value = withTiming(goal.progress / 100, { duration: 1200 });
  }, [goal.progress]);
  
  // Get avatar component
  const getAvatarComponent = () => {
    const components = {
      plant: PlantAvatar,
      pet: PetAvatar,
      robot: RobotAvatar,
      base: BaseAvatar,
    };
    return components[goal.avatar.type] || BaseAvatar;
  };
  
  // Smart contextual motivation based on progress and streaks
  const getContextualMotivation = () => {
    const { progress, completedToday, totalToday, streak = 0 } = goal;
    
    // Streak-based messages (highest priority)
    if (streak >= 7) {
      return `On fire! 🔥`;
    }
    
    if (streak >= 3) {
      return `Building momentum! ⚡`;
    }
    
    // Completion-based messages
    if (completedToday === totalToday) {
      return `Perfect day! 🎉`;
    }
    
    if (progress >= 90) {
      return `Almost complete! 🏆`;
    }
    
    if (progress >= 75) {
      return `Great progress! 💪`;
    }
    
    if (completedToday > 0) {
      return `Making progress! 👍`;
    }
    
    // Needs attention
    if (progress < 25 && streak === 0) {
      return `Needs attention 😐`;
    }
    
    return `Ready to start! ✨`;
  };

  // Get streak display text
  const getStreakDisplay = () => {
    const streak = goal.streak || 0;
    if (streak > 0) {
      return `Best: ${streak} day${streak === 1 ? '' : 's'}`;
    }
    return null;
  };
  
  // Get category colors and gradients with dynamic state adjustments
  const getCategoryColors = () => {
    const { progress, streak = 0, completedToday, totalToday } = goal;
    
    // Base colors by category
    let baseColors;
    switch (goal.category) {
      case 'fitness':
        baseColors = { 
          primary: '#ef4444', 
          secondary: '#f87171',
          gradient: ['rgba(239, 68, 68, 0.1)', 'rgba(248, 113, 113, 0.05)'],
          border: 'rgba(239, 68, 68, 0.2)'
        };
        break;
      case 'wellness': 
        baseColors = { 
          primary: '#10b981', 
          secondary: '#34d399',
          gradient: ['rgba(16, 185, 129, 0.1)', 'rgba(52, 211, 153, 0.05)'],
          border: 'rgba(16, 185, 129, 0.2)'
        };
        break;
      case 'learning':
        baseColors = { 
          primary: '#3b82f6', 
          secondary: '#60a5fa',
          gradient: ['rgba(59, 130, 246, 0.1)', 'rgba(96, 165, 250, 0.05)'],
          border: 'rgba(59, 130, 246, 0.2)'
        };
        break;
      case 'creativity':
        baseColors = { 
          primary: '#f59e0b', 
          secondary: '#fbbf24',
          gradient: ['rgba(245, 158, 11, 0.1)', 'rgba(251, 191, 36, 0.05)'],
          border: 'rgba(245, 158, 11, 0.2)'
        };
        break;
      default:
        baseColors = { 
          primary: '#6b7280', 
          secondary: '#9ca3af',
          gradient: ['rgba(107, 114, 128, 0.1)', 'rgba(156, 163, 175, 0.05)'],
          border: 'rgba(107, 114, 128, 0.2)'
        };
    }
    
    // Dynamic state adjustments
    if (completedToday === totalToday) {
      // Completed state - more vibrant
      return {
        ...baseColors,
        gradient: [baseColors.gradient[0].replace('0.1)', '0.15)'), baseColors.gradient[1].replace('0.05)', '0.1)')],
        border: baseColors.border.replace('0.2)', '0.3)')
      };
    }
    
    if (streak >= 7) {
      // Hot streak - add golden accent
      return {
        ...baseColors,
        gradient: ['rgba(255, 215, 0, 0.15)', baseColors.gradient[1]],
        border: 'rgba(255, 215, 0, 0.3)'
      };
    }
    
    if (progress < 25 && streak === 0) {
      // Needs attention - muted colors
      return {
        ...baseColors,
        primary: baseColors.secondary,
        gradient: [baseColors.gradient[0].replace('0.1)', '0.05)'), baseColors.gradient[1].replace('0.05)', '0.03)')],
        border: baseColors.border.replace('0.2)', '0.1)')
      };
    }
    
    return baseColors;
  };

  const colors = getCategoryColors();

  // Animated progress bar style
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));

  // Card press animation
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressAnimation.value }],
  }));

  const handlePressIn = () => {
    pressAnimation.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    pressAnimation.value = withSpring(1);
    onPress?.();
  };

  const AvatarComponent = getAvatarComponent();

  if (layout === 'compact') {
    return (
      <Animated.View style={[styles.compactCard, { borderColor: colors.border }, cardStyle, style]}>
        <LinearGradient
          colors={colors.gradient}
          style={styles.compactGradient}
        >
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.compactContent}
          >
          <View style={styles.compactLeft}>
            <AvatarComponent 
              vitality={75} 
              size={50} 
              animated={true}
            />
            <View style={styles.compactInfo}>
              <Text style={styles.compactTitle}>{goal.title}</Text>
              <Text style={styles.compactProgress}>
                {goal.completedToday}/{goal.totalToday} today
              </Text>
              {getStreakDisplay() && (
                <Text style={styles.compactStreak}>🔥 {getStreakDisplay()}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.compactRight}>
            <View style={styles.progressRingContainer}>
              <Text style={[styles.progressText, { color: colors.primary }]}>
                {goal.progress}%
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.completeButton, { backgroundColor: colors.primary }]}
              onPress={onComplete}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
          </Pressable>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Detailed layout
  return (
    <Animated.View style={[styles.detailedCard, { borderColor: colors.border }, cardStyle, style]}>
      <LinearGradient
        colors={colors.gradient}
        style={styles.gradientBackground}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.detailedContent}
        >
        {/* Header with progress */}
        <View style={styles.header}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.motivation}>{getContextualMotivation()}</Text>
            {getStreakDisplay() && (
              <Text style={styles.streakText}>🔥 {getStreakDisplay()}</Text>
            )}
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressRing}>
              <Text style={[styles.progressPercentage, { color: colors.primary }]}>
                {goal.progress}%
              </Text>
            </View>
          </View>
        </View>

        {/* Avatar and next action */}
        <View style={styles.actionSection}>
          <View style={styles.avatarContainer}>
            <AvatarComponent 
              vitality={75} 
              size={60} 
              animated={true}
            />
            <Text style={styles.avatarStatus}>
              {goal.progress >= 75 ? 'Thriving! 🌱' : 
               goal.progress >= 50 ? 'Growing! 🌿' : 
               goal.progress >= 25 ? 'Sprouting! 🌱' : 'Ready! ✨'}
            </Text>
          </View>
          
          <View style={styles.nextAction}>
            {goal.nextAction ? (
              <>
                <Text style={styles.nextLabel}>Next:</Text>
                <Text style={styles.nextText}>{goal.nextAction}</Text>
              </>
            ) : (
              <Text style={styles.nextText}>Ready for action!</Text>
            )}
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                progressBarStyle,
                { backgroundColor: colors.primary }
              ]} 
            />
          </View>
          <Text style={styles.progressLabel}>
            {goal.completedToday} of {goal.totalToday} completed today
          </Text>
        </View>

        {/* Action button */}
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onComplete}
        >
          <Text style={styles.primaryButtonText}>
            {goal.completedToday < goal.totalToday ? 'Complete' : 'View Details'}
          </Text>
          {goal.completedToday < goal.totalToday && (
            <Text style={styles.holdHint}>Hold to complete</Text>
          )}
        </TouchableOpacity>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  // Detailed Layout
  detailedCard: {
    borderRadius: 20,
    margin: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
  },
  detailedContent: {
    padding: 20,
    backgroundColor: theme.cardBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  goalInfo: {
    flex: 1,
    paddingRight: 16,
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
    lineHeight: 26,
  },
  motivation: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  streakText: {
    fontSize: 12,
    color: '#ff6b35',
    fontWeight: '600',
    marginTop: 2,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatarStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  nextAction: {
    flex: 1,
  },
  nextLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  nextText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  holdHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Compact Layout  
  compactCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  compactGradient: {
    flex: 1,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.cardBackground,
  },
  compactLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  compactProgress: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  compactStreak: {
    fontSize: 10,
    color: '#ff6b35',
    fontWeight: '600',
    marginTop: 1,
  },
  compactRight: {
    alignItems: 'center',
  },
  progressRingContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});